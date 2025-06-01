// src/components/PushManager.jsx
"use client";
import { useEffect } from "react";
import { registerSubscription } from "../utils/registerSubscription";
import { getUserSession } from "../utils/getSession";

export default function PushManager({ children }) {
    useEffect(() => {
        const doRegister = async () => {
            const session = await getUserSession();

            // Karena getUserSession() mengembalikan objek user langsung, periksa session.id
            if (!session?.id) {
                console.log("PushManager: User belum login atau session tidak valid, skip subscribe");
                return;
            }

            console.log("PushManager: userId =", session.id, "→ memanggil registerSubscription()");
            await registerSubscription(session.id);
        };

        if ("serviceWorker" in navigator) {
            console.log("PushManager: mencoba register SW");
            navigator.serviceWorker
                .register("/sw.js")
                .then(() => {
                    console.log("PushManager: SW terdaftar /sw.js");
                    doRegister();
                })
                .catch((err) => {
                    console.error("PushManager: gagal register SW:", err);
                });
        }
    }, []);

    return <>{children}</>;
}
