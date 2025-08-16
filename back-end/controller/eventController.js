const Event = require("../models/Event");
const User = require("../models/User");
const Subscription = require('../models/Subscription');
const sendMessage = require("../utils/send-message");
const Unavailability = require("../models/Unavailability");
const Monitoring = require("../models/Monitoring");
const slugify = require("slugify");
const Attendance = require("../models/Attendance");
const webpush = require("web-push");
require("dotenv").config();

webpush.setVapidDetails(
    "mailto:example@yourdomain.org",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

exports.createEvent = async (req, res) => {
    try {
        let generate_slug_number = Math.floor(100 + Math.random() * 900).toString();
        const slug = slugify(req.body.name, { lower: true, strict: true }) + "-" + generate_slug_number;

        const newEvent = new Event({
            ...req.body,
            slug,
        });

        const savedEvent = await newEvent.save();

        // Prepare Unavailability ops
        const ops = [];

        // Tambah Unavailability untuk user gudang
        newEvent.gudang.forEach(g => {
            ops.push({
                updateOne: {
                    filter: { user_id: g.user_id, date: newEvent.date_prepare },
                    update: { user_id: g.user_id, date: newEvent.date_prepare },
                    upsert: true,
                }
            });
        });

        // Tambah Unavailability untuk user dapur (penanggung jawab)
        newEvent.dapur.forEach(d => {
            d.penanggung_jawab.forEach(pj => {
                ops.push({
                    updateOne: {
                        filter: { user_id: pj.user_id, date: newEvent.date_service },
                        update: { user_id: pj.user_id, date: newEvent.date_service },
                        upsert: true,
                    },
                });
            });
        });

        if (ops.length) {
            await Unavailability.bulkWrite(ops);
        }

        res.status(200).json({
            message: "Berhasil membuat acara!",
            data: savedEvent,
            success: true,
        });

        // Notifikasi WhatsApp
        (async () => {
            const userIdGudang = newEvent.gudang.map(item => item.user_id.toString());
            const userIdDapur = newEvent.dapur.flatMap(menu =>
                menu.penanggung_jawab.map(pj => pj.user_id.toString())
            );
            const userIdSupervisor = newEvent.supervisor?.id?.toString();
            const allUserId = [...new Set([
                ...userIdGudang,
                ...userIdDapur,
                ...(userIdSupervisor ? [userIdSupervisor] : [])
            ])];

            const users = await User.find({ _id: { $in: allUserId } });

            let batch = [];
            for (let i = 0; i < users.length; i++) {
                batch.push(users[i]);

                // Kirim batch setiap 10 user atau terakhir
                const isLast = i === users.length - 1;
                if (batch.length === 10 || isLast) {
                    for (const user of batch) {
                        const phoneFormatted = user.phone.replace(/^0/, "+62");
                        const message = `Hai ${user.name}, kamu mendapatkan tugas baru di event *${newEvent.name}*\n\n` +
                            `📛 Nama: ${newEvent.name}\n` +
                            `📅 Prepare: ${newEvent.date_prepare.toLocaleDateString("id", "ID")}\n` +
                            `📅 Service:  ${newEvent.date_service.toLocaleDateString("id", "ID")}\n` +
                            `📍 Lokasi: ${newEvent.location?.name || '-'}\n\n` +
                            `Cek dan konfirmasi sekarang di aplikasi 👇:\n` +
                            `link website: ${process.env.FRONTEND_ORIGIN}\n` +
                            `Jika belum, buka Chrome dan pilih opsi "Tambahkan ke layar utama" untuk membuatnya mirip dengan aplikasi.😉`;
                        try {
                            await sendMessage(phoneFormatted, message);
                        } catch (err) {
                            console.error("Gagal kirim pesan ke", user._id, err);
                        }
                    }

                    batch = [];

                    // Delay 2 menit KECUALI kalau itu batch terakhir
                    if (!isLast) {
                        console.log("Menunggu 2 menit sebelum batch selanjutnya...");
                        await new Promise(resolve => setTimeout(resolve, 120000));
                    }
                }
            }
        })().catch(err => {
            console.error("Error dalam notifikasi:", err);
        });

    } catch (error) {
        console.error("Error saat membuat event:", error);
        return res.status(500).json({
            message: "Terjadi Kesalahan Saat Membuat Acara!",
            error: error.message,
            success: false,
        });
    }
};


exports.getAllEvent = async (req, res) => {

    try {
        const events = await Event.find()
            .populate('supervisor.id', 'name')
            .populate("gudang.user_id")
            .populate("gudang.jobdesk")
            .populate("dapur.penanggung_jawab.user_id");

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan semua event!",
            data: events,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Gagal mendapatkan semua event!",
            error: error.message,
        });
    }
}

