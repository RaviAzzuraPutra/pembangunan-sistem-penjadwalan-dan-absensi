"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

export default function ResetPassword() {
    const searchParams = useSearchParams();
    const ID_Login = searchParams.get("ID_Login");
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Password Tidak Sama!',
                text: "Password dan konfirmasi password tidak sama.",
            });
            return;
        }

        if (password.length < 8) {
            Swal.fire({
                icon: 'error',
                title: 'Password Terlalu Pendek!',
                text: "Password harus minimal 8 karakter.",
            });
            return;
        }

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/forgot-password/reset-password`, {
                ID_Login,
                newPassword: password
            });

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!!!',
                text: response.data.message,
                confirmButtonText: 'Tutup'
            }).then(() => {
                router.push("/login");
            });

        } catch (error) {
            console.log("RESET ERROR:", error); // debug log
            setError(error.response?.data?.message || "Gagal mereset password.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 bg-gradient-to-b from-gray-100 to-gray-300">
            <div className="w-full max-w-md flex flex-col">
                <div className="bg-gray-500 p-5 flex items-center justify-center">
                    <h1 className="text-white text-2xl font-bold">Reset Password</h1>
                </div>
                <div className="bg-white p-6 shadow-lg">
                    <div className="italic text-center text-gray-700 text-sm mb-6">
                        Masukkan password baru Anda
                    </div>

                    {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Password Baru"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:border-black"
                        />
                        <input
                            type="password"
                            placeholder="Konfirmasi Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:border-black"
                        />
                        <div className="flex items-center justify-center pt-2 mb-4 mt-4">
                            <button type="submit" className="bg-gray-500 text-white px-6 py-2 rounded flex justify-end hover:bg-gray-600">
                                SIMPAN PASSWORD
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    )
}