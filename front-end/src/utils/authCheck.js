"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AuthCheck() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get("http://localhost:5001/auth/check-auth", {
                    withCredentials: true,
                });

                const { user } = response.data;
                if (user) {
                    if (user.role === "admin") {
                        router.replace(`/admin/${user.slug}`);
                    } else if (user.role === "karyawan") {
                        router.replace(`/employees/${user.slug}`);
                    }
                }
            } catch (error) {
                router.replace("/login");
            }
        }

        checkAuth();
    }, [])

    return null;
}