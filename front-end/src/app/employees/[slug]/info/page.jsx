import Link from "next/link"
import Image from "next/image"

export default function InfoEventPageEmployees() {
    return (
        <div className="min-h-screen p-5 space-y-7">
            <Link href="/employees">
                <div className="flex justify-start mb-5">
                    <Image
                        src="/icons/previous.png"
                        alt="Back Icon"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                    />
                </div>
            </Link>
            <h1 className="text-2xl font-bold text-center">Pernikanan</h1>
            <hr className="border-1 border-gray-300" />
            <div className="shadow-lg p-4 space-y-4 border-2 border-black overflow-auto max-h-[80vh] sm:max-h-[90vh]">

                <div className="space-y-3 text-sm sm:text-base">
                    <p><span className="font-semibold">Jobdesk:</span> Supir</p>
                    <p><span className="font-semibold">Tanggal Prepare:</span> 20-12-2020</p>
                    <p><span className="font-semibold">Jam Prepare:</span> 10:00</p>
                    <p><span className="font-semibold">Tanggal Service:</span> 21-12-2020</p>
                    <p><span className="font-semibold">Jam Service:</span> 17:00</p>
                    <p><span className="font-semibold">Lokasi:</span> Gedung A</p>
                    <p><span className="font-semibold">Status:</span> Terjadwal</p>
                </div>

                <div>
                    <h2 className="font-semibold mb-3">Daftar Karyawan Yang Mengikuti Acara</h2>
                    <div className="max-h-32 overflow-y-auto grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {['Andi', 'Budi', 'Citra', 'Dewi', 'Isagi', 'Fajar', 'Gina'].map((name, index) => (
                            <div key={index} className="p-2 rounded-lg shadow text-center text-sm bg-white">
                                {name}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
                    <Link href="/employees/attendance/prepare" className="w-full">
                        <button className="w-full bg-violet-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-violet-700 mt-3">ABSEN PREPARE</button>
                    </Link>
                    <Link href="/employees/attendance/service" className="w-full">
                        <button className="w-full bg-pink-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-pink-700 mt-3">ABSEN SERVICE</button>
                    </Link>
                    <button className="w-full bg-yellow-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-yellow-700 mt-3">MONITORING</button>
                </div>

            </div>
        </div>
    )
}