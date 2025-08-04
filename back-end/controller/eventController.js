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
            message: "Gagal membuat event!",
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

        // Logic Supervisor
        let supervisorPayload;
        const supervisorBaruId = updateData.supervisor.id;

        if (oldEvent.supervisor.id.toString() === supervisorBaruId) {
            // Supervisor tidak diganti → pertahankan confirmation lama
            supervisorPayload = {
                id: supervisorBaruId,
                confirmation: oldEvent.supervisor.confirmation
            };
        } else {
            // Supervisor diganti
            // Cari apakah orang ini sebelumnya masuk di gudang & sudah konfirmasi bisa
            const gudangData = oldEvent.gudang.find(g => g.user_id.toString() === supervisorBaruId);
            if (gudangData?.confirmation === 'bisa') {
                supervisorPayload = { id: supervisorBaruId, confirmation: 'bisa' };
            } else {
                supervisorPayload = { id: supervisorBaruId, confirmation: 'menunggu' };
            }
        }


        const slug = slugify(updateData.name, { lower: true, strict: true });

        // Build payload baru seluruhnya
        const updatedPayload = {
            name: updateData.name,
            slug: slug,
            porsi: updateData.porsi,
            date_prepare: updateData.date_prepare,
            time_start_prepare: updateData.time_start_prepare,
            time_end_prepare: updateData.time_end_prepare,
            date_service: updateData.date_service,
            time_start_service: updateData.time_start_service,
            time_end_service: updateData.time_end_service,
            location: updateData.location,
            supervisor: supervisorPayload,
            gudang: updateData.gudang,
            dapur: updateData.dapur
        };

        // Update langsung
        const updatedEvent = await Event.findByIdAndUpdate(id, updatedPayload, { new: true });

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Gagal update event' });
        }

        // Pertahankan konfirmasi gudang
        if (Array.isArray(updatedEvent.gudang)) {
            updatedEvent.gudang = updatedEvent.gudang.map(g => {
                const lama = oldEvent.gudang.find(e => e.user_id.toString() === g.user_id.toString());
                return {
                    ...g,
                    confirmation: lama?.confirmation ?? g.confirmation ?? null
                };
            });
        }

        // Pertahankan konfirmasi penanggung jawab dapur
        if (Array.isArray(updatedEvent.dapur)) {
            updatedEvent.dapur = updatedEvent.dapur.map(d => {
                const lama = oldEvent.dapur.find(e => e.menu === d.menu);
                const newPenanggungJawab = d.penanggung_jawab.map(pj => {
                    const lamaPJ = lama?.penanggung_jawab?.find(e => e.user_id.toString() === pj.user_id.toString());
                    return {
                        ...pj,
                        confirmation: lamaPJ?.confirmation ?? pj.confirmation ?? null
                    };
                });
                return {
                    ...d,
                    penanggung_jawab: newPenanggungJawab
                };
            });
        }


        const oldUserIds = [];
        const removedUserIds = [];

        if (Array.isArray(oldEvent.gudang)) {
            oldEvent.gudang.forEach(g => {
                if (g?.confirmation?.status === 'tidak bisa') {
                    removedUserIds.push(g.user_id.toString());
                } else {
                    oldUserIds.push(g.user_id.toString());
                }
            });
        }

        if (Array.isArray(oldEvent.dapur)) {
            oldEvent.dapur.forEach(d => {
                if (Array.isArray(d.penanggung_jawab)) {
                    d.penanggung_jawab.forEach(pj => {
                        if (pj?.confirmation?.status === 'tidak bisa') {
                            removedUserIds.push(pj.user_id.toString());
                        } else {
                            oldUserIds.push(pj.user_id.toString());
                        }
                    });
                }
            });
        }

        const newUserIds = [];
        if (Array.isArray(updatedEvent.gudang)) {
            updatedEvent.gudang.forEach(g => {
                if (g?.confirmation?.status !== 'tidak bisa') {
                    newUserIds.push(g.user_id.toString());
                }
            });
        }

        if (Array.isArray(updatedEvent.dapur)) {
            updatedEvent.dapur.forEach(d => {
                if (Array.isArray(d.penanggung_jawab)) {
                    d.penanggung_jawab.forEach(pj => {
                        if (pj?.confirmation?.status !== 'tidak bisa') {
                            newUserIds.push(pj.user_id.toString());
                        }
                    });
                }
            });
        }

        // Hapus gudang yang "tidak bisa" dan user_id-nya tidak ada di data yang baru
        if (Array.isArray(updatedEvent.gudang)) {
            updatedEvent.gudang = updatedEvent.gudang.filter(g => {
                const userId = g.user_id.toString();
                const isDiganti = removedUserIds.includes(userId) && !newUserIds.includes(userId);
                return !(g?.confirmation?.status === 'tidak bisa' && isDiganti);
            });
        }

        // Hapus penanggung jawab dapur yang "tidak bisa" dan user_id-nya diganti
        if (Array.isArray(updatedEvent.dapur)) {
            updatedEvent.dapur.forEach(d => {
                if (Array.isArray(d.penanggung_jawab)) {
                    d.penanggung_jawab = d.penanggung_jawab.filter(pj => {
                        const userId = pj.user_id.toString();
                        const isDiganti = removedUserIds.includes(userId) && !newUserIds.includes(userId);
                        return !(pj?.confirmation?.status === 'tidak bisa' && isDiganti);
                    });
                }
            });
        }

        // Simpan hasil bersih
        await updatedEvent.save();

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
        res.status(500).json({ message: 'Gagal update event' });
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

        const userIds = new Set();
        const allUserIds = new Set();

        if (event.supervisor?.id?._id) {
            allUserIds.add(event.supervisor.id._id.toString());
        }

        event.gudang.forEach(g => g.user_id?._id && allUserIds.add(g.user_id._id.toString()));
        event.dapur.forEach(menu => menu.penanggung_jawab.forEach(pj => pj.user_id?._id && allUserIds.add(pj.user_id._id.toString())));

        // Hapus semua data terkait dulu
        await Unavailability.deleteMany({
            user_id: { $in: Array.from(userIds) },
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
            message: "Gagal Menghapus Acara"
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
        const tanggal = kategoriLower === "gudang" ? event.date_prepare : event.date_service;

        if (status === "tidak bisa") {
            // Cek apakah sudah ada Unavailability sebelumnya
            const existingUnavailability = await Unavailability.findOne({ user_id: userId, date: tanggal });

            if (!existingUnavailability) {
                await Unavailability.create({ user_id: userId, date: tanggal });
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
            const emp = event.gudang.find(e => e.user_id.toString() === userId);
            if (!emp) return res.status(404).json({ message: 'Karyawan tidak ditemukan di Gudang' });
            emp.confirmation = status;
        } else if (kategoriLower === 'dapur') {
            const menuObj = event.dapur.find(d => d.menu === menu);
            if (!menuObj) return res.status(404).json({ message: 'Menu dapur tidak ditemukan' });
            const pj = menuObj.penanggung_jawab.find(p => p.user_id.toString() === userId);
            if (!pj) return res.status(404).json({ message: 'Penanggung jawab tidak ditemukan' });
            pj.confirmation = status;
        } else if (kategoriLower === 'supervisor') {
            if (!event.supervisor || event.supervisor.id.toString() !== userId) {
                return res.status(404).json({ message: 'Supervisor tidak sesuai' });
            }
            event.supervisor.confirmation = status;
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

        const fullyUnavailable = unavailPrepare.filter(id =>
            unavailService.includes(id.toString())
        );

        // Blokir hanya user yang tidak bisa hadir di kedua tanggal
        fullyUnavailable.forEach(id => blocked.add(id.toString()));


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

        // Supervisor
        if (event.supervisor?.id && event.supervisor.confirmation === "bisa") {
            participantData.push({ name: event.supervisor.id.name, jobdesk: 'Supervisor' });
        }

        // Gudang
        for (const g of event.gudang) {
            if (g.user_id && g.confirmation === "bisa") {
                const jobdeskNames = g.jobdesk.map(j => j.name).join(', ');
                participantData.push({ name: g.user_id.name, jobdesk: jobdeskNames || '-' });
            }
        }

        // Dapur
        for (const d of event.dapur) {
            for (const pj of d.penanggung_jawab) {
                if (pj.user_id && pj.confirmation === "bisa") {
                    participantData.push({ name: pj.user_id.name, jobdesk: `PJ Menu: ${d.menu} ` });
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