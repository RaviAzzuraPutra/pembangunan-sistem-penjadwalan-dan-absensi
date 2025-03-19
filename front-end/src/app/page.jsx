import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full p-5 bg-gradient-to-b from-gray-100 to-gray-300">
      <div className="border border-gray-300 bg-white rounded-xl py-8 px-6 sm:px-8 md:px-12 lg:px-16 flex flex-col items-center w-full max-w-lg md:max-w-xl lg:max-w-2xl shadow-lg">
        <div className="rounded-full border-4 border-gray-300 bg-white overflow-hidden mb-6 w-32 h-32 flex items-center justify-center shadow-md">
          <Image
            src="/assets/LOGO-PERUSAHAAN.jpg"
            alt="Logo Perusahaan"
            width={128}
            height={128}
            className="object-cover"
          />
        </div>

        <div className="text-center w-full">
          <h2 className="font-bold text-2xl md:text-3xl mt-5 mb-3 text-gray-700">
            Sistem Penjadwalan dan Absensi
          </h2>
          <p className="italic text-gray-500 text-sm md:text-base">
            CATERING NY.SOEWARDONO
          </p>
          <Link href="/login">
            <button className="rounded-lg bg-gray-500 text-white px-5 py-2 mt-4 md:mt-5 hover:bg-gray-600 transition shadow-md">
              Login
            </button>
          </Link>
          <p className="text-gray-500 text-xs md:text-sm mt-6 md:mt-8">
            © 2025 Catering Ny.Soewardono. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
