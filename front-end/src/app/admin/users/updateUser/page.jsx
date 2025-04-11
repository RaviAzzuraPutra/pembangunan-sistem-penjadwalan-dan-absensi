import Link from "next/link"

export default function UpdateUser() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Update Pengguna</h1>
            <hr />
            <form action="" className="space-y-5 p-7 rounded-lg shadow-md max-w-lg w-full">
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">Nama</label>
                    <input type="text" className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">No Telepon</label>
                    <input type="text" className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">Role</label>
                    <select name="" id="" className="w-full border px-3 py-2 rounded">
                        <option>-- Pilih Role</option>
                        <option value="">Karyawan</option>
                        <option value="">Supervisior</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">Jobdesk</label>
                    <select name="" id="" className="w-full border px-3 py-2 rounded">
                        <option>-- Pilih Jobdesk</option>
                        <option value="">Listrik</option>
                        <option value="">Skerting</option>
                        <option value="">Kramik</option>
                        <option value="">Supir</option>
                        <option value="">Jaga Stan</option>
                    </select>
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