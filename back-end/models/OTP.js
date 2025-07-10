const mongoose = require("mongoose");

const OTP = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otp: String,
    expiredAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("OTP", OTP);