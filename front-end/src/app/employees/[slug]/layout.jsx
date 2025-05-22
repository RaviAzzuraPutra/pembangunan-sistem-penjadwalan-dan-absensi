import "../../../app/globals.css";


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
            <main>
                {children}
            </main>
        </div>
    )
}
