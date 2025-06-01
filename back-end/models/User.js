const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    slug: String,
    ID_Login: { type: String, unique: true },
    password: String,
    phone: String,
    role: { type: String, enum: ['direktur', 'karyawan'], default: 'karyawan' },
    is_supervisor_candidate: { type: Boolean, default: false },
    jobdesk: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Jobdesk' }],
    face_data: String,
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);