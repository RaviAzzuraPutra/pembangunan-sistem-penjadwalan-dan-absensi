"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Swal from "sweetalert2"
import axios from "axios"
import { loadModels, detectFace, analyzeFace } from "../../../../../../../utils/faceDetection";


export default function Face_Verification() {
    const videoRef = useRef(null)
    const [cameraActive, setCameraActive] = useState(false)
    const { slug, id } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const canvasRef = useRef(null);
    const [showValidationText, setShowValidationText] = useState(false);
    const [challengeText, setChallengeText] = useState('');

    // Tambah timer 11 menit (660 detik)
    const MAX_TIME = 11 * 60; // 11 menit dalam detik
    const [countdown, setCountdown] = useState(MAX_TIME);
    const [selfieTaken, setSelfieTaken] = useState(false);
    // Timer 11 menit, jika habis trigger periodicFaceFail
    useEffect(() => {
        if (selfieTaken) return;
        if (countdown <= 0) {
            handleTimeoutFail();
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, selfieTaken]);

    // Fungsi jika timeout (tidak selfie dalam 11 menit)
    const handleTimeoutFail = async () => {
        setSelfieTaken(true); // prevent double
        Swal.fire({
            icon: 'error',
            title: 'Waktu Habis',
            text: 'Anda tidak melakukan verifikasi wajah dalam waktu yang ditentukan.',
            confirmButtonText: 'Tutup'
        });
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/periodic-face-fail`, {
                userId: id,
                eventId: id,
                latitude: location.latitude,
                longitude: location.longitude,
                note: 'Tidak melakukan verifikasi wajah periodik (timeout)'
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Terjadi kesalahan saat mengirim data. Silakan coba lagi.',
                confirmButtonText: 'Tutup'
            });
        }
        router.push(`/employees/${slug}`);
    };


    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
    });

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
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
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

    // Fungsi baru: handleCaptureFromCamera dengan liveness detection (gerakan kiri/kanan)
    const handleCaptureFromCamera = async () => {
        if (!videoRef.current) return;
        setSelfieTaken(true); // agar timer tidak trigger fail

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const CTX = canvas.getContext("2d");
        if (!CTX) return

        CTX.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(async blob => { // 1. Tantangan liveness: random kiri/kanan
            const directions = ['left', 'right'];
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            const challengeMessage = randomDir === 'left'
                ? 'Gerakkan kepala ke KIRI'
                : 'Gerakkan kepala ke KANAN';
            setChallengeText(challengeMessage);
            setShowValidationText(true);

            await new Promise(r => setTimeout(r, 500));

            let challengePassed = false;
            let bestDescriptor = null;
            const videoWidth = videoRef.current.videoWidth;

            // 2. Validasi gerakan selama 10x (sekitar 4 detik)
            const validateLoop = async () => {
                for (let i = 0; i < 10; i++) {
                    const result = await analyzeFace(videoRef.current);
                    if (!result) continue;

                    descriptors.push(result.descriptor);

                    const nose = result.nose;
                    const noseX = nose.reduce((sum, p) => sum + p.x, 0) / nose.length;

                    if (randomDir === 'left' && noseX < videoWidth / 2 - 30) challengePassed = true;
                    if (randomDir === 'right' && noseX > videoWidth / 2 + 30) challengePassed = true;
                    console.log(`NoseX: ${noseX}, Midpoint: ${videoWidth / 2}`);

                    await new Promise(r => setTimeout(r, 401));
                }
            };

            await validateLoop();

            setShowValidationText(false);

            if (!challengePassed || !bestDescriptor) {
                Swal.fire({
                    icon: "error",
                    title: "Validasi Gagal!!!",
                    text: "Gerakan tidak sesuai tantangan."
                });
                setSelfieTaken(false); // allow retry
                return;
            }

            // 3. Kirim descriptor ke backend untuk face recognition
            try {
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/periodic-face-verification`,
                    {
                        user_id: id,
                        event_id: id,
                        faceDescriptor: Array.from(bestDescriptor),
                    }
                );

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Verifikasi Berhasil!!!',
                        text: response.data.message,
                        confirmButtonText: 'Tutup'
                    }).then(() => {
                        router.push(`/employees/${slug}`);
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal!!!',
                        text: response.data.message,
                        confirmButtonText: 'Tutup'
                    });
                    setSelfieTaken(false); // allow retry
                }
            } catch (err) {
                let errorMsg = "Terjadi kesalahan saat mengirim data. Silakan coba lagi.";
                if (err.response && err.response.data && err.response.data.message) {
                    errorMsg = err.response.data.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: errorMsg,
                    confirmButtonText: 'Tutup'
                });
                setSelfieTaken(false); // allow retry
            }
        })
    };

    useEffect(() => {
        let interval;
        if (videoRef.current && canvasRef.current) {
            interval = setInterval(() => {
                detectFace(videoRef.current, canvasRef.current);
            }, 200); // setiap 200ms
        }

        return () => clearInterval(interval);
    }, [cameraActive]);


    return (
        <div className="min-h-screen p-5 flex flex-col space-y-7">
            <div className="flex flex-col items-center justify-center space-y-7">
                <h1 className="text-2xl font-bold text-center">Verifikasi Berkala</h1>
                <div className="relative w-full max-w-md overflow-hidden shadow-lg border-2 border-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full aspect-[3/4] object-cover"
                    />
                    {showValidationText && (
                        <p className="text-center font-semibold text-black">{challengeText}</p>
                    )}
                    <canvas ref={canvasRef} className="absolute top-0 w-full h-full" />
                    {/* Timer tampil di pojok kanan atas */}
                    <div className="absolute top-2 right-2 bg-white bg-opacity-80 rounded px-2 py-1 text-xs font-bold text-black">
                        Sisa waktu: {Math.floor(countdown / 60)}:{('0' + (countdown % 60)).slice(-2)}
                    </div>
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