exports.getEventById = async (req, res) => {

    try {
        const event = await Event.findById(req.params.id)
            .populate('supervisor.id', 'name')
            .populate("gudang.user_id")
            .populate("gudang.jobdesk")
            .populate("dapur.penanggung_jawab.user_id", 'name')
            .populate("gudang.jobdesk");

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event tidak ditemukan!",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan event!",
            data: event,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Gagal mendapatkan event!",
            error: error.message,
        });
    }
}


exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Ambil data event lama
        const oldEvent = await Event.findById(id);
        if (!oldEvent) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // ===== Supervisor Logic (tambahkan guard agar tidak crash saat tidak ada supervisor lama / baru) =====
        let supervisorPayload;
        const supervisorBaruId = updateData?.supervisor?.id;
        if (!supervisorBaruId) {
            return res.status(400).json({ success: false, message: 'Supervisor wajib diisi' });
        }

        const oldSupervisorId = oldEvent?.supervisor?.id ? oldEvent.supervisor.id.toString() : null;
        if (oldSupervisorId && oldSupervisorId === supervisorBaruId) {
            supervisorPayload = {
                id: supervisorBaruId,
                confirmation: oldEvent.supervisor.confirmation
            };
        } else {
            const gudangData = oldEvent.gudang.find(g => g.user_id.toString() === supervisorBaruId);
            supervisorPayload = { id: supervisorBaruId, confirmation: gudangData?.confirmation === 'bisa' ? 'bisa' : 'menunggu' };
        }

        const slug = slugify(updateData.name, { lower: true, strict: true });

        // ===== Normalisasi tipe Date agar .toISOString() tidak error (sebelumnya string) =====
        const datePrepareObj = updateData.date_prepare ? new Date(updateData.date_prepare) : null;
        const dateServiceObj = updateData.date_service ? new Date(updateData.date_service) : null;
        if (datePrepareObj && isNaN(datePrepareObj.getTime())) {
            return res.status(400).json({ success: false, message: 'Format date_prepare tidak valid' });
        }
        if (dateServiceObj && isNaN(dateServiceObj.getTime())) {
            return res.status(400).json({ success: false, message: 'Format date_service tidak valid' });
        }

        // Build payload baru seluruhnya
        const updatedPayload = {
            name: updateData.name,
            slug: slug,
            porsi: updateData.porsi,
            date_prepare: datePrepareObj,
            time_start_prepare: updateData.time_start_prepare,
            time_end_prepare: updateData.time_end_prepare,
            date_service: dateServiceObj,
            time_start_service: updateData.time_start_service,
            time_end_service: updateData.time_end_service,
            location: updateData.location,
            supervisor: supervisorPayload,
            gudang: updateData.gudang,
            dapur: updateData.dapur
        };

        // Update event dulu, baru proses Unavailability
        const updatedEvent = await Event.findByIdAndUpdate(id, updatedPayload, { new: true });
        if (!updatedEvent) {
            return res.status(404).json({ success: false, message: 'Gagal update event' });
        }

        // Gabungkan semua upsert Unavailability dalam satu batch, tanpa duplikasi, dan pastikan yang sudah konfirmasi 'tidak bisa' tetap ada
        const opsMap = new Map();
        // 1️⃣ Pertahankan semua yang "tidak bisa" dari event lama
        if (oldEvent.supervisor?.id && oldEvent.supervisor.confirmation === 'tidak bisa' && datePrepareObj) {
            // Supervisor diblokir pada kedua tanggal (prepare & service) agar tidak bisa dipilih lagi
            opsMap.set(`${oldEvent.supervisor.id}_${datePrepareObj.toISOString()}`, {
                user_id: oldEvent.supervisor.id,
                date: datePrepareObj
            });
            if (dateServiceObj) {
                opsMap.set(`${oldEvent.supervisor.id}_${dateServiceObj.toISOString()}`, {
                    user_id: oldEvent.supervisor.id,
                    date: dateServiceObj
                });
            }
        }
        if (Array.isArray(oldEvent.gudang)) {
            oldEvent.gudang.forEach(g => {
                if (g.confirmation === 'tidak bisa') {
                    // Blokir tanggal prepare
                    if (datePrepareObj) opsMap.set(`${g.user_id}_${datePrepareObj.toISOString()}`, {
                        user_id: g.user_id,
                        date: datePrepareObj
                    });
                    // Jika gudang ikut tahap service (umumnya iya) blokir juga tanggal service
                    if (dateServiceObj) {
                        opsMap.set(`${g.user_id}_${dateServiceObj.toISOString()}`, {
                            user_id: g.user_id,
                            date: dateServiceObj
                        });
                    }
                }
            });
        }
        if (Array.isArray(oldEvent.dapur)) {
            oldEvent.dapur.forEach(d => {
                if (Array.isArray(d.penanggung_jawab)) {
                    d.penanggung_jawab.forEach(pj => {
                        if (pj.confirmation === 'tidak bisa') {
                            if (dateServiceObj) opsMap.set(`${pj.user_id}_${dateServiceObj.toISOString()}`, {
                                user_id: pj.user_id,
                                date: dateServiceObj
                            });
                        }
                    });
                }
            });
        }
        // Semua user gudang baru (jika ada perubahan)
        if (Array.isArray(updatedPayload.gudang)) {
            updatedPayload.gudang.forEach(g => {
                if (datePrepareObj) opsMap.set(`${g.user_id}_${datePrepareObj.toISOString()}`, {
                    user_id: g.user_id,
                    date: datePrepareObj
                });
            });
        }
        // Semua user dapur baru (jika ada perubahan)
        if (Array.isArray(updatedPayload.dapur)) {
            updatedPayload.dapur.forEach(d => {
                d.penanggung_jawab.forEach(pj => {
                    if (dateServiceObj) opsMap.set(`${pj.user_id}_${dateServiceObj.toISOString()}`, {
                        user_id: pj.user_id,
                        date: dateServiceObj
                    });
                });
            });
        }
        // Penanggung jawab dapur lama yang konfirmasi 'tidak bisa' dan sudah tidak ada di dapur baru tetap di-unavailable-kan di tanggal service
        if (Array.isArray(oldEvent.dapur)) {
            oldEvent.dapur.forEach((oldDapur) => {
                if (Array.isArray(oldDapur.penanggung_jawab)) {
                    oldDapur.penanggung_jawab.forEach((oldPj) => {
                        if (oldPj?.confirmation === 'tidak bisa') {
                            const masihAda = Array.isArray(updatedPayload.dapur) && updatedPayload.dapur.some(newDapur =>
                                Array.isArray(newDapur.penanggung_jawab) &&
                                newDapur.penanggung_jawab.some(newPj => newPj.user_id.toString() === oldPj.user_id.toString())
                            );
                            if (!masihAda) {
                                if (dateServiceObj) opsMap.set(`${oldPj.user_id}_${dateServiceObj.toISOString()}`, {
                                    user_id: oldPj.user_id,
                                    date: dateServiceObj
                                });
                            }
                        }
                    });
                }
            });
        }
        // Jalankan bulkWrite hanya sekali
        const ops = Array.from(opsMap.values()).map(({ user_id, date }) => ({
            updateOne: {
                filter: { user_id, date },
                update: { user_id, date },
                upsert: true,
            }
        }));
        if (ops.length) {
            await Unavailability.bulkWrite(ops);
        }

        // KUMPULKAN USER LAMA & BARU UNTUK NOTIFIKASI PENAMBAHAN (memperbaiki bug ReferenceError)
        const oldUserIds = [];
        if (oldEvent.supervisor?.id) oldUserIds.push(oldEvent.supervisor.id.toString());
        oldEvent.gudang.forEach(g => {
            if (g.user_id) oldUserIds.push(g.user_id.toString());
        });
        oldEvent.dapur.forEach(d => {
            d.penanggung_jawab.forEach(pj => {
                if (pj.user_id) oldUserIds.push(pj.user_id.toString());
            });
        });

        const newUserIds = [];
        if (updatedEvent.supervisor?.id) newUserIds.push(updatedEvent.supervisor.id.toString());
        updatedEvent.gudang.forEach(g => {
            if (g.user_id) newUserIds.push(g.user_id.toString());
        });
        updatedEvent.dapur.forEach(d => {
            d.penanggung_jawab.forEach(pj => {
                if (pj.user_id) newUserIds.push(pj.user_id.toString());
            });
        });

        const uniqueOldUserIds = [...new Set(oldUserIds)];
        const uniqueNewUserIds = [...new Set(newUserIds)];
        const addedUserIds = uniqueNewUserIds.filter(id => !uniqueOldUserIds.includes(id));

        for (const userId of addedUserIds) {
            const user = await User.findById(userId);
            if (!user || !user.phone) continue;

            const phoneFormatted = user.phone.replace(/^0/, '+62');
            const message = `Hai ${user.name}, kamu mendapatkan tugas baru di event *${updatedEvent.name}*\n\n` +
                `📛 Nama: ${updatedEvent.name}\n` +
                `📅 Prepare: ${updatedEvent.date_prepare.toLocaleDateString("id", "ID")}\n` +
                `📅 Service:  ${updatedEvent.date_service.toLocaleDateString("id", "ID")}\n` +
                `📍 Lokasi: ${updatedEvent.location?.name || '-'}\n\n` +
                `Cek dan konfirmasi sekarang di aplikasi 👇:\n` +
                `link login website: ${process.env.FRONTEND_ORIGIN}\n` +
                `Jika belum, buka Chrome dan pilih opsi "Tambahkan ke layar utama" untuk membuatnya mirip dengan aplikasi.😉`;
            await sendMessage(phoneFormatted, message)
                .catch(err => {
                    console.error(`Gagal kirim pesan ke ${userId}:`, err);
                });
        }

        // Cek apakah perubahan hanya pada tanggal, jam, lokasi
        const isTanggalBerubah =
            oldEvent.date_prepare?.toISOString() !== new Date(updateData.date_prepare).toISOString() ||
            oldEvent.date_service?.toISOString() !== new Date(updateData.date_service).toISOString();


        const isJamBerubah =
            oldEvent.time_start_prepare !== updateData.time_start_prepare ||
            oldEvent.time_end_prepare !== updateData.time_end_prepare ||
            oldEvent.time_start_service !== updateData.time_start_service ||
            oldEvent.time_end_service !== updateData.time_end_service;

        const isLokasiBerubah =
            oldEvent.location?.name !== updateData.location?.name ||
            oldEvent.location?.latitude !== updateData.location?.latitude ||
            oldEvent.location?.longitude !== updateData.location?.longitude;

        const oldGudangIds = oldEvent.gudang.map(g => g.user_id.toString()).sort().join(',');
        const newGudangIds = updatedEvent.gudang.map(g => g.user_id.toString()).sort().join(',');
        const isDaftarGudangBerubah = oldGudangIds !== newGudangIds;


        const oldDapurIds = oldEvent.dapur.flatMap(d => d.penanggung_jawab.map(p => p.user_id.toString())).sort().join(',');
        const newDapurIds = updatedEvent.dapur.flatMap(d => d.penanggung_jawab.map(p => p.user_id.toString())).sort().join(',');
        const isDaftarDapurBerubah = oldDapurIds !== newDapurIds;

        const hanyaTanggalJamLokasiYangBerubah = (
            (isTanggalBerubah || isJamBerubah || isLokasiBerubah) &&
            !isDaftarGudangBerubah && !isDaftarDapurBerubah
        );

        // Kirim pesan jika hanya tanggal/jam/lokasi yang berubah
        if (hanyaTanggalJamLokasiYangBerubah) {
            const gudangUserIds = updatedEvent.gudang
                .filter(g => g.confirmation === 'bisa')
                .map(g => g.user_id.toString());

            const dapurUserIds = updatedEvent.dapur.flatMap(d =>
                d.penanggung_jawab
                    .filter(p => p.confirmation === 'bisa')
                    .map(p => p.user_id.toString())
            );

            const supervisorUserId = updatedEvent.supervisor?.id?.toString();
            const isSupervisorConfirmed = updatedEvent.supervisor?.confirmation === 'bisa';

            const allUserIds = [
                ...new Set([
                    ...gudangUserIds,
                    ...dapurUserIds,
                    ...(isSupervisorConfirmed && supervisorUserId ? [supervisorUserId] : [])
                ])
            ];
            const users = await User.find({ _id: { $in: allUserIds } });

            let batch = [];
            for (let i = 0; i < users.length; i++) {
                batch.push(users[i]);

                const isLast = i === users.length - 1;
                if (batch.length === 10 || isLast) {
                    for (const user of batch) {
                        const phoneFormatted = user.phone.replace(/^0/, "+62");
                        const message = `Hai ${user.name}, event *${updatedEvent.name}* yang kamu ikuti mengalami perubahan jadwal atau lokasi.\n\n` +
                            `📛 Nama: ${updatedEvent.name}\n` +
                            `📅 Prepare: ${updatedEvent.date_prepare.toLocaleDateString("id", "ID")}\n` +
                            `📅 Service:  ${updatedEvent.date_service.toLocaleDateString("id", "ID")}\n` +
                            `📍 Lokasi: ${updatedEvent.location?.name || '-'}\n\n` +
                            `Cek kembali detailnya di aplikasi 👇:\n` +
                            ` ${process.env.FRONTEND_ORIGIN} \n` +
                            `Jika belum, buka Chrome dan pilih opsi "Tambahkan ke layar utama" untuk membuatnya mirip dengan aplikasi.😉`;
                        try {
                            await sendMessage(phoneFormatted, message);
                            console.log("✅ Pesan terkirim ke", user.name);
                        } catch (err) {
                            console.error(`Gagal kirim pesan ke ${user._id}:`, err);
                        }
                    }

                    batch = [];
                    if (!isLast) {
                        console.log("Menunggu 2 menit sebelum batch selanjutnya...");
                        await new Promise(resolve => setTimeout(resolve, 120000));
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            message: 'Acara berhasil diupdate!',
            event: updatedEvent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi Kesalahan Saat Mengubah Acara!', error: error.message });
    }
};


exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Ambil data event dulu dengan populate
        const event = await Event.findById(id)
            .populate('gudang.user_id', 'nama no_telp')
            .populate('dapur.penanggung_jawab.user_id', 'nama no_telp')
            .populate('supervisor.id', 'nama no_telp');

        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // Normalisasi tanggal ke jam 00:00:00
        const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const tanggalPrepare = normalizeDate(new Date(event.date_prepare));
        const tanggalService = normalizeDate(new Date(event.date_service));

        const allUserIds = new Set();

        if (event.supervisor?.id?._id) {
            allUserIds.add(event.supervisor.id._id.toString());
        }

        event.gudang.forEach(g => g.user_id?._id && allUserIds.add(g.user_id._id.toString()));
        event.dapur.forEach(menu => menu.penanggung_jawab.forEach(pj => pj.user_id?._id && allUserIds.add(pj.user_id._id.toString())));

        // Hapus semua data terkait dulu
        await Unavailability.deleteMany({
            user_id: { $in: Array.from(allUserIds) },
            $or: [
                { date: { $gte: tanggalPrepare, $lt: new Date(tanggalPrepare.getTime() + 86400000) } },
                { date: { $gte: tanggalService, $lt: new Date(tanggalService.getTime() + 86400000) } },
            ],
        });

        await Attendance.deleteMany({ event_id: id });
        await Monitoring.deleteMany({ event_id: id });

        // Hapus event utama
        const deleted = await Event.findByIdAndDelete(id);

        // Kirim response lebih dulu supaya frontend tidak timeout
        res.status(200).json({
            success: true,
            message: "Berhasil Menghapus Acara!",
            data: deleted,
        });

        // Lanjut kirim pesan pembatalan di background (tidak menahan response)
        if (event.status === "terjadwal") {
            const users = await User.find({ _id: { $in: [...allUserIds] } });

            let batch = [];
            for (let i = 0; i < users.length; i++) {
                batch.push(users[i]);

                const isLast = i === users.length - 1;
                if (batch.length === 10 || isLast) {
                    for (const user of batch) {
                        const phoneFormatted = user.phone.replace(/^0/, "+62");
                        const msg = `* [Pembatalan Event] *\n` +
                            `Hai ${user.name}, berikut informasi pembatalan acara:\n\n` +
                            `📛 Nama: ${event.name}\n` +
                            `📅 Prepare: ${tanggalPrepare.toLocaleDateString("id", "ID")}\n` +
                            `📅 Service: ${tanggalService.toLocaleDateString("id", "ID")}\n` +
                            `📍 Lokasi: ${event.location?.name || '-'}\n\n` +
                            `Mohon perhatian, event ini telah dibatalkan.`;

                        try {
                            await sendMessage(phoneFormatted, msg);
                        } catch (err) {
                            console.error(`❌ Gagal kirim ke ${user.name} (${phoneFormatted})`, err);
                        }
                    }

                    batch = [];
                    if (!isLast) {
                        console.log("Menunggu 2 menit sebelum batch selanjutnya...");
                        await new Promise(resolve => setTimeout(resolve, 120000));
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error saat menghapus event:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan Saat Menghapus Acara!"
        });
    }
};

exports.getAssignedEvents = async (req, res) => {
    try {
        const { slug } = req.params;
        const user = await User.findOne({ slug });

        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const events = await Event.find({
            $or: [
                { 'gudang.user_id': user._id },
                { 'dapur.penanggung_jawab.user_id': user._id },
                { 'supervisor.id': user._id },
                { "jobdesk": user.jobdesk.map(j => j._id) }
            ]
        }).populate({
            path: 'gudang.user_id dapur.penanggung_jawab.user_id supervisor.id',
            select: 'slug name'
        });

        res.status(200).json({
            message: 'Berhasil mengambil assigned events',
            data: events,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil assigned events' });
    }
};

exports.confirm = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, status, kategori, menu } = req.body;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        const kategoriLower = kategori.toLowerCase();
        // Tentukan tanggal yang perlu diblokir berdasarkan kategori & tahap kerja
        const targetDates = new Set();
        if (kategoriLower === 'gudang') {
            // Gudang biasa bekerja di kedua hari (prepare & service)
            if (event.date_prepare) targetDates.add(event.date_prepare);
            if (event.date_service) targetDates.add(event.date_service);
        } else if (kategoriLower === 'dapur') {
            // Dapur hanya service
            if (event.date_service) targetDates.add(event.date_service);
        } else if (kategoriLower === 'supervisor') {
            // Supervisor ada di kedua hari
            if (event.date_prepare) targetDates.add(event.date_prepare);
            if (event.date_service) targetDates.add(event.date_service);
        }

        if (status === "tidak bisa") {
            // Upsert Unavailability untuk seluruh targetDates
            for (const tgl of targetDates) {
                const exists = await Unavailability.findOne({ user_id: userId, date: tgl });
                if (!exists) {
                    await Unavailability.create({ user_id: userId, date: tgl });
                }
            }

            const direktur = await User.findOne({ role: 'direktur' });
            const subscription = await Subscription.findOne({ user_id: direktur._id });
            const user = await User.findById(userId);

            if (subscription) {
                const payload = JSON.stringify({
                    title: 'Konfirmasi Tidak Bisa Hadir',
                    body: `${user.name} tidak bisa hadir untuk event "${event.name}"`,
                    icon: '/icons/LOGO-PERUSAHAAN.ico',
                });

                try {
                    await webpush.sendNotification(subscription.subscription, payload);
                } catch (err) {
                    console.error("Gagal kirim notifikasi ke direktur:", err);
                }
            }
        }

        // Update konfirmasi di event
        if (kategoriLower === 'gudang') {
            const empIndex = event.gudang.findIndex(e => e.user_id.toString() === userId);
            if (empIndex === -1) return res.status(404).json({ message: 'Karyawan tidak ditemukan di Gudang' });
            event.gudang[empIndex].confirmation = status;
            // Tidak lagi langsung dihapus saat 'tidak bisa'; biarkan tetap tampil sampai admin mengganti.
        } else if (kategoriLower === 'dapur') {
            const menuObj = event.dapur.find(d => d.menu === menu);
            if (!menuObj) return res.status(404).json({ message: 'Menu dapur tidak ditemukan' });
            const pj = menuObj.penanggung_jawab.find(p => p.user_id.toString() === userId);
            if (!pj) return res.status(404).json({ message: 'Penanggung jawab tidak ditemukan' });
            pj.confirmation = status;
            // Tidak lagi menghapus otomatis penanggung jawab 'tidak bisa'.
        } else if (kategoriLower === 'supervisor') {
            if (!event.supervisor || event.supervisor.id.toString() !== userId) {
                return res.status(404).json({ message: 'Supervisor tidak sesuai' });
            }
            event.supervisor.confirmation = status;
            if (status === 'tidak bisa') {
                // Kosongkan supervisor agar bisa diganti
                event.supervisor = { id: event.supervisor.id, confirmation: 'tidak bisa' };
            }
        } else {
            return res.status(400).json({ message: 'Kategori tidak valid' });
        }

        await event.save();
        return res.status(200).json({ message: 'Konfirmasi kehadiran berhasil', success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal konfirmasi kehadiran' });
    }
};



exports.getAvailableEmployees = async (req, res) => {
    try {
        const { date_prepare, date_service } = req.query;

        const blocked = new Set();

        const queryDates = [];
        if (date_prepare) queryDates.push(new Date(date_prepare));
        if (date_service) queryDates.push(new Date(date_service));

        let prepareEvents = [];
        let serviceEvents = [];

        if (date_prepare) {
            prepareEvents = await Event.find({
                date_prepare: new Date(date_prepare)
            }).populate('supervisor.id', 'name') // hanya ambil nama supervisor
                .populate('gudang.user_id', 'name') // hanya ambil nama user gudang
                .populate('dapur.penanggung_jawab.user_id', 'name'); // hanya ambil nama user dapur
        }

        if (date_service) {
            serviceEvents = await Event.find({
                date_service: new Date(date_service)
            }).populate('supervisor.id', 'name')
                .populate('gudang.user_id', 'name')
                .populate('dapur.penanggung_jawab.user_id', 'name');
        }

        // Proses masing-masing
        prepareEvents.forEach(ev => {
            if (ev.supervisor?.id?._id) {
                blocked.add(ev.supervisor.id._id.toString());
            }
            ev.gudang?.forEach(g => {
                if (g.tahap?.includes('prepare') && g.user_id?._id) {
                    blocked.add(g.user_id._id.toString());
                }
            });
        });

        serviceEvents.forEach(ev => {
            if (ev.supervisor?.id?._id) {
                blocked.add(ev.supervisor.id._id.toString());
            }
            ev.gudang?.forEach(g => {
                if (g.tahap?.includes('service') && g.user_id?._id) {
                    blocked.add(g.user_id._id.toString());
                }
            });
            ev.dapur?.forEach(d => {
                d.penanggung_jawab?.forEach(pj => {
                    if (pj.user_id?._id) {
                        blocked.add(pj.user_id._id.toString());
                    }
                });
            });
        });


        // Blokir dari prepareEvents
        prepareEvents.forEach(ev => {
            if (ev.supervisor?.id?._id) {
                blocked.add(ev.supervisor.id._id.toString());
            }

            ev.gudang?.forEach(g => {
                if (g.tahap?.includes('prepare') && g.user_id?._id) {
                    blocked.add(g.user_id._id.toString());
                }
            });

            // ❌ Jangan blokir dapur di tahap prepare
        });

        // Blokir dari serviceEvents
        serviceEvents.forEach(ev => {
            if (ev.supervisor?.id?._id) {
                blocked.add(ev.supervisor.id._id.toString());
            }

            ev.gudang?.forEach(g => {
                if (g.tahap?.includes('service') && g.user_id?._id) {
                    blocked.add(g.user_id._id.toString());
                }
            });

            ev.dapur?.forEach(d => {
                d.penanggung_jawab?.forEach(pj => {
                    if (pj.user_id?._id) {
                        blocked.add(pj.user_id._id.toString());
                    }
                });
            });
        });

        // Ambil user yang tidak tersedia di tanggal prepare dan tanggal service
        const unavailPrepare = date_prepare
            ? await Unavailability.find({ date: new Date(date_prepare) }).distinct("user_id")
            : [];

        const unavailService = date_service
            ? await Unavailability.find({ date: new Date(date_service) }).distinct("user_id")
            : [];

        // Gabungkan semua user yang unavailable di salah satu tanggal (union)
        const allUnavailable = Array.from(new Set([
            ...unavailPrepare.map(id => id.toString()),
            ...unavailService.map(id => id.toString())
        ]));

        allUnavailable.forEach(id => blocked.add(id));


        // Ambil semua karyawan yang tidak diblok
        const available = await User.find({
            _id: { $nin: Array.from(blocked) },
            role: 'karyawan'
        }).populate('jobdesk', 'name category description');


        return res.json({ success: true, data: available });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


exports.getEventInfoForEmployee = async (req, res) => {
    const { slug, id } = req.params;

    try {
        const event = await Event.findById(id)
            .populate('supervisor.id', 'name slug')
            .populate('gudang.user_id', 'name slug')
            .populate('gudang.jobdesk')
            .populate('dapur.penanggung_jawab.user_id', 'name slug');

        if (!event) return res.status(404).json({ message: 'Event not found' });

        const user = await User.findOne({ slug });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Identify role
        let role = null;
        let jobdeskNames = [];

        if (event.supervisor.id && event.supervisor.id.slug === slug) {
            role = 'supervisor';
        } else {
            const gudangEntry = event.gudang.find(g => g.user_id?.slug === slug);
            if (gudangEntry) {
                role = 'gudang';
                jobdeskNames = gudangEntry.jobdesk.map(j => ({
                    name: j.name,
                    description: j.description
                }));
            } else {
                for (const d of event.dapur) {
                    const pj = d.penanggung_jawab.find(pj => pj.user_id?.slug === slug);
                    if (pj) {
                        role = 'dapur';
                        jobdeskNames = [{
                            name: d.menu,
                            description: `Stan: ${d.stan}, Porsi: ${d.jumlah_porsi}, Penanggung Jawab: ${pj.user_id.name} `
                        }];
                        break;
                    }
                }
            }
        }

        const prepareAttendance = await Attendance.findOne({ event_id: id, user_id: user._id, tahap: 'prepare' });
        const serviceAttendance = await Attendance.findOne({ event_id: id, user_id: user._id, tahap: 'service' });


        // Get all names
        const participantData = [];

        // Supervisor (tampilkan meskipun 'tidak bisa' agar terlihat perlu penggantian)
        if (event.supervisor?.id) {
            participantData.push({ name: event.supervisor.id.name, jobdesk: 'Supervisor', confirmation: event.supervisor.confirmation });
        }

        // Gudang (tampilkan semua dengan statusnya)
        for (const g of event.gudang) {
            if (g.user_id) {
                const jobdeskNamesStr = g.jobdesk.map(j => j.name).join(', ');
                participantData.push({ name: g.user_id.name, jobdesk: jobdeskNamesStr || '-', confirmation: g.confirmation });
            }
        }

        // Dapur (tampilkan semua dengan statusnya)
        for (const d of event.dapur) {
            for (const pj of d.penanggung_jawab) {
                if (pj.user_id) {
                    participantData.push({ name: pj.user_id.name, jobdesk: `PJ Menu: ${d.menu}`, confirmation: pj.confirmation });
                }
            }
        }

        res.status(200).json({
            event: {
                name: event.name,
                date_prepare: event.date_prepare,
                time_start_prepare: event.time_start_prepare,
                time_end_prepare: event.time_end_prepare,
                date_service: event.date_service,
                time_start_service: event.time_start_service,
                time_end_service: event.time_end_service,
                location: event.location,
                status: event.status,
            },
            jobdesk: jobdeskNames,
            role,
            participants: participantData,
            attendanceStatus: {
                prepare: prepareAttendance,
                service: serviceAttendance
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};