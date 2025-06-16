const { detectFace } = require("../utils/faceapi-function");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const faceapi = require('@vladmandic/face-api');
const Event = require("../models/Event");
const Subscription = require("../models/Subscription");
const Monitoring = require("../models/Monitoring");
const webpush = require("web-push");
require("dotenv").config();

webpush.setVapidDetails(
    'mailto:admin@yourdomain.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);


function combineDateTime(date, timeStr) {
    if (!date || !timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
}


exports.createAttendance = async (req, res) => {
    try {
        console.log("File yang diupload:", req.file);
        if (!req.file) {
            return res.status(400).json({ message: "Tidak ada file yang diupload" });
        }

        const { slug, eventId, tahap } = req.params;
        const { latitude, longitude } = req.body;

        const user = await User.findOne({ slug });
        if (!user || !user.face_data) {
            return res.status(404).json({ message: "User tidak ditemukan atau belum memiliki data wajah" });
        }

        const newDescriptor = await detectFace(req.file.buffer);
        if (!newDescriptor) {
            return res.status(400).json({ message: "Wajah tidak terdeteksi!", success: false });
        }

        const storedDescriptor = JSON.parse(user.face_data);
        const Face_Matching = faceapi.euclideanDistance(newDescriptor, storedDescriptor);
        const threshold = 0.6;
        const face_match = Face_Matching < threshold;
        if (!face_match) {
            return res.status(400).json({ message: "Wajah tidak cocok!", success: false, distance: Face_Matching });
        }
        const status = face_match ? "berhasil" : "gagal";

        const attendance = new Attendance({
            event_id: eventId,
            user_id: user._id,
            tahap,
            timestamp: new Date(),
            location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            },
            face_match,
            status
        });

        await attendance.save();

        res.status(200).json({
            message: "Absensi Berhasil!",
            success: true,
            status,
            distance: Face_Matching,
            face_match
        })
    } catch (error) {
        console.error("Terjadi kesalahan saat membuat absensi:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message || "Internal Server Error"
        })
    }
}

