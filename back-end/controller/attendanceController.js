const fs = require('fs');
const { detectFace } = require("../utils/faceapi-function");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const faceapi = require('@vladmandic/face-api');


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
            return res.status(400).json({ message: "Wajah tidak terdeteksi" });
        }

        const storedDescriptor = JSON.parse(user.face_data);
        const Face_Matching = faceapi.euclideanDistance(newDescriptor, storedDescriptor);
        const threshold = 0.6;
        const face_match = Face_Matching < threshold;
        if (!face_match) {
            return res.status(400).json({ message: "Wajah tidak cocok" });
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
            message: "Absensi Berhasil",
            success: true,
            status,
            distance: Face_Matching,
            face_match
        })
    } catch (error) {
        console.error("Terjadi kesalahan saat membuat absensi:", error);
        res.status(500).json({
            message: "Terjadi kesalahan server",
            error: error.message || "Internal Server Error"
        })
    }
}

exports.getAttendancesByEvent = async (req, res) => {
    const { Id } = req.params;

    try {
        const attendances = await Attendance.find({ event_id: Id })
            .populate('user_id', 'name slug')
            .sort({ timestamp: 1 });

        // Gabungkan absensi berdasarkan user dan tahap
        const resultMap = {};

        attendances.forEach((att) => {
            const key = att.user_id._id.toString();
            if (!resultMap[key]) {
                resultMap[key] = {
                    user_id: att.user_id._id,
                    name: att.user_id.name,
                    slug: att.user_id.slug,
                    hadir_prepare: 'belum',
                    hadir_service: 'belum',
                };
            }

            if (att.tahap === 'prepare') {
                resultMap[key].hadir_prepare = att.status;
            } else if (att.tahap === 'service') {
                resultMap[key].hadir_service = att.status;
            }
        });

        const result = Object.values(resultMap);
        res.json(result);
    } catch (err) {
        console.error('Gagal mengambil data absensi:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};



