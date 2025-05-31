"use client"

import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet'
if (typeof window === 'undefined') {
    global.L = {};
} else {
    require('leaflet');
}
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import { useParams } from 'next/navigation';
import Link from 'next/link';

const costumIcon = L.icon({
    iconUrl: '/assets/marker.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -32],
});

export default function detailEvent() {
    const { id } = useParams();
    const [detailEvent, setDetailEvent] = useState([]);
    const [position, setPosition] = useState([-6.2, 106.8]);
    const [polygon, setPolygon] = useState([]);
    const params = useParams();
    const slug = params.slug;


    const fetchEventByID = async () => {
        try {
            const response = await axios.get(`http://localhost:5001/event/${id}`);
            const data = response.data.data
            setDetailEvent(data)

            if (data?.location) {
                const lat = Number(data.location.latitude);
                const lng = Number(data.location.longitude);

                if (!isNaN(lat) && !isNaN(lng)) {
                    const newPosition = [lat, lng];
                    setPosition(newPosition);
                    console.log("Setting position:", newPosition);
                }

                if (Array.isArray(data.location.polygon)) {
                    const normalized = data.location.polygon.map(([lng, lat]) => [lat, lng]);
                    setPolygon(normalized);
                    console.log("Polygon normalized:", normalized);
                }
            }

        } catch (error) {
            console.log("Terjadi Error", error)
        }
    }

    useEffect(() => {
        fetchEventByID()
    }, [id]);

    useEffect(() => {
        console.log("Position updated:", position)
    }, [position])

    useEffect(() => {
        console.log("Polygon updated:", polygon)
    }, [polygon])


    return (
        <div className='max-w-5xl mx-auto p-6'>
            <h1 className='text-3xl font-bold mb-5 text-black'>{detailEvent.name}</h1>
            <div className='bg-white shadow-xl rounded-2xl p-4 mb-6 space-y-3'>
                <p><strong>Slug :</strong> {detailEvent.slug}</p>
                <p><strong>Status :</strong> {detailEvent.status}</p>
                <p><strong>Porsi :</strong> {detailEvent.porsi}</p>
                <p><strong>Supervisor :</strong> {detailEvent.supervisor?.id?.name || '-'}</p>
                <p><strong>Dibuat: </strong> {new Date(detailEvent.createdAt).toLocaleDateString()}</p>
                <p><strong>Diperbarui: </strong>  {new Date(detailEvent.updatedAt).toLocaleDateString()}</p>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-5 mt-6'>
                    <div>
                        <h2 className='font-semibold text-lg'>Tahap Prepare</h2>
                        <p>{new Date(detailEvent.date_prepare).toLocaleDateString("id", "ID")}</p>
                        <p>{detailEvent.time_start_prepare} - {detailEvent.time_end_prepare}</p>
                    </div>
                    <div>
                        <h2 className='font-semibold text-lg'>Tahap Srvice</h2>
                        <p>{new Date(detailEvent.date_service).toLocaleDateString("id", "ID")}</p>
                        <p>{detailEvent.time_start_service} - {detailEvent.time_end_service}</p>
                    </div>
                </div>

                <div className='bg-white shadow-md rounded-2xl p-5 mb-7'>
                    <h2 className='text-2xl font-semibold mb-2'>Karyawan Gudang</h2>
                    {Array.isArray(detailEvent.gudang) && Object.values(
                        detailEvent.gudang.reduce((acc, g) => {
                            const userId = g.user_id?._id;
                            if (!userId) return acc;

                            if (!acc[userId]) {
                                acc[userId] = {
                                    name: g.user_id.name,
                                    jobdesk: new Set(),
                                    tahap: new Set(),
                                    confirmation: g.confirmation,
                                };
                            }

                            g.jobdesk?.forEach(j => acc[userId].jobdesk.add(j.name));
                            g.tahap?.forEach(t => acc[userId].tahap.add(t));

                            return acc;
                        }, {})
                    ).map((g, i) => (
                        <div className='mb-2 border-b pb-2' key={i}>
                            <p><strong>Nama :</strong> {g.name}</p>
                            <p><strong>Jobdesk :</strong> {[...g.jobdesk].join(', ')}</p>
                            <p><strong>Tahap :</strong> {[...g.tahap].join(', ')}</p>
                            <p><strong>Konfirmasi :</strong> {g.confirmation.status} ({g.confirmation.timestamp && new Date(g.confirmation.timestamp).toLocaleString()})</p>
                        </div>
                    ))}
                </div>

                <div className='bg-white shadow-md rounded-2xl p-4'>
                    <h2 className='text-2xl font-semibold mb-2'>Dapur</h2>
                    {detailEvent.dapur?.map((d, i) => (
                        <div className='mb-5 border-b pb-2' key={i}>
                            <p><strong>Menu :</strong>{d.menu}</p>
                            <p><strong>Jumlah Porsi :</strong>{d.jumlah_porsi}</p>
                            <p><strong>Tahap :</strong>{d.tahap}</p>
                            <div className='ml-4 mt-2'>
                                <p className='font-semibold'>Penanggung Jawab</p>
                                {d.penanggung_jawab.map((pj, index) => (
                                    <p key={index} className='text-sm'>
                                        {pj.user_id?.name} ({pj.confirmation.status}, {pj.confirmation.timestamp && new Date(pj.confirmation.timestamp).toLocaleString()})
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className='mt-6'>
                    <h2 className='text-xl font-semibold'>Lokasi</h2>
                    <p><strong>Nama:</strong> {detailEvent.location?.name}</p>
                    <p><strong>Alamat:</strong> {detailEvent.location?.address?.road}, {detailEvent.location?.address?.village}, {detailEvent.location?.address?.city}</p>
                    <div className='h-96 mt-4 rounded-2xl overflow-hidden'>
                        {typeof position[0] === 'number' && typeof position[1] === 'number' && (
                            <MapContainer center={position} zoom={17} scrollWheelZoom={false} className="h-full w-full z-0" key={position.join(',')}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={position} icon={costumIcon} />
                                {polygon.length > 0 && (
                                    <Polygon
                                        positions={polygon}
                                        pathOptions={{ color: 'blue' }}
                                    />
                                )}
                            </MapContainer>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Link href={`/direktur/${slug}/events`}>
                        <button className="bg-slate-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-slate-700">KEMBALI</button>
                    </Link>
                </div>
            </div>
        </div>
    )
}