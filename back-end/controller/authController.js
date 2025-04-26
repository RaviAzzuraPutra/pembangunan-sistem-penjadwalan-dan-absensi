const bcrypt = require("bcrypt");
const connect = require("../utils/connect");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.login = async (req, res) => {
    connect();
    try {
        const { ID_Login, password } = req.body;
        const user = await User.findOne({ ID_Login });
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

        const token = jwt.sign({ id: user._id, name: user.name, slug: user.slug, role: user.role }
            , process.env.JWT_SECRET,
            { expiresIn: "8h" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 8 * 60 * 60 * 1000
        })

        return res.status(200).json({
            success: true,
            message: "Berhasil Login!!!",
            token,
            user: {
                id: user._id,
                name: user.name,
                slug: user.slug,
                role: user.role
            }
        })
    } catch (error) {
        console.error("Terjadi Error Di Function Login", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan Pada Server!!!",
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

        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
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
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Anda Belum Login!!!"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({
            success: true,
            user: decoded
        })
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token tidak valid!!!"
        })
    }
}