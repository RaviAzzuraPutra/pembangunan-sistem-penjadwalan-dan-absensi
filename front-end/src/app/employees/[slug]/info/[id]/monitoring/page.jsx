"use client";

import axios from "axios"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import Swal from "sweetalert2";
import DataTable from 'react-data-table-component';
if (typeof window === 'undefined') {
    global.L = {};
} else {
    require('leaflet');
}
import 'leaflet/dist/leaflet.css'

const costumIcon = L.icon({
    iconUrl: '/assets/marker.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -32],
});


export default function Monitoring() {
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
                            prepareLocation: null,
                            serviceLocation: null,
                            prepareTime: null,
                            serviceTime: null,
                        };
                    }

                    if (item.tahap === 'prepare') {
                        absensiMap[userId].prepare = item.status === 'gagal' ? "❌" : "✅";
                        absensiMap[userId].prepareTime = item.timestamp;
                        absensiMap[userId].prepareLocation = item.location;
                    } else if (item.tahap === 'service') {
                        absensiMap[userId].service = item.status === 'gagal' ? "❌" : "✅";
                        absensiMap[userId].serviceTime = item.timestamp;
                        absensiMap[userId].serviceLocation = item.location;
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

                const supervisorId = event.supervisorId;
                const filteredData = combinedData.filter(user => user._id !== supervisorId);

                setAbsensi(filteredData);

            } catch (error) {
                console.log("Error fetching absensi data:", error);
            }
        }

        fetchAbsensi();
    }, [id]);


    const handleRemind = async (userId) => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/remind/${userId}/event/${id}`);
            console.log(`pengingat telah dikirim untuk userId: ${userId}`);
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!!!',
                text: 'Pengingat telah dikirim!',
            });
        } catch (error) {
            console.log("Error sending reminder:", error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: 'Terjadi kesalahan saat mengirim pengingat.',
            });
        }
    }

    const showLocationMap = (userId, location, timestamp) => {
        if (!location) {
            Swal.fire({
                icon: "error",
                title: "Lokasi Tidak Tersedia",
                text: "Lokasi untuk karyawan ini tidak tersedia.",
            });
            return
        }

        const div = document.createElement('div');
        div.id = 'map-swal-container';
        div.style.width = '100%';
        div.style.height = '400px';


        const waktuFormatted = timestamp
            ? new Date(timestamp).toLocaleString('id-ID')
            : '-';

        // Cari nama berdasarkan userId
        const user = absensi.find(row => row._id.toString() === userId.toString());
        const userName = user ? user.name : 'Tidak Diketahui';

        Swal.fire({
            title: `Absensi untuk ${userName} - Waktu: ${waktuFormatted}`,
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
            selector: row => row.name,
            sortable: true,
            wrap: true,
        },
        {
            name: 'Prepare',
            cell: row => (
                row.prepare === "✅" ? (
                    <span
                        className="cursor-pointer text-green-600 font-bold"
                        onClick={() => showLocationMap(row._id, row.prepareLocation, row.prepareTime)}
                    >
                        ✅
                    </span>
                ) : row.prepare
            ),
            wrap: true,
        },
        {
            name: 'Service',
            cell: row => (
                row.service === "✅" ? (
                    <span
                        className="cursor-pointer text-green-600 font-bold"
                        onClick={() => showLocationMap(row._id, row.serviceLocation, row.serviceTime)}
                    >
                        ✅
                    </span>
                ) : row.service
            ),
            wrap: true,
        },
        {
            name: "Keterangan",
            cell: row => row.keterangan,
            grow: 2,
        },
        {
            name: 'Aksi',
            cell: row => (
                <div className="flex gap-2 justify-between">
                    <button
                        className="bg-zinc-600 text-white px-1 py-0.5  text-xs rounded hover:bg-zinc-800"
                        onClick={() => handleRemind(row._id)}
                    >
                        Ingatkan!
                    </button>
                    {/* <button
                        className="bg-rose-600 text-white px-1 py-0.5  text-xs rounded hover:bg-rose-800"
                    >
                        Izinkan Keluar
                    </button> */}
                </div>
            ),
            width: '20%',
        }
    ];

    return (
        <div className="min-h-screen p-5 space-y-7">
            <Link href={`/employees/${slug}/info/${id}`}>
                <div className="flex justify-start mb-5">
                    <Image
                        src="/icons/previous.png"
                        alt="Back Icon"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                    />
                </div>
            </Link>
            <h1 className="text-2xl font-bold text-center">{eventName}</h1>
            <hr className="border-1 border-gray-300" />
            <div className="shadow-lg p-4 space-y-4 border-2 border-black overflow-x-auto max-h-[80vh] sm:max-h-[90vh]">
                <div className="text-sm sm:text-base">
                    <DataTable
                        columns={columns}
                        data={absensi}
                        highlightOnHover
                        noDataComponent={<div style={{ padding: '16px', textAlign: 'center' }}></div>}
                        customStyles={{
                            table: {
                                style: {
                                    width: '100%',
                                    tableLayout: 'fixed',
                                },
                            },
                            cells: {
                                style: {
                                    padding: '6px',
                                    overflow: 'hidden',
                                },
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    )
}