"use client"

import { useEffect } from "react";
import Link from "next/link";

export default function AttendanceData() {

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Data Absensi</h1>
            <hr />
            <div className="overflow-x-auto relative shadow-md md:overflow-visible">
                <table id="search-table">
                    <thead>
                        <tr>
                            <th>
                                <span className="flex items-center">
                                    Nama Acara
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    Tanggal Prepare
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    Tanggal Service
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    Lokasi
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
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung A</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung A</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung B</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung B</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung C</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung C</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung D</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung D</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung E</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung E</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung F</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung F</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung G</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung G</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung H</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung H</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung I</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung I</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung J</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung J</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-100">
                            <td className="font-medium text-black whitespace-nowra">Pernikahan Gedung K</td>
                            <td>2023-10-26</td>
                            <td>2023-10-27</td>
                            <td>Gedung K</td>
                            <td className="flex gap-2">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700">INFO</button>
                                <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700">DELETE</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>





    )
}