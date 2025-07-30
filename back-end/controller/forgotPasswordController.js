const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcrypt");
const sendMessage = require("../utils/send-message");

const generateOTP = () => {
    const base = Math.floor(1000 + Math.random() * 90000).toString();
    return base.padStart(6, '0');
};

exports.forgotPassword = async (req, res) => {
    const { ID_Login } = req.body;

    const user = await User.findOne({ ID_Login });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User Tidak Ditemukan"
        });
    }

    const otp = generateOTP();
    const expiredAt = new Date(Date.now() + 60 * 1000);

    await OTP.deleteMany({ user_id: user._id })
    await OTP.create({ user_id: user._id, otp, expiredAt });

    await sendMessage(user.phone, `${user.name} Berikut adalah kode OTP anda harap jangan diberikan kepada siapapun ${otp}`);
    return res.status(200).json({
        success: true,
        message: "Berhasil Mengirimkan Kode OTP",
    });
}

exports.verifyOTP = async (req, res) => {
    const { ID_Login, otp } = req.body;
    const user = await User.findOne({ ID_Login });

    if (!user) {
        return res.status(404).json({ success: false, message: "ID_Login tidak ditemukan!!!" });
    }

    const record = await OTP.findOne({ user_id: user._id, otp });

    if (!record || record.expiredAt < new Date()) {
        return res.status(400).json({ message: 'OTP kadaluarsa atau tidak valid!!!' });
    }

    await OTP.deleteMany({ user_id: user._id });

    res.status(200).json({
        success: true,
        message: "OTP Valid"
    });
}

exports.resetPassword = async (req, res) => {
    const { ID_Login, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 11);
    const user = await User.findOne({ ID_Login });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User Tidak Ditemukan"
        });
    }

    user.password = hashedPassword;
    await user.save();
    res.status(200).json({
        message: "Berhasil Merubah Password Jangan Sampai Lupa Lagi Ya!!! 😊",
        success: true
    })
}