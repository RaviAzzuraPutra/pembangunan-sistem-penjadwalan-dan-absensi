"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { loadModels, detectFace } from "../../../../../utils/faceDetection";
import Swal from "sweetalert2";

export default function ChangeFace() {
    const videoRef = useRef(null)
    const [cameraActive, setCameraActive] = useState(false)
    const params = useParams();
    const slug = params.slug;
    const router = useRouter();
    const canvasRef = useRef(null);

    useEffect(() => {
        const enableCamera = async () => {
            try {
                await loadModels(); // Load face detection models if needed
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

    const handleCapture = async () => {

        if (!videoRef.current) return

        const canvas = document.createElement("canvas")
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        const context = canvas.getContext("2d")

        if (!context) return

        // Flip context agar hasil capture tidak mirror
        context.save();
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        context.restore();

        canvas.toBlob(async blob => {
            if (!blob) return

            const formData = new FormData()
            formData.append("face", blob)

            try {
                const res = await axios.put(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/update-self/${slug}`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                )

                router.push(`/employees/${slug}/profile?success=true&message=${encodeURIComponent(res.data.message)}`)
            } catch (err) {
                const errorMsg = err.response?.data?.message || "Gagal memperbarui wajah"
                Swal.fire({
                    icon: "error",
                    title: "Gagal!!!",
                    text: errorMsg,
                })
                router.push(`/employees/${slug}/profile?success=false&message=${encodeURIComponent(errorMsg)}`)
            }
        }, "image/jpeg")
    }

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
                <Link href={`/employees/${slug}/profile`}>
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
                <h1 className="text-2xl font-bold text-center">Ubah Data Wajah</h1>

                <div className="relative w-full max-w-md overflow-hidden shadow-lg border-2 border-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full aspect-[3/4] object-cover"
                        style={{ transform: "scaleX(-1)" }}
                    />
                    <canvas ref={canvasRef} className="absolute top-0 w-full h-full" />
                </div>

                <div
                    className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center shadow-lg transition"
                    onClick={handleCapture}
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