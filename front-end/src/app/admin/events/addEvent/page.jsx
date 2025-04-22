'use client'

import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import Link from 'next/link'

const costumIcon = L.icon({
    iconUrl: '/assets/marker.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -32],
});

function MapClickHandler({ isDrawing, addPoint, isReverseGeocoding, handleReverseGeocode }) {
    useMapEvents({
        click(e) {
            if (isDrawing) {
                addPoint(e.latlng);
            } else if (isReverseGeocoding) {
                handleReverseGeocode(e.latlng.lat, e.latlng.lng);
            }
        }
    })
    return null;
}

// Simulasi data karyawan
const karyawanData = [
    { nama: "Butler Winter", role: "Karyawan", jobdesk: "Kramik", status: "Aktif" },
    { nama: "Leeta Le Torneau", role: "Karyawan", jobdesk: "Supir", status: "Aktif" },
    { nama: "Lore Woods", role: "Karyawan", jobdesk: "Jaga Stan", status: "Aktif" },
    { nama: "Virion Christanti", role: "Karyawan", jobdesk: "Jaga Stan", status: "Aktif" },
    { nama: "Lillith Graeme", role: "Karyawan", jobdesk: "Listrik", status: "Aktif" },
    { nama: "Chadli Lobo", role: "Karyawan", jobdesk: "Listrik", status: "Aktif" },
    { nama: "Norrix Delacroix", role: "Karyawan", jobdesk: "Supir", status: "Aktif" },
]

// Filter hanya yang Role = Karyawan dan Status = Aktif, lalu kelompokkan berdasarkan jobdesk
const groupedKaryawan = karyawanData
    .filter(k => k.role === "Karyawan" && k.status === "Aktif")
    .reduce((acc, curr) => {
        if (!acc[curr.jobdesk]) {
            acc[curr.jobdesk] = []
        }
        acc[curr.jobdesk].push(curr)
        return acc
    }, {})



