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
    const { slug, id } = useParams()
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
                Swal.fire({
                    icon: "error",
                    title: "Geolocation Tidak Didukung",
                    text: "Browser Anda tidak mendukung geolocation. Silakan gunakan browser yang mendukung fitur ini."
                });
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
                Swal.fire({
                    icon: "error",
                    title: "Gagal Mengakses Kamera",
                    text: "Pastikan kamera Anda terhubung dan izinkan akses kamera pada browser ini"
                });
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

        // 1. Ambil gambar untuk verifikasi wajah
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        try {
            // 2. Verifikasi wajah terlebih dahulu
            const verifyBlob = await new Promise((resolve) => {
                canvas.toBlob(resolve, "image/jpeg", 0.9);
            });

            const verifyFormData = new FormData();
            verifyFormData.append("face", verifyBlob, "verify.jpg");

            const verifyResponse = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/verify-face/${slug}`,
                verifyFormData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            // 3. Jika wajah tidak cocok
            if (!verifyResponse.data.face_match) {
                Swal.fire({
                    icon: "error",
                    title: "Verifikasi Gagal",
                    text: verifyResponse.data.message || "Wajah tidak cocok!"
                });
                return;
            }

            // 4. Lanjutkan ke challenge jika wajah cocok
            setShowValidationText(true);
            setChallengeText('');

            const directions = ['left', 'right'];
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            const challengeMessage = randomDir === 'left'
                ? 'Gerakkan kepala ke KIRI'
                : 'Gerakkan kepala ke KANAN';
            setChallengeText(challengeMessage);

            await new Promise(r => setTimeout(r, 500));

            // 5. Proses validasi challenge
            let challengeSuccess = false;
            const videoWidth = videoRef.current.videoWidth;

            for (let i = 0; i < 10; i++) {
                const result = await analyzeFace(videoRef.current);
                if (!result) continue;

                const nose = result.nose;
                const noseX = nose.reduce((sum, p) => sum + p.x, 0) / nose.length;

                if (randomDir === 'left' && noseX > videoWidth / 2 + 30) {
                    challengeSuccess = true;
                    break;
                }
                if (randomDir === 'right' && noseX < videoWidth / 2 - 30) {
                    challengeSuccess = true;
                    break;
                }

                await new Promise(r => setTimeout(r, 400));
            }

            setShowValidationText(false);

            // 6. Jika challenge gagal
            if (!challengeSuccess) {
                Swal.fire({
                    icon: "error",
                    title: "Validasi Gagal!",
                    text: "Gerakan tidak sesuai tantangan."
                });
                return;
            }

            // 7. Jika challenge berhasil, ambil gambar baru untuk absensi
            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = videoRef.current.videoWidth;
            finalCanvas.height = videoRef.current.videoHeight;
            const finalCtx = finalCanvas.getContext("2d");
            finalCtx.drawImage(videoRef.current, 0, 0, finalCanvas.width, finalCanvas.height);

            const finalBlob = await new Promise((resolve) => {
                finalCanvas.toBlob(resolve, "image/jpeg", 0.9);
            });

            const formData = new FormData();
            formData.append("face", finalBlob, "selfie.jpg");
            formData.append("latitude", String(location.latitude));
            formData.append("longitude", String(location.longitude));
            formData.append("challengePassed", "true");

            // 8. Kirim data absensi
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/create/${slug}/event/${id}/tahap/${tahap}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            // 9. Tampilkan feedback sukses
            if (response.data.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Absensi Berhasil!',
                    text: response.data.message,
                    confirmButtonText: 'OK'
                });
                router.push(`/employees/${slug}/info/${id}`);
            }

        } catch (error) {
            console.error("Error in attendance process:", error);
            let errorMessage = "Terjadi kesalahan saat proses absensi";

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
            });
        }
    };


    useEffect(() => {
        let interval;
        if (videoRef.current && canvasRef.current) {
            interval = setInterval(() => {
                detectFace(videoRef.current, canvasRef.current);
            }, 800); // setiap 200ms
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
        </div >
    )
}