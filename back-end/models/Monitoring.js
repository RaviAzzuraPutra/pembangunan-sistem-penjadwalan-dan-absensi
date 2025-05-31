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
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    status_area: {
        type: Boolean,
        required: true,
    },
});

module.exports = mongoose.model('Monitoring', monitoringSchema);
