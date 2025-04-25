"use client"
import { useEffect, useState } from "react"
import { DataTable } from 'simple-datatables';
import 'simple-datatables/dist/style.css';
import Link from "next/link";
import Swal from "sweetalert2";
import { useSearchParams } from "next/navigation";
import axios from "axios";

export default function Users() {
    const searchParams = useSearchParams();
    const [users, setUsers] = useState([]);


    useEffect(() => {
        const success = searchParams.get('success');
        const message = searchParams.get('message');

        if (success && message) {
            Swal.fire({
                icon: success === 'true' ? 'success' : 'error',
                title: success === 'true' ? 'Berhasil!!!' : 'Gagal!!!',
                text: decodeURIComponent(message),
            });

            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("http://localhost:5001/user");
                setUsers(response.data.data);
            } catch (error) {
                console.error("Terjadi Error Saat Mengambil Data Pengguna.:", error);
            }
        };
        fetchUsers();
    }, []);

    const fetchUserByID = async (userID) => {
        try {
            console.log("Fetching user with ID:", userID);
            const response = await axios.get(`http://localhost:5001/user/${userID}`)
            console.log("User data:", response.data.data);
            const user = response.data.data;
            if (response.status === 200) {
                Swal.fire({
                    title: `Detail Pengguna ${user.name}`,
                    html: `
                        <div style="text-align: Left"> 
                        <p>ID : ${user._id}</p>
                        <p>Nama : ${user.name}</p>
                        <p>Slug : ${user.slug}</p>
                        <p>Login : ${user.ID_Login}</p>
                        <p>No Telephone : ${user.phone}</p>
                        <p>Role : ${user.role}</p>
                        <p>Supervisor : ${user.is_supervisor_candidate ? "ya" : "Tidak"}</p>
                        <p>Jobdesk : ${user.jobdesk.map(jd => jd.name).join(", ")}</p>
                        <p>Data Wajah : ${user.face_data}</p>
                        <p>Tanggal Dibuat : ${new Date(user.createdAt).toLocaleString("id-ID", {
                        dateStyle: "full",
                        timeStyle: "short",
                        timeZone: "Asia/Jakarta"
                    })}</p>
                        </div>                    
                    `,
                    icon: "info",
                    confirmButtonText: "Tutup"
                })
            } else if (response.status === 404) {
                Swal.fire({
                    title: "Error!!!",
                    text: "Data Pengguna Tidak Ditemukan 404",
                    icon: "error",
                    confirmButtonText: "Tutup"
                })
            } else if (response.status === 500) {
                Swal.fire({
                    title: "Error!!!",
                    text: "Terjadi Kesalahan Server",
                    icon: "error",
                    confirmButtonText: "Tutup"
                })
            }
        } catch (error) {
            Swal.fire({
                title: "Error!!!",
                text: "Data Pengguna Tidak Ditemukan",
                icon: "error",
                confirmButtonText: "Tutup"
            })
        }
    }

    const deleteUser = async (userID) => {
        const response = await axios.get(`http://localhost:5001/user/${userID}`)
        const user = response.data.data;
        const confirm = await Swal.fire({
            title: `Yakin ingin menghapus pengguna ${user.name}?`,
            text: "Tindakan tidak dapat dibatalkan!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya",
            cancelButtonText: "Tidak",
            confirmButtonColor: "#FF0000",
            cancelButtonColor: "#40E0D0",
        });

        if (confirm.isConfirmed) {
            try {
                const response = await axios.delete(`http://localhost:5001/user/delete/${userID}`);
                if (response.status === 200) {
                    Swal.fire({
                        title: "Berhasil!!!",
                        text: `Pengguna ${user.name} Berhasil Dihapus`,
                        icon: "success",
                        confirmButtonText: "Tutup"
                    })
                    setUsers(users.filter(user => user._id !== userID));
                } else if (response.status === 404) {
                    Swal.fire({
                        title: "Error!!!",
                        text: "Data Pengguna Tidak Ditemukan 404",
                        icon: "error",
                        confirmButtonText: "Tutup"
                    })
                } else if (response.status === 500) {
                    Swal.fire({
                        title: "Error!!!",
                        text: "Terjadi Kesalahan Server",
                        icon: "error",
                        confirmButtonText: "Tutup"
                    })
                }
            } catch (error) {
                Swal.fire({
                    title: "Error!!!",
                    text: "Terjadi Kesalahan Saat Menghapus Pengguna",
                    icon: "error",
                    confirmButtonText: "Tutup"
                })
            }
        }
    }

    useEffect(() => {
        if (typeof window !== 'undefined' && users.length > 0) {
            const table = document.getElementById("search-table");
            if (table && typeof DataTable !== 'undefined') {
                new DataTable(table, {
                    searchable: true,
                    sortable: false,
                    perPage: 5,
                });
            }
        }
    }, [users]);

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
                                    No Telepon
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    Supervisor
                                </span>
                            </th>
                            <th>
                                <span className="flex items-center">
                                    Jobdesk
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
                        {users.map((user, id) => (
                            <tr className="hover:bg-slate-100" key={id}>
                                <td className="font-medium text-black whitespace-nowra">{user.name}</td>
                                <td>{user.phone}</td>
                                <td>{user.is_supervisor_candidate ? "ya" : "Tidak"}</td>
                                <td>{user.jobdesk.map(jd => jd.name).join(", ")}</td>
                                <td className="flex gap-2">
                                    <button className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-green-700" onClick={() => fetchUserByID(user._id)}>INFO</button>
                                    <Link href={`/admin/users/updateUser/${user._id}`}>
                                        <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">EDIT</button>
                                    </Link>
                                    <button className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-red-700" onClick={() => deleteUser(user._id)}>DELETE</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>





    )
}