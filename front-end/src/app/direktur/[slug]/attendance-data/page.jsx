"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DataTable from 'react-data-table-component';
import axios from "axios";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AttendanceData() {
    const params = useParams();
    const slug = params.slug;
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredEvent, setFilteredEvent] = useState([]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/event`);
                setEvents(response.data.data);
                console.log("Data Event:", response.data.data);
            } catch (error) {
                console.error("Terjadi Error Saat Mengambil Data Event:", error);
            }
        }
        fetchEvent();
    }, []);

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
            selector: row => format(new Date(row.date_prepare), 'dd MMM yyyy', { locale: id }),
            wrap: true,
        },
        {
            name: 'Service',
            selector: row => format(new Date(row.date_service), 'dd MMM yyyy', { locale: id }),
            wrap: true,
        },
        {
            name: 'Supervisor',
            selector: row => row.supervisor?.id?.name || '-',
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
                <div className="flex items-center justify-center w-full h-full">
                    <button
                        className="bg-green-500 text-white py-1 px-1 text-sm rounded hover:bg-green-700"
                        onClick={() => window.location.href = `/direktur/${slug}/attendance-data/${row._id}`}
                    >
                        Info
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
            <h1 className="text-3xl font-bold">Data Absensi Berdasarkan Event</h1>
            <hr className="border-gray-300" />
            <div className="flex w-full h-full justify-end">
                <input
                    type="text"
                    placeholder="Cari Acara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="mt-5 w-full md:w-1/2 border border-gray-300 rounded text-lg"
                />
            </div>
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
        </div>
    );
}