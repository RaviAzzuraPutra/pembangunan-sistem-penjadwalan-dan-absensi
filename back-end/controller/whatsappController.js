const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client;
let qrCodeData = null;
let isReady = false;

const initClient = () => {
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        qrCodeData = qr;
        isReady = false;
        console.log("QR Code Siap, Silakan Scan!");
    });

    client.on('ready', () => {
        isReady = true;
        console.log("WhatsApp Client Siap Digunakan!");
    });

    client.on('auth_failure', (msg) => {
        isReady = false;
        console.error("Autentikasi Gagal:", msg);
    });

    client.on('disconnected', (reason) => {
        isReady = false;
        console.warn("WhatsApp Terputus:", reason);
        console.log("Menginisialisasi ulang client...");

        // Hentikan client lama dan buat ulang client baru
        client.destroy()
            .then(() => {
                initClient(); // Rekoneksi otomatis
            })
            .catch(err => {
                console.error("Gagal destroy client:", err);
                // Retry initClient jika perlu
                setTimeout(initClient, 5000);
            });
    });

    client.on('error', (err) => {
        console.error("Error WhatsApp Client:", err);
    });

    client.initialize();
};

// Inisialisasi pertama
initClient();

const getQRCode = async (req, res) => {
    if (isReady) {
        return res.status(200).json({
            message: "WhatsApp Client Siap Digunakan!",
            connected: true
        });
    }

    if (!qrCodeData) {
        return res.status(200).json({
            message: "QR Code Belum Siap!",
            connected: false
        });
    }

    try {
        const qrImage = await qrcode.toDataURL(qrCodeData);
        res.status(200).json({
            qr: qrImage,
            message: "QR Code Siap!",
            connected: false
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal Membuat QR Code!",
            error: error.message
        });
    }
};

module.exports = {
    client,
    getQRCode,
};
