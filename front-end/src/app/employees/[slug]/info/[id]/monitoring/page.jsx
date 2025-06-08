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
    const [waktu, setWaktu] = useState(new Date().toLocaleString('id-ID'));

    useEffect(() => {
        const fetchAbsensi = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/attendance/${id}`);
                const { event, absensi, karyawan } = response.data;

                setEventName(event.name || "-");
                setPolygon(
                    (event.polygon || [])
                );

                setTahap(event.tahap || ['prepare', 'service']);
                setWaktu(timestamp || new Date().toLocaleString('id-ID'));

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
                        };
                    }

                    if (item.tahap === 'prepare') {
                        absensiMap[userId].prepare = item.status === 'gagal' ? "❌" : "✅";
                    } else if (item.tahap === 'service') {
                        absensiMap[userId].service = item.status === 'gagal' ? "❌" : "✅";
                    }

                    if (!absensiMap[userId].location && item.location) {
                        absensiMap[userId].location = item.location;
                    }
                });

                // Gabungkan peserta dengan data absensi
                const combinedData = karyawan.map(user => ({
                    _id: user._id,
                    name: user.name || "-",
                    prepare: absensiMap[user._id]?.prepare || "-",
                    service: absensiMap[user._id]?.service || "-",
                    location: absensiMap[user._id]?.location || null,
                }));

                const supervisorId = event.supervisorId;
                const filteredData = combinedData.filter(user => user._id !== supervisorId);

                setAbsensi(filteredData);

            } catch (error) {
                console.error("Error fetching absensi data:", error);
            }
        }

        fetchAbsensi();
    }, [id]);


    const handleRemind = async (userId) => {
        try {
            await axios.post(`http://localhost:5001/attendance/remind/${userId}/event/${id}`);
            console.log(`pengingat telah dikirim untuk userId: ${userId}`);
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Pengingat telah dikirim.',
            });
        } catch (error) {
            console.error("Error sending reminder:", error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: 'Terjadi kesalahan saat mengirim pengingat.',
            });
        }
    }

    const showLocationMap = (location) => {
        if (!location) {
            Swal.fire({
                icon: "error",
                title: "Lokasi Tidak Tersedia",
                text: "Lokasi untuk karyawan ini tidak tersedia.",
            });
        }

        const div = document.createElement('div');
        div.id = 'map-swal-container';
        div.style.width = '100%';
        div.style.height = '400px';

        Swal.fire({
            title: `Absensi - ${tahap === 'prepare' ? 'Prepare' : 'Service'}` +
                ` untuk ${absensi.find(row => row.location === location)?.name || 'Tidak Diketahui'} -` +
                ` Waktu: ${waktu}`,
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
            }
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
                        onClick={() => showLocationMap(row.location, 'prepare')}
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
                        onClick={() => showLocationMap(row.location, 'service')}
                    >
                        ✅
                    </span>
                ) : row.service
            ),
            wrap: true,
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
                    <button
                        className="bg-rose-600 text-white px-1 py-0.5  text-xs rounded hover:bg-rose-800"
                    >
                        Izinkan Keluar
                    </button>
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