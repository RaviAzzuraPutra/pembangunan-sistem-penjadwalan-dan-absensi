"use client";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

export default function Whatsapp() {
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
                    <QRCode
                        value={'https://wa.me/6281312201169'}
                        size={200}
                        level={"H"}
                        className="mx-auto"
                        fgColor="#4CAF50"
                    />
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