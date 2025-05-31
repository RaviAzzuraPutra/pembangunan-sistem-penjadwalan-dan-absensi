"use client"

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import DataTable from 'react-data-table-component';
import axios from "axios";

export default function AttendanceData() {
    const params = useParams();
    const slug = params.slug;
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await axios.get("http://localhost:5001/event");
                setEvents(response.data.data);
                console.log("Data Event:", response.data.data);
            } catch (error) {
                console.error("Terjadi Error Saat Mengambil Data Event:", error);
            }
        }
        fetchEvent();
    }, []);


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
                <div className="flex gap-2 justify-between">
                    <button
                        className="bg-green-500 text-white py-1 px-1 text-sm rounded hover:bg-green-700"
                        onClick={() => window.location.href = `/direktur/${slug}/events/${row._id}`}
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