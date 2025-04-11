"use client"
import { useEffect } from "react"
import { DataTable } from 'simple-datatables';
import 'simple-datatables/dist/style.css';
import Link from "next/link";

export default function Users() {
    useEffect(() => {

        if (typeof window !== 'undefined') {
            const table = document.getElementById("search-table");
            if (table && typeof DataTable !== 'undefined') {
                new DataTable(table, {
                    searchable: true,
                    sortable: false,
                    perPage: 5,
                });
            }
        }

    }, [])

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Management Pengguna</h1>
            <hr />
            <div className="overflow-x-auto relative shadow-md md:overflow-visible">
                <Link href={"/admin/users/addUser"}>
                    <button className="bg-stone-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-stone-700 mb-3 mt-3">+ TAMBAH PENGGUNA</button>
                </Link>
                <table id="search-table">
                    <thead>
                        <tr>
                            <th>
                                <span className="flex items-center">
                                    Nama
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    ID_Login
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    No Telepon
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    Role
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    Jobdesk
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    Status
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    Aksi
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Ayda Fang</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Supervisior</td>
                            <td>Listrik</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Butler Winter</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Karyawan</td>
                            <td>Kramik</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Leeta Le Torneau</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Karyawan</td>
                            <td>Supir</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pamela Craft</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Supervisior</td>
                            <td>Skerting</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Lore Woods</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Karyawan</td>
                            <td>Jaga Stan</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Virion Christanti</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Karyawan</td>
                            <td>Jaga Stan</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Lillith Graeme</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Karyawan</td>
                            <td>Listrik</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Chadli Lobo</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Karyawan</td>
                            <td>Listrik</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Emmit Nox</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Supervisior</td>
                            <td>Skerting</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Norrix Delacroix</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Karyawan</td>
                            <td>Supir</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Zayne Geulimja</td>
                            <td>908976</td>
                            <td>081234567892</td>
                            <td>Supervisior</td>
                            <td>Kramik</td>
                            <td>Aktif</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <Link href={"/admin/users/updateUser"}>
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                </Link>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>





    )
}