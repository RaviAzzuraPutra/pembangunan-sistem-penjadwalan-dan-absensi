// src/sw-custom.js

// Workbox akan di-import oleh webpack; nama ini dipakai oleh next-pwa saat build
import { precacheAndRoute } from "workbox-precaching";

// Precache semua aset yang didefinisikan oleh Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Tambahkan listener push di bawah ini:

self.addEventListener("push", event => {
    console.log("SW menerima push event:", event);
    const data = event.data?.json() || {};
    console.log("SW payload:", data);

    const title = data.title || "Pengingat Absensi";
    const options = {
        body: data.body || "",
        icon: data.icon || "/icons/LOGO-PERUSAHAAN.ico",
        data: data.url || "/",
        badge: "/icons/LOGO-PERUSAHAAN.ico"
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", event => {
    console.log("SW notificationclick, data:", event.notification.data);
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window" }).then(clientList => {
            for (const client of clientList) {
                if (client.url === event.notification.data && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data);
            }
        })
    );
});