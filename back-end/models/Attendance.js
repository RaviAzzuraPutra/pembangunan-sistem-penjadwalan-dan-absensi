const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date,
    location: {
        latitude: Number,
        longitude: Number,
    },
    face_match: Boolean,
    tahap: { type: String, enum: ['service', 'prepare'] },
    status: { type: String, enum: ['berhasil', 'gagal'] },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);