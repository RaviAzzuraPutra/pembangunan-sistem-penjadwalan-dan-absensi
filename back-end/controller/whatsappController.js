const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let qrCodeData = null;
let isReady = false;

client.on('qr', (qr) => {
    qrCodeData = qr;
    isReady = false;
    console.log("QR Code Sudah Siap, Silahkan Scan!");
});

client.on('ready', () => {
    isReady = true;
    console.log("WhatsApp Client Siap Digunakan!");
});

client.initialize();

const getQRCode = async (req, res) => {
    if (isReady) {
        return res.status(200).json({
            message: "WhatsApp Client Siap Digunakan!",
            connected: true
        });
    };

    if (!qrCodeData) {
        return res.status(200).json({
            message: "QR Code Belum Siap!",
            connected: false
        })
    }

    try {
        const qrImage = await qrcode.toDataURL(qrCodeData);
        res.status(200).json({
            qr: qrImage,
            message: "QR Code Siap!",
            connected: false
        })
    } catch (error) {
        res.status(500).json({
            message: "Gagal Membuat QR Code!",
            error: error.message
        })
    }
}

module.exports = {
    client,
    getQRCode,
};