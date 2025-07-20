"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DataTable from 'react-data-table-component';
import axios from "axios";
import Swal from "sweetalert2";
import Link from "next/link";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'


const costumIcon = L.icon({
    iconUrl: '/assets/marker.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -32],
});

export default function AttendanceDetailData() {
    const { slug, id } = useParams();
    const [absensi, setAbsensi] = useState([]);
    const [eventName, setEventName] = useState([]);
    const [polygon, setPolygon] = useState([]);
    const [tahap, setTahap] = useState(['prepare', 'service']);

    useEffect(() => {
        const fetchAbsensi = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/${id}`);
                const { event, absensi, karyawan, monitoring } = response.data;

                setEventName(event.name || "-");
                setPolygon(
                    (event.polygon || [])
                );

                setTahap(event.tahap || ['prepare', 'service']);

                // Buat map absensi per userId
                const absensiMap = {};

                absensi.forEach(item => {
                    const userId = item.user_id?._id;
                    if (!userId) return;

                    if (!absensiMap[userId]) {
                        absensiMap[userId] = {
                            prepare: "-",
                            service: "-",
                            location: null,
                            prepareTime: null,
                            serviceTime: null,
                        };
                    }

                    if (item.tahap === 'prepare') {
                        absensiMap[userId].prepare = item.status === 'gagal' ? "❌" : "✅";
                        absensiMap[userId].prepareTime = item.timestamp;
                    } else if (item.tahap === 'service') {
                        absensiMap[userId].service = item.status === 'gagal' ? "❌" : "✅";
                        absensiMap[userId].serviceTime = item.timestamp;
                    }

                    if (!absensiMap[userId].location && item.location) {
                        absensiMap[userId].location = item.location;
                    }
                });

                // Gabungkan peserta dengan data absensi
                const combinedData = karyawan.map(user => {
                    const key = user._id.toString();
                    const monitoringRecord = monitoring[key];

                    let keterangan = "Karyawan ini tidak keluar area kerja selama acara berlangsung";
                    if (monitoringRecord) {
                        const waktu = new Date(monitoringRecord.timestamp).toLocaleString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        });
                        keterangan = `Karyawan ini keluar area kerja pada pukul ${waktu}`;
                    }

                    return {
                        _id: user._id,
                        name: user.name || "-",
                        jobdesk: user.jobdeskLabel || "",
                        prepare: absensiMap[key]?.prepare || "-",
                        service: absensiMap[key]?.service || "-",
                        location: absensiMap[key]?.location || null,
                        prepareTime: absensiMap[key]?.prepareTime || null,
                        serviceTime: absensiMap[key]?.serviceTime || null,
                        keterangan
                    };
                });

                setAbsensi(combinedData);

            } catch (error) {
                console.log("Error fetching absensi data:", error);
            }
        }

        fetchAbsensi();
    }, [id]);

    const showLocationMap = (location, timestamp, fase, name) => {
        if (!location) {
            Swal.fire({
                icon: "error",
                title: "Lokasi Tidak Tersedia",
                text: "Lokasi untuk karyawan ini tidak tersedia.",
            });
            return;
        }

        const div = document.createElement('div');
        div.id = 'map-swal-container';
        div.style.width = '100%';
        div.style.height = '400px';

        const waktuFormatted = timestamp
            ? new Date(timestamp).toLocaleString('id-ID')
            : '-';

        Swal.fire({
            title: `Absensi - ${fase === 'prepare' ? 'Prepare' : 'Service'} untuk ${name} - Waktu: ${waktuFormatted}`,
            html: div,
            width: 600,
            didOpen: () => {
                const map = L.map(div).setView([location.latitude, location.longitude], 16);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(map);

                L.marker([location.latitude, location.longitude], { icon: costumIcon }).addTo(map);

                if (polygon.length > 0) {
                    L.polygon(polygon, { color: 'blue' }).addTo(map);
                }
            },
            confirmButtonText: "Tutup"
        });
    }

    const columns = [
        {
            name: 'Nama',
            selector: row => `${row.name} ${row.jobdesk ? `(${row.jobdesk})` : ''}`,
            sortable: true,
        },
        {
            name: 'Prepare',
            cell: row => (
                row.prepare === "✅" ? (
                    <span
                        className="cursor-pointer text-green-600 font-bold"
                        onClick={() => showLocationMap(row.location, row.prepareTime, 'prepare', row.name)}
                    >
                        ✅
                    </span>
                ) : row.prepare
            ),
        },
        {
            name: 'Service',
            cell: row => (
                row.service === "✅" ? (
                    <span
                        className="cursor-pointer text-green-600 font-bold"
                        onClick={() => showLocationMap(row.location, row.serviceTime, 'service', row.name)}
                    >
                        ✅
                    </span>
                ) : row.service
            ),
        },
        {
            name: "Keterangan",
            cell: row => row.keterangan,
            grow: 2,
        }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Data Absensi {eventName}</h1>
            <hr className="border-gray-300" />
            <DataTable
                columns={columns}
                data={absensi}
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
            <div className="flex justify-end gap-3">
                <Link href={`/direktur/${slug}/attendance-data`} className="bg-slate-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-slate-700">
                    KEMBALI
                </Link>
            </div>
        </div>
    );
}