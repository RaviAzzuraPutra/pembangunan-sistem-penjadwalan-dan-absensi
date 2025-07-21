"use client";

import axios from "axios";
import { getUserSession } from "./getSession";

export default async function registerSubscription(userId) {
    console.log("✅ registerSubscription.js dimuat");
    const session = await getUserSession();
    console.log("SESSION YANG DIAMBIL:", session);
    console.log(">> [registerSubscription] Dijalankan untuk userId:", userId);
    console.log(">> [registerSubscription] Session:", session);
    if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
            const reg = await navigator.serviceWorker.ready;

            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                console.log("Izin notifikasi ditolak:", permission);
                return;
            }

            let subscription = await reg.pushManager.getSubscription();

            if (!subscription) {
                const rawSub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
                });
                subscription = rawSub.toJSON(); // ⬅️ INI PENTING
                console.log("Subscription baru dibuat:", subscription);
            } else {
                subscription = subscription.toJSON(); // pastikan plain object
                console.log("Subscription sudah ada:", subscription);
            }

            // Kirim ke backend
            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/push-subscription`, {
                userId,
                subscription
            }, {
                withCredentials: true
            });

            console.log("Subscription berhasil dikirim ke backend");

        } catch (error) {
            console.error("Gagal melakukan subscription:", error);
            if (error.response) {
                console.error("→ response data:", error.response.data);
                console.error("→ status:", error.response.status);
            }
        }
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}
