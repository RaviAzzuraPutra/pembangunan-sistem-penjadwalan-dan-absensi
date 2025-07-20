"use client";

import { useEffect } from "react";
import registerSubscription from "../utils/registerSubscription";
import { getUserSession } from "../utils/getSession";

export default function PushManager({ children }) {
    useEffect(() => {
        const doRegister = async () => {
            const session = await getUserSession();
            if (!session?.id) {
                console.log("User belum login atau session tidak valid.");
                return;
            }

            console.log("Memulai push subscription untuk user:", session.id);
            await registerSubscription(session.id);
        };

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then(() => {
                    console.log("Service worker berhasil didaftarkan");
                    doRegister();
                })
                .catch((err) => {
                    console.error("Gagal mendaftarkan service worker:", err);
                });
        }
    }, []);

    return <>{children}</>;
}
