// src/components/menuItems.js
const getMenuItems = (slug) => [
    {
        title: "Dashboard",
        path: `/direktur/${slug}`,
        icon: "/icons/home.png",
    },
    {
        title: "Pengguna",
        path: `/direktur/${slug}/users`,
        icon: "/icons/user.png"
    },
    {
        title: "Acara",
        path: `/direktur/${slug}/events`,
        icon: "/icons/calendar.png"
    },
    {
        title: "Data Absensi",
        path: `/direktur/${slug}/attendance-data`,
        icon: "/icons/immigration.png"
    },
    {
        title: "WhatsApp",
        path: `/direktur/${slug}/whatsapp`,
        icon: "/icons/whatsapp.png"
    }
];

export default getMenuItems;