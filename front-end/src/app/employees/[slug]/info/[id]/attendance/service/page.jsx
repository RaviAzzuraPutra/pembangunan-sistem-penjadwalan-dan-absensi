"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Swal from "sweetalert2"
import axios from "axios"

export default function AttendanceService() {
    const videoRef = useRef(null)
    const [cameraActive, setCameraActive] = useState(false)
    const { slug, id } = useParams()
    const searchParams = useSearchParams();
    const router = useRouter();

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
    });

    const tahap = "service";

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
                        console.error("Gagal mendapatkan lokasi:", error)
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                )
            } else {
                console.error("Geolocation tidak didukung oleh browser ini.")
            }
        }
    }, [])

    useEffect(() => {
        const enableCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    setCameraActive(true)
                }
            } catch (error) {
                console.error("ERROR SAAT MENGAKSES KAMERA", error)
            }
        }

        enableCamera()

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks?.();
                if (tracks) {
                    tracks.forEach(track => track.stop());
                }
            }
        }
    }, []);

    const handleCaptureFromCamera = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const CTX = canvas.getContext("2d");
        if (!CTX) return

        CTX.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(async blob => {
            if (!blob) return

            const formData = new FormData()
            formData.append("face", blob, "selfie.jpg");
            console.log("Captured Image Blob:", blob);
            formData.append("latitude", String(location.latitude));
            formData.append("longitude", String(location.longitude));

            try {
                const response = await axios.post(
                    `http://localhost:5001/attendance/create/${slug}/event/${id}/tahap/${tahap}`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                )

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!!!',
                    text: response.data.message,
                    confirmButtonText: 'Tutup'
                }).then(() => {
                    router.push(`/employees/${slug}/info/${id}`);
                });
            } catch (err) {
                console.error("ERROR SAAT MENGIRIM DATA:", err);
                let errorMsg = "Terjadi kesalahan saat mengirim data. Silakan coba lagi.";
                if (err.response && err.response.data && err.response.data.message) {
                    errorMsg = err.response.data.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!!!',
                    text: errorMsg,
                    confirmButtonText: 'Tutup'
                });
            }
        }, "image/png")

    }

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
                <h1 className="text-2xl font-bold text-center">Absensi Service</h1>

                <div className="relative w-full max-w-md overflow-hidden shadow-lg border-2 border-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full aspect-[3/4] object-cover"
                    />
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