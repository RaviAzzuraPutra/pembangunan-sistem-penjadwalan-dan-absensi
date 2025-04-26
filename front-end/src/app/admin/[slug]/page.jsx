export default function Dashboard() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <hr />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                <div className="bg-white p-7 rounded-3xl shadow-md border-2 border-gray-400 flex flex-col items-center">
                    <h2 className="text-md font-semibold mb-4 text-center text-blue-500">
                        JUMLAH ACARA
                    </h2>
                    <p className="text-4xl font-bold text-blue-400">123</p>
                </div>

                <div className="bg-white p-7 rounded-3xl shadow-md border-2 border-gray-400 flex flex-col items-center">
                    <h2 className="text-md font-semibold mb-4 text-center text-green-500">
                        JUMLAH ACARA TERDEKAT
                    </h2>
                    <p className="text-4xl font-bold text-green-400">123</p>
                </div>

                <div className="bg-white p-7 rounded-3xl shadow-md border-2 border-gray-400 flex flex-col items-center">
                    <h2 className="text-md font-semibold mb-4 text-center text-pink-500">
                        JUMLAH KARYAWAN
                    </h2>
                    <p className="text-4xl font-bold text-pink-400">123</p>
                </div>
            </div>

            <div className="bg-white p-7 rounded-3xl shadow-md border-2 border-gray-400">
                <h2 className="text-md font-semibold mb-7 text-left">
                    VISUALISASI
                </h2>

                <div className="space-y-9">
                    <div className="space-y-7">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-black">Jumlah Acara</span>
                                <span className="font-md">123</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full w-3/4"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-black">Jumlah Acara Terdekat</span>
                                <span className="font-md">123</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full w-3/4"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-black">Jumlah Karyawan</span>
                                <span className="font-md">123</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-pink-500 h-2 rounded-full w-3/4"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



        </div>
    )
}