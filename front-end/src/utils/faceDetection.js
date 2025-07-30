const padding = 20;
let lastDetection = null;
let lastDetectionTime = Date.now();
const MAX_MISSING_MS = 1500;

// Simpan instance faceapi global
let faceapiInstance = null;

// Hanya import face-api.js di browser
async function getFaceApi() {
    if (faceapiInstance) return faceapiInstance;
    if (typeof window === "undefined") throw new Error("face-api.js hanya tersedia di browser");

    // Dynamic import khusus untuk browser
    const mod = await import(/* webpackChunkName: "face-api" */ "face-api.js");
    faceapiInstance = mod;
    return mod;
}

// Load semua model face-api.js
export async function loadModels() {
    const faceapi = await getFaceApi();
    const MODEL_URL = "/models";
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
}

// Deteksi wajah dan gambar bounding box
export async function detectFace(video, canvas) {
    const faceapi = await getFaceApi();
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;

    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ minConfidence: 0.5 }));

    const ctx = canvas.getContext("2d");
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

    ctx.strokeStyle = "pink";
    ctx.lineWidth = 4;
    ctx.strokeRect(box.x - padding, box.y - padding, box.width + padding * 2, box.height + padding * 2);
}

// Analisis wajah (landmarks dan descriptor)
export async function analyzeFace(video) {
    const faceapi = await getFaceApi();
    const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) return null;

    return {
        descriptor: detection.descriptor,
        nose: detection.landmarks.getNose(),
        mouth: detection.landmarks.getMouth(),
    };
}
