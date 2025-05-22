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
                const response = await axios.get("http://localhost:5001/auth/check-auth", {
                    withCredentials: true,
                });

                const { user } = response.data;
                if (user) {
                    if (user.role === "admin" && !pathname.includes("/admin")) {
                        router.replace(`/admin/${user.slug}`);
                    } else if (user.role === "karyawan" && !pathname.includes("/employees")) {
                        router.replace(`/employees/${user.slug}`);
                    }
                }
            } catch (error) {
                router.replace("/login");
            }
        };

        checkAuth();
    }, [pathname]);

    return null;
}
