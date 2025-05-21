const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');
const fs = require('fs');
const multer = require('multer');

const upload = multer({ dest: "uploads/" });

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const removeFile = (filePath) => {
    fs.unlink(filePath, (error) => {
        if (error) {
            console.error("Gagal menghapus file:", error);
        }
    })
}

const loadModels = async () => {
    const modelPaths = path.join(__dirname, "../face-model");
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPaths);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPaths);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPaths);
};

const formatLandmarks = (landmarks) => {
    return landmarks.positions.map(pt => ({ x: pt.x, y: pt.y }));
};

exports.register = async (req, res) => {
    try {
        await loadModels();
        upload.single("image")(req, res, async (error) => {
            if (error) {
                return res.status(400).json({
                    message: "Gagal mengupload file",
                    error: error.message
                })
            }

            const imgPath = req.file.path;
            const img = await canvas.loadImage(imgPath);

            // Deteksi wajah beserta landmarks dan descriptor
            const detection = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

            // Jika tidak ada wajah terdeteksi
            if (!detection) {
                removeFile(imgPath);
                return res.status(400).json({ error: "Tidak ada wajah yang terdeteksi" });
            }

            // Format data landmarks
            const landmarks = detection.landmarks;
            const descriptor = detection.descriptor; // Array 128 angka

            // Hapus file upload (opsional)
            removeFile(imgPath);

            const descriptorPath = path.join(__dirname, '../data');
            if (!fs.existsSync(descriptorPath)) {
                fs.mkdirSync(descriptorPath, { recursive: true });
            }

            fs.writeFileSync(
                path.join(__dirname, '../data/face-descriptor.json'),
                JSON.stringify(Array.from(descriptor))  // convert Float32Array to regular array
            );

            // Response untuk tahap REGISTER
            return res.json({
                stage: "register",
                faceLandmarks: {
                    satage: "register",
                    landmarks: landmarks,
                },
                faceDescriptor: {
                    stage: "register",
                    descriptor: descriptor,
                }
            });
        })
    } catch (error) {
        console.error('Error saat proses register:', error);
        return res.status(500).json({ error: "Terjadi kesalahan server" });
    }
}

exports.recognize = async (req, res) => {
    try {
        await loadModels();
        upload.single("image")(req, res, async (error) => {
            if (error) {
                return res.status(400).json({
                    message: "Gagal mengupload file",
                    error: error.message
                })
            }
            const imgPath = req.file.path;
            const img = await canvas.loadImage(imgPath);

            const detection = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                removeFile(imgPath);
                return res.status(400).json({ error: "Tidak ada wajah yang terdeteksi" });
            }

            const landmarks = detection.landmarks;
            const descriptor = detection.descriptor;

            removeFile(imgPath);

            const referenceData = fs.readFileSync(path.join(__dirname, '../data/face-descriptor.json'));
            const referenceArray = JSON.parse(referenceData);
            const referenceDescriptor = new Float32Array(referenceArray);

            const distance = faceapi.euclideanDistance(descriptor, referenceDescriptor);
            const threshold = 0.6;
            const isMatch = distance < threshold;

            // Response untuk tahap RECOGNIZE
            return res.json({
                stage: "recognize",
                faceLandmarks: {
                    stage: "recognize",
                    landmarks: landmarks,
                },
                faceDescriptor: {
                    stage: "recognize",
                    descriptor: descriptor,
                },
                match: isMatch,
                distance: distance,
                threshold: threshold,
            });
        })
    } catch (error) {
        console.error('Error saat proses recognize:', error);
        return res.status(500).json({ error: "Terjadi kesalahan server" });
    }
}

