"use client";

import { useEffect } from "react";
import { getUserSession } from "../utils/getSession";
import axios from "axios";

// Utility
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushManager({ children }) {
    useEffect(() => {
        const doRegister = async () => {
            const session = await getUserSession();
            if (!session?.id) {
                console.log("❌ User belum login atau session tidak valid.");
                return;
            }

            console.log("✅ Mulai proses subscription untuk user:", session.id);

            // Tunggu service worker siap
            console.log("⏳ Menunggu service worker siap...");
            const reg = await navigator.serviceWorker.ready;
            console.log("✅ Service worker siap:", reg);

            // Minta izin notifikasi
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                console.log("❌ Izin notifikasi ditolak:", permission);
                return;
            }

            // Periksa subscription
            let subscription = await reg.pushManager.getSubscription();
            if (!subscription) {
                const rawSub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
                });
                subscription = rawSub.toJSON();
                console.log("🆕 Subscription baru dibuat:", subscription);
            } else {
                subscription = subscription.toJSON();
                console.log("♻️ Subscription sudah ada:", subscription);
            }

            // Kirim ke backend
            try {
                await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/push-subscription`, {
                    userId: session.id,
                    subscription,
                }, {
                    withCredentials: true
                });

                console.log("✅ Subscription berhasil dikirim ke backend");
            } catch (err) {
                console.error("❌ Gagal kirim ke backend:", err);
            }
        };

        if ("serviceWorker" in navigator && "PushManager" in window) {
            navigator.serviceWorker.register("/sw.js").then(() => {
                console.log("✅ Service Worker berhasil didaftarkan");
                doRegister();
            }).catch((err) => {
                console.error("❌ Gagal mendaftarkan service worker:", err);
            });
        } else {
            console.warn("❌ Browser tidak support ServiceWorker atau PushManager");
        }
    }, []);

    return <>{children}</>;
}
