const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    name: String,
    slug: String,
    porsi: Number,
    date_prepare: Date,
    time_start_prepare: String,
    time_end_prepare: String,
    date_service: Date,
    time_start_service: String,
    time_end_service: String,
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    location: {
        name: String,
        address: mongoose.Schema.Types.Mixed,
        latitude: Number,
        longitude: Number,
        polygon: {
            type: [[Number]],
            default: [],
        },
    },
    gudang: [{
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        jobdesk: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Jobdesk' }],
        tahap: [{ type: String, enum: ['prepare', 'service'] }],
        confirmation: {
            status: { type: String, enum: ['bisa', 'tidak bisa', 'menunggu'], default: 'menunggu' },
            timestamp: Date
        }
    }],
    dapur: [{
        menu: String,
        stan: String,
        jumlah_porsi: Number,
        penanggung_jawab: [{
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: String,
            confirmation: {
                status: { type: String, enum: ['bisa', 'tidak bisa', 'menunggu'], default: 'menunggu' },
                timestamp: Date
            }
        }],
        tahap: { type: String, enum: ['service'], default: 'service' }
    }],
    status: { type: String, enum: ['terjadwal', 'berlangsung', 'selesai'], default: 'terjadwal' },
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);