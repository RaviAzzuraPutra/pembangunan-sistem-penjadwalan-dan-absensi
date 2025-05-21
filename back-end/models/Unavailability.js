const mongoose = require('mongoose');

const unavailabilitySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, required: true },
}, { timestamps: true });

unavailabilitySchema.index({ user_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Unavailability', unavailabilitySchema);