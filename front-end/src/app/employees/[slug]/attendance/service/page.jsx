"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

export default function AttendancePrepare() {
    const videoRef = useRef(null)
    const [cameraActive, setCameraActive] = useState(false)

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
        if (CTX) {
            CTX.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/png");
            console.log("Captured Image Data:", imageData);
            // TINGGAL DIINTERGRASI KE BACKEND UNTUK DIKIRIM KE SERVER
        }
    }

    return (
        <div className="min-h-screen p-5 flex flex-col space-y-7">
            <div className="w-full">
                <Link href="/employees/info">
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