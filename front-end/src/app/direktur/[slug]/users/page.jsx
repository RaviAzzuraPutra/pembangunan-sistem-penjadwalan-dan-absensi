"use client"
import { useEffect, useState } from "react"
import DataTable from 'react-data-table-component';
import Link from "next/link";
import Swal from "sweetalert2";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";

export default function Users() {
    const searchParams = useSearchParams();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const params = useParams();
    const slug = params.slug;

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
                setFilteredUsers(response.data.data);
            } catch (error) {
                console.error("Terjadi Error Saat Mengambil Data Pengguna.:", error);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const columns = [
        {
            name: 'Nama',
            selector: row => row.name,
            sortable: true,
        },
        {
            name: 'No Telepon',
            selector: row => row.phone,
        },
        {
            name: 'Supervisor',
            selector: row => row.is_supervisor_candidate ? 'Ya' : 'Tidak',
        },
        {
            name: 'Aksi',
            cell: row => (
                <div className="flex gap-2 justify-between">
                    <button
                        className="bg-green-500 text-white py-2 px-2 text-sm rounded hover:bg-green-700"
                        onClick={() => fetchUserByID(row._id)}
                    >
                        Info
                    </button>
                    <button
                        className="bg-blue-500 text-white py-2 px-2 text-sm rounded hover:bg-blue-700"
                        onClick={() => window.location.href = `/direktur/${slug}/users/updateUser/${row._id}`}
                    >
                        Edit
                    </button>
                    <button
                        className="bg-red-500 text-white py-2 px-2 text-sm rounded hover:bg-red-700"
                        onClick={() => deleteUser(row._id)}
                    >
                        Hapus
                    </button>
                </div>
            )
        }
    ];

    const fetchUserByID = async (userID) => {
        try {
            const response = await axios.get(`http://localhost:5001/user/${userID}`)
            const user = response.data.data;
            Swal.fire({
                title: `Detail Pengguna ${user.name}`,
                html: `
                    <div style="text-align: left; font-size: 16px"> 
                    <p><strong>ID:</strong> ${user._id}</p>
                    <p><strong>Nama:</strong> ${user.name}</p>
                    <p><strong>Slug:</strong> ${user.slug}</p>
                    <p><strong>Login:</strong> ${user.ID_Login}</p>
                    <p><strong>No Telp:</strong> ${user.phone}</p>
                    <p><strong>Supervisor:</strong> ${user.is_supervisor_candidate ? "ya" : "Tidak"}</p>
                    <p><strong>Jobdesk:</strong> ${user.jobdesk.map(jd => jd.name).join(", ")}</p>
                    <p><strong>Dibuat:</strong> ${new Date(user.createdAt).toLocaleString("id-ID", {
                    dateStyle: "full", timeStyle: "short", timeZone: "Asia/Jakarta"
                })}</p>
                    </div>`,
                icon: "info",
                confirmButtonText: "Tutup"
            });
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: "Tidak bisa menampilkan data pengguna",
                icon: "error",
                confirmButtonText: "Tutup"
            });
        }
    };

    const deleteUser = async (userID) => {
        const response = await axios.get(`http://localhost:5001/user/${userID}`)
        const user = response.data.data;
        const confirm = await Swal.fire({
            title: `Hapus ${user.name}?`,
            text: "Tindakan ini tidak bisa dibatalkan.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya",
            cancelButtonText: "Tidak",
        });

        if (confirm.isConfirmed) {
            try {
                const res = await axios.delete(`http://localhost:5001/user/delete/${userID}`);
                if (res.status === 200) {
                    Swal.fire("Berhasil!", `Pengguna ${user.name} dihapus.`, "success");
                    setUsers(users.filter(u => u._id !== userID));
                }
            } catch (error) {
                Swal.fire("Error", "Gagal menghapus pengguna", "error");
            }
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
            <div className="flex justify-between items-center">
                <Link href={`/direktur/${slug}/users/addUser`}>
                    <button className="bg-stone-600 text-white px-4 py-2 rounded shadow hover:bg-stone-800">+ TAMBAH PENGGUNA</button>
                </Link>
                <input
                    type="text"
                    placeholder="Cari nama pengguna..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="mt-5 w-full md:w-1/2 border border-gray-300 rounded text-lg"
                />
            </div>
            <DataTable
                columns={columns}
                data={filteredUsers}
                pagination
                paginationPerPage={5}
                highlightOnHover
                customStyles={{
                    rows: {
                        style: {
                            fontSize: '16px',
                        }
                    },
                    headCells: {
                        style: {
                            fontSize: '18px',
                            fontWeight: 'bold',
                            backgroundColor: '#f5f5f5',
                        }
                    }
                }}
            />
        </div>
    );
}
