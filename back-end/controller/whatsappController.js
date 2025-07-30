const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

const clearDebugLog = () => {
    const debugLogPath = path.join(__dirname, '.wwebjs_auth', 'session', 'Default', 'chrome_debug.log');
    try {
        if (fs.existsSync(debugLogPath)) {
            fs.unlinkSync(debugLogPath);
        }
    } catch (err) {
        console.warn("Tidak bisa hapus chrome_debug.log:", err.message);
    }
};

let client;
let qrCodeData = null;
let isReady = false;

const initClient = () => {
    clearDebugLog();
    client = new Client({
        authStrategy: new LocalAuth({ dataPath: './sessions' }),
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

    client.on('auth_failure', async (msg) => {
        console.error("Autentikasi Gagal:", msg);
        fs.rmSync('./sessions', { recursive: true, force: true }); // hapus sesi rusak
        isReady = false;
        initClient(); // re-init
    });

    client.on('disconnected', async (reason) => {
        isReady = false;
        console.warn("WhatsApp Terputus:", reason);
        console.log("Menginisialisasi ulang client...");

        try {
            await client.destroy();
        } catch (err) {
            console.error("Gagal destroy client:", err.message);
        }

        setTimeout(() => {
            try {
                initClient();
            } catch (err) {
                console.error("Gagal init ulang client:", err.message);
            }
        }, 5000);
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
            connected: true,
            message: "WhatsApp Client Siap Digunakan!",
        });
    }

    if (!qrCodeData) {
        return res.status(200).json({
            connected: false,
            message: "QR Code Belum Siap!",
        });
    }

    try {
        const qrImage = await qrcode.toDataURL(qrCodeData);
        res.status(200).json({
            qr: qrImage,
            connected: false,
            message: "QR Code Siap!",
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
