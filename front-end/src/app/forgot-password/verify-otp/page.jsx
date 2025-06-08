"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function VerifyOtp() {
    const searchParams = useSearchParams();
    const ID_Login = searchParams.get("ID_Login");
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/forgot-password/verify-otp', { ID_Login, otp });
            router.push(`/forgot-password/reset-password?ID_Login=${ID_Login}`);
        } catch (error) {
            setError(error.response?.data?.message || 'OTP salah');
        }
    }

    return (
        <>
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">
                <div className="w-full max-w-md flex flex-col">
                    <div className="bg-gray-500 p-5 flex items-center justify-center">
                        <h1 className="text-white text-2xl font-bold">Verifikasi OTP</h1>
                    </div>

                    <div className="bg-white p-6 shadow-lg">
                        <div className="italic text-center text-gray-950 text-sm mb-7 md:text-base">
                            Masukan Kode OTP Yang Telah Dikirimkan Ke Whatsapp Anda
                        </div>


                        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full p-4 border border-slate-400 rounded-lg pl-3 pr-10 focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="flex items-center justify-center pt-2 mb-4 mt-4">
                                <button type="submit" className="bg-gray-500 text-white px-6 py-2 rounded flex justify-end hover:bg-gray-600">
                                    VALIDASI
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}