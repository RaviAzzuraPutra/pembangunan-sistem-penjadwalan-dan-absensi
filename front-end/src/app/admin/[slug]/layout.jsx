import Sidebar from "../../../components/Sidebar";
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
        <html lang="en">
            <head>
                <meta httpEquiv="Cache-Control" content="no-store" />
            </head>
            <body>
                <div className="flex h-screen">
                    <Sidebar />
                    <main className="flex-1 p-7 md:p-10 md:ml-64 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </body>
        </html>


    )
}
