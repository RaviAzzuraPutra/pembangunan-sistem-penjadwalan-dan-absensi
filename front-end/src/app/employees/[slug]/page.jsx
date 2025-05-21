"use client"
import Link from "next/link"
import Image from "next/image"
import AuthCheck from "../../../utils/authCheck"
import { useRouter } from "next/navigation"
import axios from "axios"

export default function Employees() {
    const router = useRouter()
    const handleLogout = async () => {
        try {
            const response = await axios.post("http://localhost:5001/auth/logout", {}, {
                withCredentials: true,
            });
            if (response.data.success) {
                router.replace("/login");
            }
        } catch (error) {
            console.error("Logout failed:", error);
            router.replace("/login");
        }
    }
    return (
        <>
            <AuthCheck />
            <div className="w-full h-screen">
                <div className="relative w-full h-full border-1 bg-white shadow-lg">
                    <div className="relative h-[15%] w-full bg-gradient-to-b from-gray-200 to-gray-500">
                        <Link
                            href='/employees/profile'
                            className="absolute top-4 right-4 h-12 w-12 rounded-full flex items-center justify-center bg-white 
                        shadow-lg border-2 border-purple-200 hover:bg-purple-50 transition-all duration-300 z-10"
                        >
                            <Image
                                src="/assets/no-photo-profile.jpg"
                                alt="Profile"
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                            />
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center px-5 py-2 text-black"
                            onClick={() => handleLogout()}
                        >
                            <Image
                                src="/icons/logout.png"
                                alt="Logout"
                                width={24}
                                height={24}
                                className="w-6 h-6 mr-3"
                            />
                        </Link>
                        <svg
                            className="absolute bottom-0 left-0 w-full h-auto"
                            viewBox="0 0 1440 320"
                            preserveAspectRatio="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                fill="white"
                                d="M0,192L80,186.7C160,181,320,171,480,176C640,181,800,203,960,208C1120,213,1280,203,1360,197.3L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
                            />
                        </svg>
                    </div>

                    <div className="p-6 space-y-5 h-[80%] overflow-y-auto pt-8">
                        <h1 className="text-2xl font-bold text-center">Catering Ny. Soewardono</h1>
                        <div className="min-h-[80px] shadow-lg  p-4 border-2 border-black space-y-3">
                            <h2 className="text-lg font-bold">Pernikahan A</h2>
                            <hr className="border-1 border-gray-300" />
                            <p><span className="font-medium">Jobdesk :</span>Supir</p>
                            <p><span className="font-medium">Lokasi :</span>Gedung A</p>
                            <p><span className="font-medium">Tanggal Prepare :</span>20-12-2020</p>
                            <p><span className="font-medium">Tanggal Service :</span>21-12-2020</p>
                            <Link href="/employees/info">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700 flex justify-end mt-3">INFO</button>
                            </Link>
                        </div>
                        <div className="min-h-[80px] shadow-lg  p-4 border-2 border-black space-y-3">
                            <h2 className="text-lg font-bold">Pernikahan B</h2>
                            <hr className="border-1 border-gray-300" />
                            <p><span className="font-medium">Jobdesk :</span>Supervisor</p>
                            <p><span className="font-medium">Lokasi :</span>Gedung A</p>
                            <p><span className="font-medium">Tanggal Prepare :</span>20-12-2020</p>
                            <p><span className="font-medium">Tanggal Service :</span>21-12-2020</p>
                            <Link href="/employees/info">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700 flex justify-end mt-3">INFO</button>
                            </Link>
                        </div>
                        <div className="min-h-[80px] shadow-lg  p-4 border-2 border-black space-y-3">
                            <h2 className="text-lg font-bold">Pernikahan C</h2>
                            <hr className="border-1 border-gray-300" />
                            <p><span className="font-medium">Jobdesk :</span>Supir</p>
                            <p><span className="font-medium">Lokasi :</span>Gedung Z</p>
                            <p><span className="font-medium">Tanggal Prepare :</span>20-12-2020</p>
                            <p><span className="font-medium">Tanggal Service :</span>21-12-2020</p>
                            <Link href="/employees/info">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700 flex justify-end mt-3">INFO</button>
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}