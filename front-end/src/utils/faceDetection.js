const padding = 20;
let lastDetection = null;
let lastDetectionTime = Date.now();
const MAX_MISSING_MS = 1500;

// Global faceapi variable for browser-only import
let faceapi = null;

async function getFaceApi() {
    if (faceapi) return faceapi;
    // Only import in browser
    if (typeof window !== 'undefined') {
        faceapi = await import('face-api.js/dist/face-api.esm.js');
        return faceapi;
    }
    throw new Error('face-api.js only available in browser');
}

export async function loadModels() {
    const faceapi = await getFaceApi();
    const MODEL_URL = '/models';
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
}

export async function detectFace(video, canvas) {
    const faceapi = await getFaceApi();
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

    const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight
    };

    canvas.width = displaySize.width;
    canvas.height = displaySize.height;

    faceapi.matchDimensions(canvas, displaySize);

    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
    const detections = await faceapi.detectSingleFace(video, options);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();

    const toDraw = detections || lastDetection;

    if (detections) {
        lastDetection = detections;
        lastDetectionTime = now;
    }

    if (!lastDetection) return;
    if (now - lastDetectionTime > MAX_MISSING_MS) {
        lastDetection = null;
        return;
    }

    const resized = faceapi.resizeResults(lastDetection, displaySize);
    const box = resized.box;

    ctx.strokeStyle = 'pink';
    ctx.lineWidth = 4;
    ctx.strokeRect(
        box.x - padding,
        box.y - padding,
        box.width + padding * 2,
        box.height + padding * 2
    );
}

export async function analyzeFace(video) {
    const faceapi = await getFaceApi();
    const detection = await faceapi
        .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) {
        return null;
    }

    const mouth = detection.landmarks.getMouth();
    const nose = detection.landmarks.getNose();

    return {
        descriptor: detection.descriptor,
        nose: nose,
        mouth: mouth
    }
}