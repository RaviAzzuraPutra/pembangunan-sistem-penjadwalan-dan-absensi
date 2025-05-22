const Event = require("../models/Event");
const User = require("../models/User");
const sendMessage = require("../utils/send-message");
const Unavailability = require("../models/Unavailability");
const slugify = require("slugify");

exports.createEvent = async (req, res) => {

    try {
        const slug = slugify(req.body.name, { lower: true, strict: true });
        const newEvent = new Event({
            ...req.body,
            slug,
        });
        const saveedEvent = await newEvent.save();

        const ops = [];

        newEvent.gudang.forEach(g => {
            ops.push({
                updateOne: {
                    filter: { user_id: g.user_id, date: newEvent.date_prepare },
                    update: { user_id: g.user_id, date: newEvent.date_prepare },
                    upsert: true
                }
            });
            ops.push({
                updateOne: {
                    filter: { user_id: g.user_id, date: newEvent.date_service },
                    update: { user_id: g.user_id, date: newEvent.date_service },
                    upsert: true
                }
            });
        });

        newEvent.dapur.forEach(d => {
            d.penanggung_jawab.forEach(pj => {
                ops.push({
                    updateOne: {
                        filter: { user_id: pj.user_id, date: newEvent.date_service },
                        update: { user_id: pj.user_id, date: newEvent.date_service },
                        upsert: true
                    }
                });
            });
        });

        if (ops.length) {
            await Unavailability.bulkWrite(ops);
            console.log(`Inserted/updated ${ops.length} unavailability entries`);
        }


        res.status(200).json({
            message: "Berhasil membuat event!",
            data: saveedEvent,
            success: true,
        });

        (async () => {
            const userIdGudang = newEvent.gudang.map(item => item.user_id.toString());
            const userIdDapur = [];
            newEvent.dapur.forEach(menu => {
                menu.penanggung_jawab.forEach(pj => {
                    userIdDapur.push(pj.user_id.toString());
                });
            });

            const allUserId = [...new Set([...userIdGudang, ...userIdDapur])];
            const users = await User.find({ _id: { $in: allUserId } });

            let batch = [];
            for (let i = 0; i < users.length; i++) {
                batch.push(users[i]);

                if (batch.length === 10 || i === users.length - 1) {
                    for (const user of batch) {
                        const phoneFormatted = user.phone.replace(/^0/, "+62");
                        const message = `Hai ${user.name}, ada event baru yang perlu kamu lihat. Silakan cek di aplikasi.`;
                        try {
                            await sendMessage(phoneFormatted, message);
                        } catch (err) {
                            console.error("Error mengirim pesan ke", user._id, err);
                        }
                    }
                    batch = [];

                    if (i === users.length - 1) {
                        console.log("Menunggu 2 menit sebelum menyelesaikan notifikasi...");
                        await new Promise(resolve => setTimeout(resolve, 120000));
                    }
                }
            }
        })().catch(err => {
            console.error("Notification worker error:", err);
        });
    } catch (error) {
        return res.status(500).json({
            message: "Gagal membuat event!",
            error: error.message,
            success: false,
        })
    }
}

