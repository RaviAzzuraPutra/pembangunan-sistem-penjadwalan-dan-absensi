
import "../../../app/globals.css";
import PushManager from "../../../components/pushManager";
import UniversalLocationMonitor from "../../../components/UniversalLocationMonitor";
import PeriodicFaceSwal from "../../../components/PeriodicFaceSwal";

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
                <UniversalLocationMonitor />
                <PeriodicFaceSwal />
                <main>
                    {children}
                </main>
            </PushManager>
        </div>
    )
}
