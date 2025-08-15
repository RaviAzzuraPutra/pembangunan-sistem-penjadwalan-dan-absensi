"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { getUserSession } from "../../utils/getSession";

export default function LoginPage() {
    const [IDlogin, setIDlogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    // Cek session saat halaman login dibuka
    useEffect(() => {
        const checkSession = async () => {
            const user = await getUserSession();
            if (user) {
                if (user.role === "direktur") {
                    router.replace(`/direktur/${user.slug}`);
                } else if (user.role === "karyawan") {
                    router.replace(`/employees/${user.slug}`);
                }
            }
        };
        checkSession();
    }, [router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
                ID_Login: IDlogin,
                password: password,
            }, {
                withCredentials: true
            });

            const { success, user, token } = response.data;
            if (success) {
                try {
                    if (token) {
                        localStorage.setItem('auth_token', token);
                    }
                } catch (e) { /* ignore storage issues */ }
                if (user.role === "direktur") {
                    router.replace(`/direktur/${user.slug}`);
                } else if (user.role === "karyawan") {
                    router.replace(`/employees/${user.slug}`);
                }
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError("Terjadi kesalahan pada sistem.");
                console.log("Login Error Response:", error.response?.data || error.message);
            }
        }
    }



    return (
        <>
            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 bg-gradient-to-b from-gray-100 to-gray-300">
                <div className="w-full max-w-md flex flex-col">
                    <div className="bg-gray-500 p-5 flex items-center justify-center">
                        <h1 className="text-white text-2xl font-bold">Sistem Penjadwalan dan Absensi</h1>
                    </div>

                    <div className="bg-white p-6 shadow-lg">
                        <div className="italic text-center text-gray-950 text-sm mb-7 md:text-base">
                            Masukan ID Login dan Password Anda
                        </div>

                        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="ID Login"
                                    value={IDlogin}
                                    onChange={(e) => setIDlogin(e.target.value)}
                                    className="w-full p-4 border border-slate-400 rounded-lg pl-3 pr-10 focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-4 border border-slate-400 rounded-lg pl-3 pr-10 focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="flex items-center justify-between pt-2 mb-4 mt-4">
                                <div className="text-sm m">
                                    <div className="text-gray-700">LUPA PASSWORD?</div>
                                    <Link href="/forgot-password" className="text-gray-700 hover:underline hover:text-gray-950">
                                        <p>Silahkan Reset Password</p>
                                    </Link>
                                </div>
                                <button type="submit" className="bg-gray-500 text-white px-6 py-2 rounded flex justify-end hover:bg-gray-600">
                                    LOGIN
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </>
    )
}