const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.login = async (req, res) => {
    try {
        const { ID_Login, password } = req.body;
        const user = await User.findOne({ ID_Login }).populate("jobdesk");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "ID_Login tidak ditemukan!!!",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Password Salah!!!"
            });
        }

        const token = jwt.sign(
            { id: user._id, name: user.name, slug: user.slug, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        // Deteksi iOS/Safari dari user-agent
        const ua = req.headers['user-agent'] || "";
        const isIOS = /iP(hone|ad|od)/.test(ua);
        const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
        const sameSiteOption = (isIOS || isSafari) ? "lax" : "none";
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: sameSiteOption,
            maxAge: 8 * 60 * 60 * 1000
        });

        // Kirim juga token di body untuk dipakai sebagai Bearer (fallback iOS / PWA)
        return res.status(200).json({
            success: true,
            message: "Berhasil Login!!!",
            token, // frontend akan simpan di localStorage
            user: {
                id: user._id,
                name: user.name,
                slug: user.slug,
                ID_Login: user.ID_Login,
                role: user.role,
                phone: user.phone,
                is_supervisor_candidate: user.is_supervisor_candidate,
                face_data: user.face_data,
                jobdesk: user.jobdesk,
            }
        });
    } catch (error) {
        console.error("Terjadi Error Di Function Login", error);
        console.log("Login Error Response:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan Pada Server!!!", error: error.message,
            error: error.message
        })
    }
}

exports.logout = async (req, res) => {
    try {
        if (!req.cookies.token) {
            return res.status(401).json({
                success: false,
                message: "Anda Belum Login!!!"
            })
        }

        // Deteksi iOS/Safari dari user-agent
        const ua = req.headers['user-agent'] || "";
        const isIOS = /iP(hone|ad|od)/.test(ua);
        const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
        const sameSiteOption = (isIOS || isSafari) ? "lax" : "none";
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: sameSiteOption,
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil Logout!!!"
        })
    } catch (error) {
        console.error("Terjadi Error Di Function Logout", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan Pada Server!!!",
        })
    }
}

exports.checkLogin = async (req, res) => {
    // Ambil token dari cookie ATAU Authorization header (Bearer)
    let token = req.cookies.token;
    if (!token) {
        const authHeader = req.headers.authorization || '';
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7).trim();
        }
    }
    if (!token) {
        return res.status(401).json({ success: false, message: "Anda Belum Login!!!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).populate("jobdesk");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan!",
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                slug: user.slug,
                ID_Login: user.ID_Login,
                role: user.role,
                phone: user.phone,
                is_supervisor_candidate: user.is_supervisor_candidate,
                face_data: user.face_data,
                jobdesk: user.jobdesk,
            }
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token tidak valid!!!"
        });
    }
};