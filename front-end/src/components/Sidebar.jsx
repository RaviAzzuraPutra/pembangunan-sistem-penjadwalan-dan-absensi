"use client"
import Link from "next/link"
import { usePathname, useParams, useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import getMenuItems from "../components/menuItems"
import axios from "axios"

export default function Sidebar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const params = useParams();
    const slug = params.slug;
    const menuItems = getMenuItems(slug);
    const router = useRouter();

    const toggleSidebar = () => {
        setIsOpen(!isOpen)
    }

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

        if (isOpen) {
            setIsOpen(false)
        }

    }

    return (
        <>
            <button onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 md:hidden bg-white p-3 rounded-md shadow-lg"
            >
                {isOpen ? "X" : "☰"}
            </button>

            <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out
                ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 flex flex-col h-full`}>
                {/* HEADER */}
                <div className="flex items-center justify-center">
                    <Image
                        src="/assets/LOGO-PERUSAHAAN.jpg"
                        alt="Logo Perusahaan"
                        width={131}
                        height={120}
                        className="object-contain"
                    />
                </div>
                <hr className="border-1 border-black" />
                {/* NAVIGATION MENU */}
                <div>
                    <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto shadow-none">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.path

                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center px-5 py-2 rounded-lg transition-colors 
                                ${isActive ? "bg-gray-300 text-black" : "text-gray-600 hover:bg-gray-300 hover:text-black"}`}
                                    onClick={() => {
                                        if (isOpen) {
                                            setIsOpen(false)
                                        }
                                    }}>
                                    <Image
                                        src={item.icon}
                                        alt={item.title}
                                        width={24}
                                        height={24}
                                        className="w-6 h-6 mr-3"
                                    />
                                    <span>{item.title}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <hr className="border-1 border-black" />
                {/* LOGOUT */}
                <div className="px-4 py-6 mt-auto">
                    <Link
                        href="/login"
                        className="flex items-center px-5 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-300 hover:text-black"
                        onClick={() => handleLogout()}
                    >
                        <Image
                            src="/icons/logout.png"
                            alt="Logout"
                            width={24}
                            height={24}
                            className="w-6 h-6 mr-3"
                        />
                        <span>Logout</span>
                    </Link>
                </div>
            </div>
        </>
    )
}