import Sidebar from "../../../components/Sidebar";
import "../../../app/globals.css";
import PushManager from "../../../components/pushManager";


export const metadata = {
    title: 'Sitem Penjadwalan dan Absensi',
    description: 'Dibuat menggunakan next.js',
    icons: {
        icon: "icons/LOGO-PERUSAHAAN.ico"
    }
}

export default function RootLayout({ children }) {
    return (
        <div className="flex h-screen">
            <PushManager />
            <Sidebar />
            <main className="flex-1 p-7 md:p-10 md:ml-64 overflow-y-auto">
                {children}
            </main>
        </div>


    )
}
