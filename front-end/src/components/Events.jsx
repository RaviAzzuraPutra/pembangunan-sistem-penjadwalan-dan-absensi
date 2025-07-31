"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { useParams, useSearchParams } from "next/navigation";
import DataTable from 'react-data-table-component';
import axios from "axios";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Events() {
    const searchParams = useSearchParams();
    const params = useParams();
    const slug = params.slug;
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredEvent, setFilteredEvent] = useState([]);

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
        const fetchEvent = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/event`);
                const sorted = response.data.data.sort((a, b) => {
                    const dateA = new Date(a.date_prepare || a.date_service);
                    const dateB = new Date(b.date_prepare || b.date_service);
                    return dateA - dateB;
                });
                setEvents(sorted);
                console.log("Data Event:", response.data.data);
            } catch (error) {
                console.log("Terjadi Error Saat Mengambil Data Event:", error);
            }
        }
        fetchEvent();
    }, []);

    const deleteEvent = async (eventID) => {
        try {
            // Ambil info event untuk Swal (opsional)
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/event/${eventID}`);
            const event = data.data;

            const confirm = await Swal.fire({
                title: `Hapus ${event.name}?`,
                text: "Tindakan ini tidak bisa dibatalkan.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Ya",
                cancelButtonText: "Tidak",
            });

            if (!confirm.isConfirmed) return;

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!!!',
                text: "Berhasil Menghapus Acara!",
            });

            setEvents(prev => prev.filter(e => e._id !== eventID));

            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/event/delete/${eventID}`);

        } catch (error) {
            Swal.fire("Error", "Gagal menghapus event", "error");
            console.error("Error saat menghapus event:", error);
        }
    };

    useEffect(() => {
        const filtered = events.filter(event =>
            event.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEvent(filtered);
    }, [searchTerm, events]);


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
            selector: row => row.date_prepare ? format(new Date(row.date_prepare), 'dd MMM yyyy', { locale: id }) : "-",
            wrap: true,
        },
        {
            name: 'Service',
            selector: row => row.date_service ? format(new Date(row.date_service), 'dd MMM yyyy', { locale: id }) : "-",
            wrap: true,
        },
        {
            name: 'Supervisor',
            selector: row => row.supervisor?.id?.name || '-',
            wrap: true,
        },
        {
            name: 'Lokasi',
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
                        onClick={() => window.location.href = `/direktur/${slug}/events/${row._id}`}
                    >
                        Info
                    </button>
                    <button
                        className="bg-blue-500 text-white py-1 px-1 text-sm rounded hover:bg-blue-700"
                        onClick={() => window.location.href = `/direktur/${slug}/events/updateEvent/${row._id}`}
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
            <h1 className="text-3xl font-bold">Manajemen Acara</h1>
            <hr className="border-gray-300" />
            <div className="flex justify-between items-center">
                <Link href={`/direktur/${slug}/events/addEvent`} className="bg-stone-600 text-white px-4 py-2 rounded shadow hover:bg-stone-800">
                    + TAMBAH ACARA
                </Link>
                <input
                    type="text"
                    placeholder="Cari Acara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="mt-5 w-full md:w-1/2 border border-gray-300 rounded text-lg"
                />
            </div>
            {filteredEvent.length > 0 && (
                <DataTable
                    columns={columns}
                    data={filteredEvent}
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
            )}
        </div>
    )
}