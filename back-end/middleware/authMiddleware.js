const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token tidak ditemukan!!!",
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).json({
                success: false,
                message: "Token tidak valid!!!",
            })
        }

        req.user = decoded;
        next();
    });
}

module.exports = verifyToken;