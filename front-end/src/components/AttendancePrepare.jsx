"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Swal from "sweetalert2"
import axios from "axios"
import { loadModels, detectFace, analyzeFace } from "../utils/faceDetection";

export default function AttendancePrepare() {
    const videoRef = useRef(null)
    const [cameraActive, setCameraActive] = useState(false)
    const { slug, id } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const canvasRef = useRef(null);
    const [showValidationText, setShowValidationText] = useState(false);
    const [challengeText, setChallengeText] = useState('');


    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
    });

    const tahap = "prepare";

    useEffect(() => {
        if (lat && lng) {
            setLocation({
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
            });
        } else {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        })
                    },
                    (error) => {
                        console.log("Gagal mendapatkan lokasi:", error)
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                )
            } else {
                console.log("Geolocation tidak didukung oleh browser ini.")
            }
        }
    }, [])

    useEffect(() => {
        const enableCamera = async () => {
            try {
                await loadModels();
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, facingMode: "user" })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    setCameraActive(true)
                }
            } catch (error) {
                console.log("ERROR SAAT MENGAKSES KAMERA", error)
            }
        }

        enableCamera()

        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const handleCaptureFromCamera = async () => {
        if (!videoRef.current) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const CTX = canvas.getContext("2d");
        if (!CTX) return;

        CTX.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) return;

            const validateFaceOnly = async () => {
                const formData = new FormData();
                formData.append("face", blob, "selfie.jpg");

                try {
                    const res = await axios.post(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/validate-face/${slug}`,
                        formData,
                        { headers: { "Content-Type": "multipart/form-data" } }
                    );
                    return res.data.success;
                } catch (err) {
                    Swal.fire({
                        icon: "error",
                        title: "Wajah Tidak Cocok",
                        text: "Silakan coba lagi. Pastikan wajah Anda sesuai dengan data sistem."
                    });
                    return false;
                }
            };

            const isFaceValid = await validateFaceOnly();
            if (!isFaceValid) return;

            // Langkah 2: Tantangan/challenge
            setShowValidationText(true);
            setChallengeText('');

            const directions = ['left', 'right'];
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            const challengeMessage = randomDir === 'left'
                ? 'Gerakkan kepala ke KIRI'
                : 'Gerakkan kepala ke KANAN';

            setChallengeText(challengeMessage);

            await new Promise(r => setTimeout(r, 500));

            const videoWidth = videoRef.current.videoWidth;
            let challengePassed = false;

            const validateLoop = async () => {
                for (let i = 0; i < 10; i++) {
                    const result = await analyzeFace(videoRef.current);
                    if (!result) continue;

                    const nose = result.nose;
                    const noseX = nose.reduce((sum, p) => sum + p.x, 0) / nose.length;

                    if (randomDir === 'left' && noseX > videoWidth / 2 + 30) challengePassed = true;
                    if (randomDir === 'right' && noseX < videoWidth / 2 - 30) challengePassed = true;

                    await new Promise(r => setTimeout(r, 401));
                }
            };

            await validateLoop();

            setShowValidationText(false);

            if (!challengePassed) {
                Swal.fire({
                    icon: "error",
                    title: "Validasi Gagal!!!",
                    text: "Gerakan tidak sesuai tantangan."
                });
                return;
            }

            // Langkah 3: Kirim absensi
            const finalFormData = new FormData();
            finalFormData.append("face", blob, "selfie.jpg");
            finalFormData.append("latitude", String(location.latitude));
            finalFormData.append("longitude", String(location.longitude));

            try {
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/create/${slug}/event/${id}/tahap/${tahap}`,
                    finalFormData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!!!',
                    text: response.data.message,
                    confirmButtonText: 'Tutup'
                }).then(() => {
                    router.push(`/employees/${slug}/info/${id}`);
                });
            } catch (err) {
                let errorMsg = "Terjadi kesalahan saat mengirim data. Silakan coba lagi.";
                if (err.response?.data?.message) {
                    errorMsg = err.response.data.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!!!',
                    text: errorMsg,
                    confirmButtonText: 'Tutup'
                });
            }
        }, "image/png");
    };



    useEffect(() => {
        let interval;
        if (videoRef.current && canvasRef.current) {
            interval = setInterval(() => {
                detectFace(videoRef.current, canvasRef.current);
            }, 800);
        }

        return () => clearInterval(interval);
    }, [cameraActive]);

    return (
        <div className="min-h-screen p-5 flex flex-col space-y-7">
            <div className="w-full">
                <Link href={`/employees/${slug}/info/${id}`}>
                    <div className="w-fit">
                        <Image
                            src="/icons/previous.png"
                            alt="Back Icon"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                    </div>
                </Link>
            </div>

            <div className="flex flex-col items-center justify-center space-y-7">
                <h1 className="text-2xl font-bold text-center">Absensi Prepare</h1>

                <div className="relative w-full max-w-md overflow-hidden shadow-lg border-2 border-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full aspect-[3/4] object-cover"
                        style={{ transform: "scaleX(-1)" }}
                    />

                    {showValidationText && (
                        <p className="text-center font-semibold text-black">{challengeText}</p>
                    )}

                    <canvas ref={canvasRef} className="absolute top-0 w-full h-full" />
                </div>

                <div
                    className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center shadow-lg transition"
                    onClick={handleCaptureFromCamera}
                >
                    <Image
                        src="/icons/dslr-camera.png"
                        alt="Camera Icon"
                        width={24}
                        height={24}
                        className="w-10 h-10"
                    />
                </div>
            </div>
        </div>
    )
}