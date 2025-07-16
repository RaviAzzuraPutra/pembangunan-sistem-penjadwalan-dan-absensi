const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
const canvas = require("canvas");
const path = require("path");
const { TextEncoder, TextDecoder } = require('util');


if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const loadModels = async () => {
    const modelPaths = path.join(__dirname, "../face-model");
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPaths);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPaths);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPaths);
};

const detectFace = async (imageBuffer) => {
    await loadModels();

    try {
        const image = await canvas.loadImage(imageBuffer);
        const detections = await faceapi.detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceLandmarks().withFaceDescriptor();

        if (!detections) {
            console.warn("⚠️ Tidak ada wajah terdeteksi.");
            return null;
        }

        return detections.descriptor;
    } catch (error) {
        console.error("Error detecting face:", error);
        return null;
    }
};

module.exports = {
    detectFace
}

