import * as faceapi from 'face-api.js';

let lastDetection = null;
let lastDetectionTime = null;
const padding = 20;
const MAX_MISSING_MS = 2000;

export async function loadModels() {
    const MODEL_URL = '/models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
}

export async function detectFace(video, canvas) {
    const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight
    }

    canvas.width = displaySize.width;
    canvas.height = displaySize.height;

    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 })
    );

    const ctx = canvas.getContext('2d');

    const toDraw = detections || lastDetection;

    if (toDraw) {
        if (detections) lastDetection = detections;

        const resized = faceapi.resizeResults(toDraw, displaySize);
        const box = resized.box;

        ctx.strokeStyle = 'pink';
        ctx.lineWidth = 10;
        ctx.strokeRect(
            box.x - padding,
            box.y - padding,
            box.width + padding * 2,
            box.height + padding * 2
        );
    }
}