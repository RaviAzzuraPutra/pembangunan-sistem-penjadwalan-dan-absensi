const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
    ID_Login: String,
    otp: String,
    expiredAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("OTPSchema", OTPSchema);