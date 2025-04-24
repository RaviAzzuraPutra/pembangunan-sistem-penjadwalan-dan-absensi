const mongoose = require('mongoose');

const JobdeskSchema = new mongoose.Schema({
    name: String,
    category: { type: String, enum: ['dapur', 'gudang'] },
    description: String,
});

module.exports = mongoose.model('Jobdesk', JobdeskSchema);