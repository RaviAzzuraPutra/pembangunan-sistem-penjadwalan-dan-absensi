"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export default function ForgotPassword() {
    const [ID_Login, setID_Login] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/forgot-password/forgot-password`, { ID_Login });
            router.push(`/forgot-password/verify-otp?ID_Login=${ID_Login}`)
        } catch (error) {
            setError(error.response?.data?.message || 'ID_Login Tidak Ditemukan');
        }
    }

    return (
        <>
            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 bg-gradient-to-b from-gray-100 to-gray-300">
                <div className="w-full max-w-md flex flex-col">
                    <div className="bg-gray-500 p-5 flex items-center justify-center">
                        <h1 className="text-white text-2xl font-bold">Halaman Lupa Password</h1>
                    </div>

                    <div className="bg-white p-6 shadow-lg">
                        <div className="italic text-center text-gray-950 text-sm mb-7 md:text-base">
                            Masukan ID Login Anda
                        </div>


                        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="ID Login"
                                    value={ID_Login}
                                    onChange={(e) => setID_Login(e.target.value)}
                                    className="w-full p-4 border border-slate-400 rounded-lg pl-3 pr-10 focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="flex items-center justify-center pt-2 mb-4 mt-4">
                                <button type="submit" className="bg-gray-500 text-white px-6 py-2 rounded flex justify-end hover:bg-gray-600">
                                    KIRIM OTP
                                </button>
                                <Link href="/login" className="ml-2">
                                    <button type="submit" className="bg-gray-500 text-white px-6 py-2 rounded flex justify-end hover:bg-gray-600">
                                        KEMBALI
                                    </button>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}