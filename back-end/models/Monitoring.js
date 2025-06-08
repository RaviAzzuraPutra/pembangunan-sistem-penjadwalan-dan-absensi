const mongoose = require('mongoose');

const monitoringSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    location: {
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
    },
    note: {
        type: String,
        default: '',
    },
}, { timestamps: true });

module.exports = mongoose.model('Monitoring', monitoringSchema);