export default function addEvent() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [polygon, setPolygon] = useState([])
    const [isDrawing, setIsDrawing] = useState(false)
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
    const mapRef = useRef(null)
    useEffect(() => {
        const map = mapRef.current
        if (!map) return

        if (isDrawing) {
            map.dragging.disable()
            map.doubleClickZoom.disable()
            map.scrollWheelZoom.disable()
            map.boxZoom.disable()
            map.keyboard.disable()
            map.touchZoom.disable()
        } else {
            map.dragging.enable()
            map.doubleClickZoom.enable()
            map.scrollWheelZoom.enable()
            map.boxZoom.enable()
            map.keyboard.enable()
            map.touchZoom.enable()
        }
    }, [isDrawing])

    const handleSearch = async () => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                searchQuery
            )}`
            const response = await axios.get(url)
            if (response.data && response.data.length > 0) {
                const location = response.data[0]
                const latlng = L.latLng(parseFloat(location.lat), parseFloat(location.lon))
                setSelectedLocation(latlng)
                mapRef.current?.setView(latlng, 13)
            }
        } catch (error) {
            console.log("TERJADI ERROR DALAM PENCARIAN", error)
        }
    }

    const handleReverseGeocode = async (lat, lon) => {
        try {
            const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
                params: {
                    lat,
                    lon,
                    format: 'json'
                }
            });
            if (response.data && response.data.address) {
                const namaJalan = response.data.address.road || response.data.address.pedestrian || response.data.address.path || response.data.display_name;
                setSearchQuery(namaJalan);
                setSelectedLocation({ lat, lng: lon });
            } else {
                setSearchQuery("Lokasi tidak ditemukan")
            }
            setSelectedLocation({ lat, lng });
        } catch (error) {
            console.log("TERJADI ERROR DALAM PENCARIAN REVERSE GEOCODING", error)
        }
    }

    const addPoint = (point) => {
        setPolygon((prevPoints) => [...prevPoints, point]);
    }

    const handleClearPolygon = () => {
        setPolygon([])
    }

    const toggleDrawing = () => {
        setIsReverseGeocoding(false)
        setIsDrawing((prev) => !prev)
    }

    const toggleReverseGeocoding = () => {
        setIsDrawing(false)
        setIsReverseGeocoding((prev) => !prev)
    }

    return (
        <div className='space-y-8'>
            <h1 className="text-3xl font-bold">Managemnet Penjadwalan</h1>

            <hr />

            <div>
                <label htmlFor="" className="block mb-2 font-medium">Nama Acara</label>
                <input type="text" className="w-full border px-3 py-2 rounded" />
            </div>

            <div>
                <label htmlFor="" className="block mb-2 font-medium">Porsi</label>
                <input type="text" className="w-full border px-3 py-2 rounded" />
            </div>

            <div>
                <label htmlFor="" className="block mb-2 font-medium">Prepare</label>
                <input type="date" className="w-full border px-3 py-2 rounded mb-3" />
                <input type="time" className="w-full border px-3 py-2 rounded" />
            </div>

            <div>
                <label htmlFor="" className="block mb-2 font-medium">Service</label>
                <input type="date" className="w-full border px-3 py-2 rounded mb-3" />
                <input type="time" className="w-full border px-3 py-2 rounded" />
            </div>

            <div>
                <label htmlFor="" className="block mb-2 font-medium">Supervisior</label>
                <select name="" id="" className="w-full border px-3 py-2 rounded">
                    <option>-- Pilih Supervisior</option>
                    <option value="">Ayda Fang</option>
                    <option value="">Pamela Craft</option>
                    <option value="">Emmit Nox</option>
                    <option value="">Zayne Geulimja</option>
                </select>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-2">Pilih Karyawan Berdasarkan Jobdesk</h2>

                {Object.entries(groupedKaryawan).map(([jobdesk, karyawans]) => (
                    <div key={jobdesk} className="mb-4">
                        <h3 className="font-medium mb-1">{jobdesk}</h3>
                        <div className="pl-4 space-y-1">
                            {karyawans.map((k) => (
                                <label key={k.nama} className="block">
                                    <input
                                        type="checkbox"
                                        value={k.nama}
                                        className="mr-2 border-2 border-gray-950"
                                    />
                                    {k.nama}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className='mb-4 flex justify-around'>
                <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Cari Lokasi'
                    className='border px-3 py-2 rounded w-full'
                />
                <button type='button' onClick={handleSearch} className='bg-violet-500 text-white px-3 py-2 rounded ml-2 hover:bg-violet-700'>
                    Cari
                </button>
            </div>

            <div className='mb-4'>
                <button type='button' onClick={toggleDrawing} className='bg-green-500 text-white px-3 py-2 rounded hover:bg-green-700'>
                    {isDrawing ? "Stop Menggambar Polygon" : "Gambar Polygon"}
                </button>
                <button type="button" onClick={handleClearPolygon} className='bg-red-500 text-white px-3 py-2 rounded ml-2 hover:bg-red-700'>
                    Hapus Polygon
                </button>
                <button type="button" onClick={toggleReverseGeocoding} className='bg-amber-500 text-white px-3 py-2 rounded ml-2 hover:bg-amber-700'>
                    {isReverseGeocoding ? "Stop Reverse Geocoding" : "Aktifkan Reverse Geocoding"}
                </button>
            </div>

            <MapContainer center={[0, 0]} zoom={2} style={{ height: "400px", width: "100%" }} ref={mapRef}
                whenCreated={(mapInstance) => {
                    mapRef.current = mapInstance
                }}
            >
                <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                {selectedLocation && <Marker position={selectedLocation} icon={costumIcon} />}
                <MapClickHandler isDrawing={isDrawing} addPoint={addPoint} isReverseGeocoding={isReverseGeocoding} handleReverseGeocode={handleReverseGeocode} />
                {polygon.length > 0 && (
                    <Polygon positions={polygon} pathOptions={{ color: 'purple' }} />
                )}
            </MapContainer>

            <div className="flex justify-end gap-3">
                <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">SUBMIT</button>
                <Link href="/admin/events">
                    <button className="bg-slate-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-slate-700">KEMBALI</button>
                </Link>
            </div>

        </div>
    )
}