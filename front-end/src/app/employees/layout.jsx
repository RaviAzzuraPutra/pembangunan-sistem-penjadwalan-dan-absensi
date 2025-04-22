import "../../app/globals.css";


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
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1. user-scalable=0" />
            </head>
            <body className="overflow-hidden">
                {children}
            </body>
        </html>
    )
}
