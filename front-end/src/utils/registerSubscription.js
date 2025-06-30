import axios from "axios";

export const registerSubscription = async (userId) => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
            const reg = await navigator.serviceWorker.ready;

            const permission = await Notification.requestPermission();
            console.log("Permission:", permission);
            if (permission !== "granted") return;


            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
            });

            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/push-subscription`, {
                userId,
                subscription
            });

            console.log("Sending subscription:", { userId, subscription });

        } catch (error) {
            console.error("Error during push subscription:", error);
        }
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}