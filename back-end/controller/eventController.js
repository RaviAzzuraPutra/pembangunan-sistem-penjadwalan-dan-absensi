const Event = require("../models/Event");
const User = require("../models/User");
const sendMessage = require("../utils/send-message");
const Unavailability = require("../models/Unavailability");
const slugify = require("slugify");
const Attendance = require("../models/Attendance");


exports.createEvent = async (req, res) => {
    try {
        const slug = slugify(req.body.name, { lower: true, strict: true });

        const newEvent = new Event({
            ...req.body,
            slug,
        });

        const savedEvent = await newEvent.save();

        // Prepare Unavailability ops
        const ops = [];

        // Tambah Unavailability untuk user gudang
        newEvent.gudang.forEach(g => {
            ['date_prepare', 'date_service'].forEach(field => {
                const date = newEvent[field];
                ops.push({
                    updateOne: {
                        filter: { user_id: g.user_id, date },
                        update: { user_id: g.user_id, date },
                        upsert: true,
                    },
                });
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
            console.log(`Inserted/updated ${ops.length} unavailability entries`);
        }

        res.status(200).json({
            message: "Berhasil membuat event!",
            data: savedEvent,
            success: true,
        });

        // Notifikasi WhatsApp
        (async () => {
            const userIdGudang = newEvent.gudang.map(item => item.user_id.toString());
            const userIdDapur = newEvent.dapur.flatMap(menu =>
                menu.penanggung_jawab.map(pj => pj.user_id.toString())
            );
            const allUserId = [...new Set([...userIdGudang, ...userIdDapur])];

            const users = await User.find({ _id: { $in: allUserId } });

            let batch = [];
            for (let i = 0; i < users.length; i++) {
                batch.push(users[i]);

                // Kirim batch setiap 10 user
                if (batch.length === 10 || i === users.length - 1) {
                    for (const user of batch) {
                        const phoneFormatted = user.phone.replace(/^0/, "+62");
                        const message = `Hai ${user.name}, ada event baru yang perlu kamu lihat. Silakan cek di aplikasi.`;
                        try {
                            await sendMessage(phoneFormatted, message);
                        } catch (err) {
                            console.error("Gagal kirim pesan ke", user._id, err);
                        }
                    }
                    batch = [];

                    // Delay 2 menit di akhir batch (bukan setiap batch)
                    if (i === users.length - 1) {
                        console.log("Delay 2 menit...");
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

        // Ambil data event sebelum update
        const oldEvent = await Event.findById(id);
        if (!oldEvent) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // Update event
        const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedEvent) {
            return res.status(404).json({ message: 'Gagal update event' });
        }

        // Ambil user_id dari event lama
        const oldUserIds = [];
        if (Array.isArray(oldEvent.gudang)) {
            oldEvent.gudang.forEach(g => {
                if (g?.confirmation?.status !== 'tidak bisa') {
                    oldUserIds.push(g.user_id.toString());
                }
            });
        }
        if (Array.isArray(oldEvent.dapur)) {
            oldEvent.dapur.forEach(d => {
                if (Array.isArray(d.penanggung_jawab)) {
                    d.penanggung_jawab.forEach(pj => {
                        if (pj?.confirmation?.status !== 'tidak bisa') {
                            oldUserIds.push(pj.user_id.toString());
                        }
                    });
                }
            });
        }

        // Ambil user_id dari event baru
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

        // Hapus duplikat
        const uniqueOldUserIds = [...new Set(oldUserIds)];
        const uniqueNewUserIds = [...new Set(newUserIds)];

        // Cari user_id baru yang perlu dikirimi pesan
        const addedUserIds = uniqueNewUserIds.filter(id => !uniqueOldUserIds.includes(id));

        for (const userId of addedUserIds) {
            const user = await User.findById(userId);
            if (!user || !user.phone) continue;

            const phoneFormatted = user.phone.replace(/^0/, '+62');
            await sendMessage(phoneFormatted, `Hai ${user.name}, kamu dijadwalkan pada event baru. Silakan konfirmasi kehadiranmu!`);
        }

        res.status(200).json({ message: 'Event berhasil diupdate', event: updatedEvent });
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
            .populate('dapur.penanggung_jawab.user_id', 'nama no_telp');

        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // Normalisasi tanggal ke jam 00:00:00
        const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const tanggalPrepare = normalizeDate(new Date(event.date_prepare));
        const tanggalService = normalizeDate(new Date(event.date_service));

        // Kumpulkan semua user_id dari gudang dan dapur
        const userIds = new Set();

        // dari gudang
        event.gudang.forEach(g => {
            if (g.user_id?._id) {
                userIds.add(g.user_id._id.toString());
            }
        });

        // dari dapur
        event.dapur.forEach(menu => {
            menu.penanggung_jawab.forEach(pj => {
                if (pj.user_id?._id) {
                    userIds.add(pj.user_id._id.toString());
                }
            });
        });

        // Debug: tampilkan user dan tanggal yang mau dihapus
        console.log('User IDs:', Array.from(userIds));
        console.log('Tanggal Prepare:', tanggalPrepare);
        console.log('Tanggal Service:', tanggalService);

        // Hapus semua Unavailability yang cocok (gunakan rentang waktu harian)
        await Unavailability.deleteMany({
            user_id: { $in: Array.from(userIds) },
            $or: [
                {
                    date: {
                        $gte: tanggalPrepare,
                        $lt: new Date(tanggalPrepare.getTime() + 86400000), // +1 hari
                    },
                },
                {
                    date: {
                        $gte: tanggalService,
                        $lt: new Date(tanggalService.getTime() + 86400000), // +1 hari
                    },
                },
            ],
        });

        await Attendance.deleteMany({ event_id: id });

        // Hapus event
        await event.deleteOne();

        // Kirim notifikasi pembatalan
        const pesan = `*[Pembatalan Event]*\n` +
            `Nama Acara: ${event.name}\n` +
            `Tanggal Prepare: ${tanggalPrepare.toLocaleDateString('id-ID')}\n` +
            `Tanggal Service: ${tanggalService.toLocaleDateString('id-ID')}\n` +
            `Lokasi: ${event.location?.name || '-'}\n\n` +
            `Mohon perhatian, event ini telah dibatalkan.`;

        // Kirim ke semua user yang punya no_telp
        event.gudang.forEach(g => {
            if (g.user_id?.no_telp) {
                sendMessage(g.user_id.no_telp, pesan);
            }
        });

        event.dapur.forEach(menu => {
            menu.penanggung_jawab.forEach(pj => {
                if (pj.user_id?.no_telp) {
                    sendMessage(pj.user_id.no_telp, pesan);
                }
            });
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil Menghapus Event dan Unavailability"
        });

    } catch (error) {
        console.error("Error saat menghapus event:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal Menghapus Event"
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

        console.log("User ditemukan:", user._id, user.slug);

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

        console.log("Events ditemukan:", events.length);
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

        const tanggal = kategori === "gudang" ? event.date_prepare : event.date_service;

        if (status === "tidak bisa") {
            await Unavailability.create({ user_id: userId, date: tanggal });
            if (kategori === 'Gudang') {
                event.gudang = event.gudang.filter(e => e.user_id.toString() !== userId);
            } else if (kategori === 'Dapur') {
                const idx = event.dapur.findIndex(d => d.menu === menu);
                if (idx !== -1) {
                    event.dapur[idx].penanggung_jawab = event.dapur[idx].penanggung_jawab
                        .filter(pj => pj.user_id.toString() !== userId);
                }
            } else if (kategori === 'Supervisor') {
                event.supervisor.confirmation = { status, timestamp: new Date() };
            }
        } else {
            if (kategori === 'Gudang') {
                const emp = event.gudang.find(e => e.user_id.toString() === userId);
                if (!emp) return res.status(404).json({ message: 'Karyawan tidak ditemukan di Gudang' });
                emp.confirmation = { status, timestamp: new Date() };
            } else if (kategori === 'Dapur') {
                const menuObj = event.dapur.find(d => d.menu === menu);
                if (!menuObj) return res.status(404).json({ message: 'Menu dapur tidak ditemukan' });
                const pj = menuObj.penanggung_jawab.find(p => p.user_id.toString() === userId);
                if (!pj) return res.status(404).json({ message: 'Penanggung jawab tidak ditemukan' });
                pj.confirmation = { status, timestamp: new Date() };
            } else if (kategori === 'Supervisor') {
                event.supervisor.confirmation = { status, timestamp: new Date() };
            }
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

        const events = await Event.find({
            $or: [
                ...(date_prepare ? [{ date_prepare: new Date(date_prepare) }] : []),
                ...(date_service ? [{ date_service: new Date(date_service) }] : []),
            ]
        }).populate('supervisor', 'name')
            .populate('gudang.user_id', 'name')
            .populate('dapur.penanggung_jawab.user_id', 'name');

        events.forEach(ev => {
            if (date_prepare && ev.date_prepare?.toISOString().slice(0, 10) === new Date(date_prepare).toISOString().slice(0, 10)) {
                if (ev.supervisor?._id) blocked.add(ev.supervisor._id.toString());

                ev.gudang?.forEach(g => {
                    if (g.tahap?.includes('prepare') && g.user_id?._id) {
                        blocked.add(g.user_id._id.toString());
                    }
                });
            }

            if (date_service && ev.date_service?.toISOString().slice(0, 10) === new Date(date_service).toISOString().slice(0, 10)) {
                if (ev.supervisor?._id) blocked.add(ev.supervisor._id.toString());

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
            }
        });


        const datesToCheck = [];
        if (date_prepare) datesToCheck.push(new Date(date_prepare));
        if (date_service) datesToCheck.push(new Date(date_service));

        const noGo = await Unavailability.find({ date: { $in: datesToCheck } });
        noGo.forEach(u => {
            if (u.user_id) {
                blocked.add(u.user_id.toString());
            }
        });


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
                            description: `Stan: ${d.stan}, Porsi: ${d.jumlah_porsi}, Penanggung Jawab: ${pj.user_id.name}`
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
        if (event.supervisor?.id) {
            participantData.push({ name: event.supervisor.id.name, jobdesk: 'Supervisor' });
        }

        // Gudang
        for (const g of event.gudang) {
            if (g.user_id) {
                const jobdeskNames = g.jobdesk.map(j => j.name).join(', ');
                participantData.push({ name: g.user_id.name, jobdesk: jobdeskNames || '-' });
            }
        }

        // Dapur
        for (const d of event.dapur) {
            for (const pj of d.penanggung_jawab) {
                if (pj.user_id) {
                    participantData.push({ name: pj.user_id.name, jobdesk: `PJ Menu: ${d.menu}` });
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