exports.getAttendancesByEvent = async (req, res) => {
    const { eventId } = req.params;

    try {
        const event = await Event.findById(eventId)
            .populate('gudang.user_id', 'name slug')
            .populate('dapur.penanggung_jawab.user_id', 'name slug')
            .populate('supervisor.id', 'name slug')
            .populate('gudang.jobdesk', 'name');


        if (!event) {
            return res.status(404).json({ message: "Event tidak ditemukan" });
        }


        // 1. Kumpulkan semua ID peserta (gudang + dapur + supervisor)
        const pesertaSet = new Set();

        event.gudang.forEach(g => {
            if (g.user_id) pesertaSet.add(g.user_id._id.toString());
        });
        event.dapur.forEach(d => {
            d.penanggung_jawab.forEach(pj => {
                if (pj.user_id) pesertaSet.add(pj.user_id._id.toString());
            });
        });
        // *** Tambahkan supervisor *** 
        if (event.supervisor?.id) {
            // setelah populate, event.supervisor.id adalah dokumen User
            pesertaSet.add(event.supervisor.id._id.toString());
        }

        // 2. Buat array karyawan dari pesertaSet
        const karyawanArray = Array.from(pesertaSet).map(userIdStr => {
            if (event.supervisor?.id?._id.toString() === userIdStr) {
                return { ...event.supervisor.id.toObject(), jobdeskLabel: 'supervisor' };
            }

            const gud = event.gudang.find(g => g.user_id?._id.toString() === userIdStr);
            if (gud) {
                const jobdeskNames = (gud.jobdesk || []).map(j => j.name).join(', ');
                return { ...gud.user_id.toObject(), jobdeskLabel: jobdeskNames };
            }

            for (const d of event.dapur) {
                const pj = d.penanggung_jawab.find(pj => pj.user_id?._id.toString() === userIdStr);
                if (pj) {
                    return { ...pj.user_id.toObject(), jobdeskLabel: 'penanggung jawab dapur' };
                }
            }

            return { _id: userIdStr, name: "Unknown", slug: "", jobdeskLabel: "" };
        });

        const attendanceList = await Attendance.find({ event_id: eventId })
            .populate('user_id', 'name slug face_data')
            .sort({ timestamp: -1 });

        console.log("Polygon dari event:", event.location?.polygon || []);

        console.log("Supervisor ID:", event.supervisor.id);

        res.status(200).json({
            event: {
                id: event._id,
                name: event.name,
                date_prepare: event.date_prepare,
                date_service: event.date_service,
                polygon: event.location?.polygon || [],
                supervisorId: event.supervisor?.id?._id.toString()
            },
            total_absen: attendanceList.length,
            absensi: attendanceList,
            karyawan: karyawanArray,
        });

    } catch (error) {
        console.error("Error fetching event:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.saveSubcription = async (req, res) => {
    try {
        const { userId, subscription } = req.body;

        const endpoint = subscription.endpoint;

        const existing = await Subscription.findOne({ user_id: userId, endpoint: subscription.endpoint });
        if (existing) {
            existing.subscription = subscription;
            existing.endpoint = subscription.endpoint;
            await existing.save();
        } else {
            await Subscription.create({
                user_id: userId,
                subscription,
                endpoint
            });
        }

        res.status(200).json({
            success: true,
            message: "Subscription berhasil disimpan."
        })
    } catch (error) {
        console.error("Error saving subscription:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menyimpan subscription.",
            error: error.message
        });
    }
}

// Helper
function combineDateTime(date, time) {
    return new Date(`${date.toISOString().split('T')[0]}T${time}`);
}


exports.remindUserPush = async (req, res) => {
    try {
        const { userId, eventId } = req.params;

        console.log("User  ID:", userId);
        console.log("Event ID:", eventId);

        const user = await User.findById(userId);

        if (!user) {
            console.log("User tidak ditemukan.");
            console.log("User tidak memiliki pushSubscription");
            return res.status(404).json({ message: "User tidak ditemukan atau tidak memiliki subscription" });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            console.log("Event tidak ditemukan.");
            return res.status(404).json({ message: 'Event tidak ditemukan.' });
        }

        const subscription = await Subscription.find({ user_id: userId });
        if (!subscription) return res.status(404).json({ message: "User belum memiliki push subscription." });

        const now = new Date();
        const startPrepare = combineDateTime(event.date_prepare, event.time_start_prepare);
        const endPrepare = combineDateTime(event.date_prepare, event.time_end_prepare);
        const startService = combineDateTime(event.date_service, event.time_start_service);
        const endService = combineDateTime(event.date_service, event.time_end_service);


        let fase = null;
        if (startPrepare && endPrepare && now >= startPrepare && now <= endPrepare) {
            fase = 'prepare';
        } else if (startService && endService && now >= startService && now <= endService) {
            fase = 'service';
        }

        if (!fase) {
            return res.status(400).json({ message: 'Saat ini bukan waktu prepare atau service event.' });
        }

        const locale = 'id-ID';
        const opsiTanggal = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const opsiWaktu = { hour: '2-digit', minute: '2-digit' };

        // Buat fungsi bantu untuk gabung tanggal dan waktu
        function gabungkanTanggalWaktu(tanggalISO, waktuHHMM) {
            const tanggal = new Date(tanggalISO);
            const [jam, menit] = waktuHHMM.split(':');
            tanggal.setHours(parseInt(jam), parseInt(menit), 0, 0);
            return tanggal;
        }

        // Gabungkan untuk fase prepare
        const tanggalPrepare = new Date(event.date_prepare);
        const prepareStart = gabungkanTanggalWaktu(event.date_prepare, event.time_start_prepare);
        const prepareEnd = gabungkanTanggalWaktu(event.date_prepare, event.time_end_prepare);

        // Gabungkan untuk fase service
        const tanggalService = new Date(event.date_service);
        const serviceStart = gabungkanTanggalWaktu(event.date_service, event.time_start_service);
        const serviceEnd = gabungkanTanggalWaktu(event.date_service, event.time_end_service);

        // Pesan
        let pesan = '';
        if (fase === 'prepare') {
            pesan = `Hai ${user.name}, jangan lupa absen untuk fase PREPARE event "${event.name}" pada ${tanggalPrepare.toLocaleDateString(locale, opsiTanggal)} pukul ${prepareStart.toLocaleTimeString(locale, opsiWaktu)} - ${prepareEnd.toLocaleTimeString(locale, opsiWaktu)}`;
        } else if (fase === 'service') {
            pesan = `Hai ${user.name}, jangan lupa absen untuk fase SERVICE event "${event.name}" pada ${tanggalService.toLocaleDateString(locale, opsiTanggal)} pukul ${serviceStart.toLocaleTimeString(locale, opsiWaktu)} - ${serviceEnd.toLocaleTimeString(locale, opsiWaktu)}`;
        }


        const payload = JSON.stringify({
            title: 'Pengingat Absensi',
            body: pesan,
            icon: '/icons/LOGO-PERUSAHAAN.ico',
        });

        let success = 0;
        let failed = 0;

        for (const sub of subscription) {
            try {
                await webpush.sendNotification(sub.subscription, payload);
                success++;
            } catch (err) {
                console.error("Gagal kirim ke satu subscription:", err.statusCode);
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await Subscription.deleteOne({ _id: sub._id });
                }

                failed++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Pengingat untuk fase ${fase} telah dikirim ke ${user.name}.`
        })
    } catch (error) {
        console.error('Error sending push notification:', error);
        console.error(error.stack);
        res.status(500).json({ message: 'Gagal mengirim notifikasi.', error: error.message });
    }
}

exports.monitoringLocation = async (req, res) => {
    try {
        const { user_id, event_id, location, note } = req.body;

        await Monitoring.create({
            user_id,
            event_id,
            timestamp: new Date(),
            location: {
                latitude: parseFloat(location.latitude),
                longitude: parseFloat(location.longitude)
            },
            note: note || ''
        });

        const event = await Event.findById(event_id);
        const supervisorId = event.supervisor?.id?._id;

        if (supervisorId) {
            const subscription = await Subscription.find({ user_id: supervisorId });

            const notificationPayload = {
                title: 'Monitoring Lokasi',
                body: `User dengan ID ${user_id} telah melakukan monitoring lokasi pada event ${event.name}.`,
            }

            subscription.forEach(sub => {
                webpush.sendNotification(sub.subscription, notificationPayload).catch(error => {
                    console.error("Gagal mengirim notifikasi:", error);
                })
            })
        }

        res.status(200).json({
            success: true,
            message: "Monitoring lokasi berhasil disimpan.",
        })
    } catch (error) {
        console.error("Error monitoring location:", error);
        res.status(500).json({ message: "Gagal memantau lokasi.", error: error.message });
    }
}



