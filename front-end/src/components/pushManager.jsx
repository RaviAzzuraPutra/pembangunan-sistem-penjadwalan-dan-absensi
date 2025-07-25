"use client";

import { useEffect } from "react";
import { getUserSession } from "../utils/getSession";
import axios from "axios";

// Utility VAPID decoder
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushManager({ children }) {
    useEffect(() => {
        const initPush = async () => {
            try {
                // 1. Pastikan Service Worker didukung
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    console.warn("Browser tidak mendukung Service Worker atau Push API");
                    return;
                }

                // 2. Tunggu hingga Service Worker siap
                const registration = await navigator.serviceWorker.ready;
                console.log("Service Worker aktif:", registration.active?.scriptURL);

                // 3. Minta izin notifikasi
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.log("Izin notifikasi ditolak");
                    return;
                }

                // 4. Dapatkan session user
                const session = await getUserSession();
                if (!session?.id) {
                    console.log("User belum login");
                    return;
                }

                // 5. Cek/Create subscription
                let subscription = await registration.pushManager.getSubscription();
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(
                            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                        )
                    });
                    console.log("Subscription baru dibuat:", subscription);
                } else {
                    console.log("Subscription sudah ada:", subscription);
                }

                // 6. Kirim ke backend
                await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/push-subscription`,
                    {
                        userId: session.id,
                        subscription: subscription.toJSON()
                    },
                    { withCredentials: true }
                );

                console.log("Subscription berhasil dikirim");
            } catch (error) {
                console.error("Error dalam PushManager:", error);
            }
        };

        // Jalankan hanya di client-side
        if (typeof window !== 'undefined') {
            // Tambahkan delay untuk memastikan SW terdaftar
            setTimeout(initPush, 2000);
        }
    }, []);

    return <>{children}</>;
}