exports.getAllEvent = async (req, res) => {

    try {
        const events = await Event.find()
            .populate("supervisor")
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
            .populate("supervisor")
            .populate("gudang.user_id")
            .populate("gudang.jobdesk")
            .populate("dapur.penanggung_jawab.user_id")
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

exports.getEventBySlug = async (req, res) => {

    try {
        const event = await Event.findOne({ slug: req.params.slug })
            .populate("supervisor")
            .populate("gudang.user_id")
            .populate("gudang.jobdesk")
            .populate("dapur.penanggung_jawab.user_id");

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
        const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        res.status(200).json({ message: 'Event berhasil diupdate', event: updatedEvent });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update event' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEvent = await Event.findByIdAndDelete(id)
            .populate('gudang.user_id', 'nama no_telp')
            .populate('dapur.penanggung_jawab.user_id', 'nama no_telp');


        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        const tanggalPrepare = new Date(deletedEvent.tanggal_prepare);
        const tanggalService = new Date(deletedEvent.tanggal_service);

        // Kumpulkan semua user_id yang terlibat
        const userIds = new Set();

        if (deletedEvent.gudang?.user_id?._id) {
            userIds.add(deletedEvent.gudang.user_id._id.toString());
        }

        deletedEvent.dapur.forEach(menu => {
            menu.penanggung_jawab.forEach(pj => {
                if (pj.user_id?._id) {
                    userIds.add(pj.user_id._id.toString());
                }
            });
        });

        // Hapus semua Unavailability yang cocok
        await Unavailability.deleteMany({
            user_id: { $in: Array.from(userIds) },
            date: { $in: [tanggalPrepare, tanggalService] },
        });

        const pesan = `*[Pembatalan Event]*\n` +
            `Nama Acara: ${deletedEvent.nama_acara}\n` +
            `Tanggal Prepare: ${new Date(deletedEvent.tanggal_prepare).toLocaleDateString('id-ID')}\n` +
            `Tanggal Service: ${new Date(deletedEvent.tanggal_service).toLocaleDateString('id-ID')}\n` +
            `Lokasi: ${deletedEvent.lokasi}\n\n` +
            `Mohon perhatian, event ini telah dibatalkan.`;

        if (deletedEvent.gudang?.user_id?.no_telp) {
            sendMessage(deletedEvent.gudang.user_id.no_telp, pesan);
        }

        deletedEvent.dapur.forEach(menu => {
            menu.penanggung_jawab.forEach(pj => {
                if (pj.user_id?.no_telp) {
                    sendMessage(pj.user_id.no_telp, pesan);
                }
            });
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil Menghapus Event"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Gagal Menghapus Event"
        })
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
                { 'dapur.penanggung_jawab.user_id': user._id }
            ]
        });

        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil assigned events' });
    }
};

exports.confirm = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { userId, status, kategori, menu } = req.body;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        const tanggal = kategori === "gudang" ? event.date_prepare : event.date_service;

        if (status === "tidak bisa") {
            await Unavailability.create({ user_id: userId, date: tanggal });
            if (kategori === 'Gudang') {
                event.gudang = event.gudang.filter(e => e.user_id.toString() !== userId);
            } else {
                const idx = event.dapur.findIndex(d => d.menu === menu);
                if (idx !== -1) {
                    event.dapur[idx].penanggung_jawab = event.dapur[idx].penanggung_jawab
                        .filter(pj => pj.user_id.toString() !== userId);
                }
            }
        } else {
            if (kategori === 'Gudang') {
                const emp = event.gudang.find(e => e.user_id.toString() === userId);
                if (!emp) return res.status(404).json({ message: 'Karyawan tidak ditemukan di Gudang' });
                emp.confirmation = { status, timestamp: new Date() };
            } else {
                const menuObj = event.dapur.find(d => d.menu === menu);
                if (!menuObj) return res.status(404).json({ message: 'Menu dapur tidak ditemukan' });
                const pj = menuObj.penanggung_jawab.find(p => p.user_id.toString() === userId);
                if (!pj) return res.status(404).json({ message: 'Penanggung jawab tidak ditemukan' });
                pj.confirmation = { status, timestamp: new Date() };
            }
        }

        await event.save();
        return res.status(200).json({ message: 'Konfirmasi kehadiran berhasil' });
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
            if (date_prepare && ev.date_prepare.toISOString().slice(0, 10) === new Date(date_prepare).toISOString().slice(0, 10)) {
                if (ev.supervisor) blocked.add(ev.supervisor._id.toString());

                ev.gudang.forEach(g => {
                    if (g.tahap.includes('prepare')) {
                        blocked.add(g.user_id._id.toString());
                    }
                });
            }

            if (date_service && ev.date_service.toISOString().slice(0, 10) === new Date(date_service).toISOString().slice(0, 10)) {
                if (ev.supervisor) blocked.add(ev.supervisor._id.toString());

                ev.gudang.forEach(g => {
                    if (g.tahap.includes('service')) {
                        blocked.add(g.user_id._id.toString());
                    }
                });

                ev.dapur.forEach(d => {
                    d.penanggung_jawab.forEach(pj => {
                        blocked.add(pj.user_id._id.toString());
                    });
                });
            }
        });

        const datesToCheck = [];
        if (date_prepare) datesToCheck.push(new Date(date_prepare));
        if (date_service) datesToCheck.push(new Date(date_service));

        const noGo = await Unavailability.find({ date: { $in: datesToCheck } });
        noGo.forEach(u => blocked.add(u.user_id.toString()));

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