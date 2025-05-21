const User = require("../models/User");
const bcrypt = require("bcrypt");
const multer = require("multer");
const connect = require("../utils/connect");
const { detectFace } = require("../utils/faceapi-function");
const sendMessage = require("../utils/send-message");
const Jobdesk = require("../models/Jobdesk");

const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.createUser = async (req, res) => {
    await connect();
    try {
        let generate_ID_Login = Math.floor(100000 + Math.random() * 900000).toString();
        const { name, password, phone, role, is_supervisor_candidate, jobdesk } = req.body;
        const hashedPassword = await bcrypt.hash(password, 11);
        const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
        const phone_replace = phone.replace(/^0/, "62");
        const jobdeskData = await Jobdesk.find({ _id: { $in: jobdesk } });
        const jobdeskName = jobdeskData.map(jd => jd.name).join(", ");
        const user = new User({
            name,
            slug: slug,
            ID_Login: generate_ID_Login,
            password: hashedPassword,
            phone: phone_replace,
            role,
            is_supervisor_candidate,
            jobdesk,
            face_data: null
        });

        await user.save();

        const message =
            `Hallo ${name}!\n\n` +
            `Berikut adalah data akun Anda:\n\n` +
            `*Nama:* ${name}\n` +
            `*ID Login:* ${generate_ID_Login}\n` +
            `*Password:* ${password}\n` +
            `*Nomor Telepon:* ${phone}\n` +
            `*Status Supervisor:* ${is_supervisor_candidate ? "Supervisor" : "Bukan Supervisor"}\n` +
            `*Jobdesk:* ${jobdeskName}\n\n` +
            `Silakan login menggunakan ID Login dan password di atas.\n` +
            `link login website: http://localhost:3000`;

        await sendMessage(phone_replace, message);

        return res.status(201).json({
            message: "Berhasil Menambahkan User!",
            data: user,
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Terjadi kesalahan saat menambahkan user",
            error: error.message,
            success: false,
        });
    }
}

exports.getAllUser = async (req, res) => {
    await connect();
    try {
        const sortField = 'name';
        const users = await User.find({ role: "karyawan" }).populate("jobdesk").sort({ [sortField]: 1 });
        if (!users || users.length === 0) {
            return res.status(404).json({
                message: "User tidak ditemukan",
                success: false,
            });
        }
        return res.status(200).json({
            message: "Berhasil Mengambil Data User",
            data: users,
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data user",
            error: error.message,
            success: false,
        })
    }
}

exports.getUserByID = async (req, res) => {
    await connect();
    try {
        const userID = req.params.id;
        const user = await User.findById(userID).populate("jobdesk");
        if (!user) {
            return res.status(404).json({
                message: "User tidak ditemukan",
                success: false,
            });
        }
        return res.status(200).json({
            message: "Berhasil Mengambil Data User Berdasarkan ID Mereka",
            data: user,
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data user berdasarkan ID mereka",
            error: error.message,
            success: false,
        })
    }
}

exports.deleteUser = async (req, res) => {
    await connect();
    try {
        const userID = req.params.id;
        const user = await User.findByIdAndDelete(userID);

        sendMessage(user.phone, `Hallo ${user.name}, Akun Anda telah dihapus oleh admin`);

        if (!user) {
            return res.status(404).json({
                message: "User tidak ditemukan",
                success: false,
            });
        }
        return res.status(200).json({
            message: "Berhasil Menghapus User",
            data: user,
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: "Terjadi kesalahan saat menghapus user",
            error: error.message,
            success: false,
        })
    }
}

