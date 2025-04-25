const connect = require("../utils/connect");
const Jobdesk = require("../models/Jobdesk");

exports.createJobdesk = async (req, res) => {
    await connect();
    try {
        const { name, category, description } = req.body;
        const jobdesk = new Jobdesk({
            name,
            category,
            description
        });
        await jobdesk.save();
        return res.status(201).json({
            message: "Jobdesk created successfully",
            data: jobdesk
        });
    } catch (error) {
        return res.status(500).json({
            message: "Gagal membuat jobdesk",
            error: error.message,
        });
    }
}

exports.getAllJobdesk = async (req, res) => {
    await connect();
    try {
        const Getjobdesk = await Jobdesk.find({});
        return res.status(200).json({
            message: "Berhasil mendapatkan semua jobdesk",
            data: Getjobdesk
        });
    } catch (error) {
        return res.status(500).json({
            message: "Gagal mendapatkan semua jobdesk",
            error: error.message,
        });
    }
}