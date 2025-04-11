import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">
            <div className="w-full max-w-md flex flex-col">
                {/*HEADER*/}
                <div className="bg-gray-500 p-5 flex items-center justify-center">
                    <h1 className="text-white text-2xl font-bold">Sistem Penjadwalan dan Absensi</h1>
                </div>

                {/*content*/}
                <div className="bg-white p-6 shadow-lg">
                    <div className="italic text-center text-gray-950 text-sm mb-7 md:text-base">
                        Masukan ID Login dan Password Anda
                    </div>

                    {/*login form*/}
                    <form action="" className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ID Login"
                                // value=""
                                // onChange=""
                                className="w-full p-4 border border-slate-400 rounded-lg pl-3 pr-10 focus:outline-none focus:border-black"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="Password"
                                // value=""
                                // onChange=""
                                className="w-full p-4 border border-slate-400 rounded-lg pl-3 pr-10 focus:outline-none focus:border-black"
                            />
                        </div>
                    </form>

                    {/*footer*/}
                    <div className="flex items-center justify-between pt-2 mb-4 mt-4">
                        <div className="text-sm m">
                            <div className="text-gray-700">LUPA PASSWORD?</div>
                            <Link href="#" className="text-gray-700 hover:underline hover:text-gray-950">
                                <p>Silahkan Reset Password</p>
                            </Link>
                        </div>
                        <button type="submit" className="bg-gray-500 text-white px-6 py-2 rounded flex justify-end hover:bg-gray-600">
                            LOGIN
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}