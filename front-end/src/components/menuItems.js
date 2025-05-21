// src/components/menuItems.js
const getMenuItems = (slug) => [
    {
        title: "Dashboard",
        path: `/admin/${slug}`,
        icon: "/icons/home.png",
    },
    {
        title: "Pengguna",
        path: `/admin/${slug}/users`,
        icon: "/icons/user.png"
    },
    {
        title: "Acara",
        path: `/admin/${slug}/events`,
        icon: "/icons/calendar.png"
    },
    {
        title: "Data Absensi",
        path: `/admin/${slug}/attendance-data`,
        icon: "/icons/immigration.png"
    },
    {
        title: "WhatsApp",
        path: `/admin/${slug}/whatsapp`,
        icon: "/icons/whatsapp.png"
    }
];

export default getMenuItems;