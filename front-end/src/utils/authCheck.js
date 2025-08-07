"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";

export default function AuthCheck() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/check-auth`, {
                    withCredentials: true,
                });

                const { user } = response.data;
                if (user) {
                    if (user.role === "direktur" && !pathname.includes("/direktur")) {
                        router.replace(`/direktur/${user.slug}`);
                    } else if (user.role === "karyawan" && !pathname.includes("/employees")) {
                        router.replace(`/employees/${user.slug}`);
                    }
                }
            } catch (error) {
                // Jangan langsung redirect, log saja dulu
                console.error("Check Auth Failed:", error.response?.data || error.message);
            }
        };

        checkAuth();
    }, [pathname]);

    return null;
}
