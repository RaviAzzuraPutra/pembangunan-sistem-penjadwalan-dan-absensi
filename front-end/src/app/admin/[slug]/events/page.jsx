"use client"

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { useParams, useSearchParams } from "next/navigation";
import DataTable from 'react-data-table-component';
import axios from "axios";

export default function Events() {
    const searchParams = useSearchParams();
    const params = useParams();
    const slug = params.slug;
    const [events, setEvents] = useState([]);

    useLayoutEffect(() => {
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
        const fetchEvent = async () => {
            try {
                const response = await axios.get("http://localhost:5001/event");
                setEvents(response.data.data);
            } catch (error) {
                console.error("Terjadi Error Saat Mengambil Data Event:", error);
            }
        }
        fetchEvent();
    },[]);

    const deleteEvent = async (eventID) => {
        const response = await axios.get(`http://localhost:5001/event/${eventID}`);
        const event = response.data.data;
         const confirm = await Swal.fire({
            title: `Hapus ${event.name}?`,
            text: "Tindakan ini tidak bisa dibatalkan.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya",
            cancelButtonText: "Tidak",
        });

        if (confirm.isConfirmed) {
            try {
                 const res = await axios.delete(`http://localhost:5001/event/delete/${eventID}`);
                 if (res.status === 200){
                        Swal.fire("Berhasil!", `Event ${event.name} dihapus.`, "success");
                        setEvents(events.filter(e => e._id !== eventID));
                }
            } catch (error) {
                 Swal.fire("Error", "Gagal menghapus event", "error");
            }
           
        }
    }


  const columns = [
        {
            name: 'Nama Acara',
            selector: row => row.name,
            wrap: true,
        },
        {
            name: 'Porsi',
            selector: row => row.porsi,
            wrap: true,
        },
        {
            name: 'Prepare',
             selector: row => new Date(row.date_prepare).toLocaleDateString('id-ID'),
            wrap: true,
        },
        {
            name: 'Service',
             selector: row => new Date(row.date_service).toLocaleDateString('id-ID'),
            wrap: true,
        },
        {
            name: 'Supervisor',
            selector: row => row.supervisor?.name || '-',
            wrap: true,
        },
        {
            name: 'Location',
            selector: row => row.location?.name || '-',
            wrap: true,
        },
        {
            name: 'Status',
            selector: row => row.status,
            wrap: true,
        },
        {
            name: 'Aksi',
            cell: row => (
                <div className="flex gap-2 justify-between">
                    <button
                        className="bg-green-500 text-white py-1 px-1 text-sm rounded hover:bg-green-700"
                        onClick={() => window.location.href = `/admin/${slug}/events/${row._id}`}
                    >
                        Info
                    </button>
                    <button
                        className="bg-blue-500 text-white py-1 px-1 text-sm rounded hover:bg-blue-700"
                        onClick={() => window.location.href = ``}
                    >
                        Edit
                    </button>
                    <button
                        className="bg-red-500 text-white py-1 px-1 text-sm rounded hover:bg-red-700"
                        onClick={() => deleteEvent(row._id)}
                    >
                        Hapus
                    </button>
                </div>
            ),
            wrap: true,
            style: {
                minWidth: '140px',
            }
        }
    ];

    return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manajemen Penjadwalan</h1>

        <div className="flex justify-between items-center">
            <Link href={`/admin/${slug}/events/addEvent`}>
                <button className="bg-stone-600 text-white px-4 py-2 rounded shadow hover:bg-stone-800">+ TAMBAH ACARA</button>
            </Link>
        </div>

        <DataTable
            columns={columns}
            data={events}
            pagination
            paginationPerPage={5}
            highlightOnHover
            customStyles={{
            table: {
                style: {
                width: '100%',
                }
            },
            headCells: {
                style: {
                fontSize: '17px',
                fontWeight: 'bold',
                backgroundColor: '#f5f5f5',
                padding: '4px 6px', 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                }
            },
            rows: {
                style: {
                fontSize: '15px',
                 minHeight: '36px'
                }
            },
            cells: {
                style: {
                 padding: '4px 6px', 
                wordBreak: 'break-word',
                }
            }
            }}
        />
    </div>
);
}