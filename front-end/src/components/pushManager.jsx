// src/components/PushManager.jsx
"use client";
import { useEffect } from "react";
import { registerSubscription } from "../utils/registerSubscription";
import { getUserSession } from "../utils/getSession";

export default function PushManager({ children }) {
    console.log("PushManager: useEffect dijalankan");
    console.log(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, "VAPID PUBLIC KEY");
    useEffect(() => {
        const doRegister = async () => {
            console.log("PushManager: mulai doRegister");
            const session = await getUserSession();
            onsole.log("PushManager: session →", session);

            // Karena getUserSession() mengembalikan objek user langsung, periksa session.id
            if (!session?.id) {
                console.log("PushManager: User belum login atau session tidak valid, skip subscribe");
                return;
            }

            console.log("PushManager: userId =", session.id, "→ memanggil registerSubscription()");
            console.log("SESSION YANG DIAMBIL:", session);
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
                    console.log("PushManager: gagal register SW:", err);
                });
        }
    }, []);

    return <>{children}</>;
}
