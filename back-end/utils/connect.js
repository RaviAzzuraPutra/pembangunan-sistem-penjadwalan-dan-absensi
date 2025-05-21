const mongoose = require('mongoose');
require('dotenv').config();

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {})
        console.log("Berhasil terhubung ke database mongoDB! ✓")
    } catch (error) {
        console.log("Gagal terhubung ke database mongoDB! ✗")
        console.error(error);
        process.exit(1);
    }
}


module.exports = connect;