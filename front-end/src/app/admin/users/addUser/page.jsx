import Link from "next/link"

export default function AddUser() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Tambah Pengguna</h1>
            <hr />
            <form action="" className="space-y-5 p-7 rounded-lg shadow-md max-w-lg w-full">
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">Nama</label>
                    <input type="text" className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">Password</label>
                    <input type="password" className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">No Telepon</label>
                    <input type="text" className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">Apakah Kandidat Supervisor?</label>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="listrik"
                                name="jobdesk"
                                value="Listrik"
                                className="h-4 w-4 rounded mr-2 border-2 border-gray-950"
                            />
                            <label htmlFor="listrik" className="ml-2 text-md text-black">
                                Ya
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="listrik"
                                name="jobdesk"
                                value="Listrik"
                                className="h-4 w-4 rounded mr-2 border-2 border-gray-950"
                            />
                            <label htmlFor="listrik" className="ml-2 text-md text-black">
                                Tidak
                            </label>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block mb-2 font-medium">Jobdesk</label>
                    <div className="w-full border px-3 py-2 rounded">
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="listrik"
                                    name="jobdesk"
                                    value="Listrik"
                                    className="h-4 w-4 rounded mr-2 border-2 border-gray-950"
                                />
                                <label htmlFor="listrik" className="ml-2 text-md text-black">
                                    Listrik
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="skerting"
                                    name="jobdesk"
                                    value="Skerting"
                                    className="h-4 w-4 rounded mr-2 border-2 border-gray-950"
                                />
                                <label htmlFor="skerting" className="ml-2 text-md text-black">
                                    Skerting
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="kramik"
                                    name="jobdesk"
                                    value="Kramik"
                                    className="h-4 w-4 rounded mr-2 border-2 border-gray-950"
                                />
                                <label htmlFor="kramik" className="ml-2 text-md text-black">
                                    Kramik
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="supir"
                                    name="jobdesk"
                                    value="Supir"
                                    className="h-4 w-4 rounded mr-2 border-2 border-gray-950"
                                />
                                <label htmlFor="supir" className="ml-2 text-md text-black">
                                    Supir
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="jaga-stan"
                                    name="jobdesk"
                                    value="Jaga Stan"
                                    className="h-4 w-4 rounded mr-2 border-2 border-gray-950"
                                />
                                <label htmlFor="jaga-stan" className="ml-2 text-md text-black">
                                    Jaga Stan
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">SUBMIT</button>
                    <Link href="/admin/users">
                        <button className="bg-slate-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-slate-700">KEMBALI</button>
                    </Link>
                </div>
            </form>
        </div>
    )
}