exports.selfUpdateUser = async (req, res) => {
    await connect();
    try {
        upload.single("face")(req, res, async (error) => {
            if (error) {
                return res.status(500).json({
                    message: "Terjadi Kesalahan Saat Upload File",
                    error: error.message,
                    success: false,
                });
            }

            const slug = req.params.slug;
            const password = req.body.password;
            const phone = req.body.phone;

            const user = await User.findOne({ slug: slug });
            if (!user) {
                return res.status(404).json({
                    message: "User tidak ditemukan",
                    success: false,
                });
            }

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 11);
                user.password = hashedPassword;
            }

            if (phone) {
                user.phone = phone;
            }

            if (req.file) {
                const faceDescriptor = await detectFace(req.file.buffer);
                user.face_data = JSON.stringify(Array.from(faceDescriptor));
            }

            await user.save();
            return res.status(200).json({
                message: "Berhasil Memperbarui Data User",
                data: user,
                success: true,
            });
        })
    } catch (error) {
        return res.status(500).json({
            message: "Terjadi kesalahan saat memperbarui data user",
            error: error.message,
            success: false,
        })
    }
}

exports.updateUserByAdmin = async (req, res) => {
    await connect();
    try {
        const userID = req.params.id;
        const { name, password, phone, is_supervisor_candidate, jobdesk } = req.body;

        const user = await User.findByIdAndUpdate(userID).populate("jobdesk");

        if (!user) {
            return res.status(404).json({
                message: "User tidak ditemukan",
                success: false,
            });
        }

        let updatedField = [];
        let newValues = {};

        if (name) {
            const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
            user.slug = slug;
            user.name = name;
            updatedField.push("nama");
            newValues.name = name;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 11);
            user.password = hashedPassword;
            updatedField.push("password");
            newValues.password = req.body.password;
        }

        if (phone) {
            user.phone = phone;
            updatedField.push("nomor telepon");
            newValues.phone = req.body.phone;
        }

        if (typeof is_supervisor_candidate === "boolean") {
            user.is_supervisor_candidate = is_supervisor_candidate;
            updatedField.push("status supervisor");
            newValues.is_supervisor_candidate = is_supervisor_candidate ? "Supervisor" : "Bukan Supervisor";
        }

        if (jobdesk) {
            user.jobdesk = jobdesk;
            updatedField.push("jobdesk");

            const jobdeskData = await Jobdesk.find({ _id: { $in: jobdesk } });
            const jobdeskName = jobdeskData.map(jd => jd.name);
            newValues.jobdesk = jobdeskName;
        }

        await user.save();

        if (updatedField.length > 0) {
            const phone_replace = (phone || user.phone).replace(/^0/, "62");
            let message = "";
            const jobdeskData = await Jobdesk.find({ _id: { $in: jobdesk } });
            const jobdeskName = jobdeskData.map(jd => jd.name).join(", ");

            if (updatedField.length === 1) {
                switch (updatedField[0]) {
                    case "nama":
                        message = `Hallo nama anda telah diperbarui menjadi ${newValues.name}`;
                        break;
                    case "password":
                        message = `Hallo ${user.name}, password anda telah diperbarui menjadi ${newValues.password}`;
                        break;
                    case "nomor telepon":
                        message = `Hallo ${user.name}, nomor telepon anda telah diperbarui menjadi ${newValues.phone}`;
                        break;
                    case "status supervisor":
                        message = `Halo ${user.name}, status Anda telah diperbarui menjadi: *${newValues.is_supervisor_candidate}*`;
                        break;
                    case "jobdesk":
                        message = `Hallo ${user.name}, jobdesk anda telah diperbarui menjadi ${newValues.jobdesk.join(", ")}`;
                        break;
                }
            } else {
                message = `Halo ${user.name}, data Anda telah diperbarui oleh admin. Berikut data terbaru Anda:\n\n` +
                    `*Nama:* ${user.name}\n` +
                    `*Nomor Telepon:* ${user.phone}\n` +
                    (password ? `*Password Baru:* ${newValues.password}\n` : "") +
                    `*Status Supervisor:* ${user.is_supervisor_candidate ? "Supervisor" : "Bukan Supervisor"}\n` +
                    `*Jobdesk:* ${newValues.jobdesk ? newValues.jobdesk.join(", ") : user.jobdesk.map(jd => jd.name).join(", ")}`;
            }
            await sendMessage(phone_replace, message);
        }


        return res.status(200).json({
            success: true,
            message: "Berhasil Update Data",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            message: "Gagal Update Data",
            error: error.message,
            success: false,
        });
    }
}
