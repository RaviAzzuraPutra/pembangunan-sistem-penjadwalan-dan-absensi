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
        <div className="overflow-hidden">
            <PushManager>
                <main>
                    {children}
                </main>
            </PushManager>
        </div>
    )
}
