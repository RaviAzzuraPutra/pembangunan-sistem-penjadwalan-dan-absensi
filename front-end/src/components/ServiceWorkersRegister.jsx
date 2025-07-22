"use client";

import { useEffect } from "react";

export default function ServiceWorkersRegister() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            console.log("✅ Browser mendukung Service Worker, melanjutkan pendaftaran...");
            const registerServiceWorker = async () => {
                try {
                    const registration = await navigator.serviceWorker.register(
                        "/sw.js",
                        { scope: "/" }
                    );
                    console.log("✅ Service Worker terdaftar:", registration);
                } catch (error) {
                    console.error("❌ Gagal mendaftarkan Service Worker:", error);
                }
            };
            registerServiceWorker();
        } else {
            console.warn("❌ Browser tidak mendukung Service Worker");
        }
    }, []);

    return null;
}
