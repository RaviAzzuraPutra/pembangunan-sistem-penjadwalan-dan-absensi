import axios from "axios";

export default async function registerSubscription(userId) {
    if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
            const reg = await navigator.serviceWorker.ready;

            const permission = await Notification.requestPermission();

            console.log("Permission:", permission);

            if (permission !== "granted") return;

            console.log("Push Subscription dibatalkan karena permission:", permission);

            let subscription = await reg.pushManager.getSubscription();

            console.log("Hasil getSubscription:", subscription);

            if (!subscription) {
                subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
                });

                console.log("Subscription baru berhasil dibuat:", subscription);

            } else {
                console.log("Sudah ada subscription:", subscription);
            }

            console.log("Mengirim subscription ke backend…");

            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/push-subscription`, {
                userId,
                subscription
            }, {
                withCredentials: true
            });

            console.log("Sending subscription:", { userId, subscription });

        } catch (error) {
            console.log("Error during push subscription:", error);
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