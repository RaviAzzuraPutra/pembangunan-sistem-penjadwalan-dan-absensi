import "./globals.css";
import ServiceWorkersRegister from "../components/ServiceWorkersRegister"


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
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <ServiceWorkersRegister />
        {children}
      </body>
    </html>
  )
}
