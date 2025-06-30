"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';


export default function Whatsapp() {
    const [QRImage, setQRImage] = useState(null);
    const [loading, setLoading] = useState("loading...");

    useEffect(() => {
        const fetchQRCode = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/whatsapp/connect`)
                const data = response.data;

                if (data.connected) {
                    setLoading("connected")
                } else if (data.qr) {
                    setQRImage(data.qr);
                    setLoading("Silahkan Scan QR Code di atas")
                } else {
                    setLoading(data.message || "Menunggu QR Code...");
                }

            } catch (error) {
                console.error("Terjasi kesalahan saat mengambil QR Code:", error);
                setLoading("Terjadi kesalahan saat mengambil QR Code")
            }
        }

        fetchQRCode()

        const interval = setInterval(() => {
            fetchQRCode()
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className='flex flex-col items-center justify-center min-h-[80vh]'>
            <div className='bg-white p-10 rounded-3xl shadow-md flex flex-col items-center max-w-md w-full border-2 border-green-600'>
                <div className='flex items-center justify-center mb-6 text-green-400'>
                    <Image
                        src="/icons/whatsapp-green.png"
                        alt="Logo Whatsapp"
                        width={50}
                        height={50}
                        className="object-contain mr-4"
                    />
                    <h1 className='text-2xl font-bold'>
                        Scan Whatsapp
                    </h1>
                </div>
                <div className='mb-7 p-6 bg-white rounded-xl border-2 border-gray-200'>
                    {QRImage ? (
                        <Image src={QRImage} alt="QR Code" width={200} height={200} unoptimized />
                    ) : (
                        <p className='text-sm text-bold text-slate-400'>{loading}</p>
                    )}
                </div>

                <div className='text-center text-black'>
                    <p className='mb-3 font-md'>Cara Scan:</p>
                    <ol className='text-sm text-left space-y-4'>
                        <li>1. Buka WhatsApp di ponsel Anda</li>
                        <li>2. Ketuk Menu (tiga titik) &gt; WhatsApp Web</li>
                        <li>3. Arahkan kamera ponsel ke QR code ini</li>
                        <li>4. Tunggu hingga terhubung</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}