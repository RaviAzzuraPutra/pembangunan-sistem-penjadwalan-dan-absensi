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

const karyawanData = [
    { nama: "Butler Winter", role: "Karyawan", jobdesk: "Gudang", status: "Aktif" },
    { nama: "Leeta Le Torneau", role: "Karyawan", jobdesk: "Dapur", status: "Aktif" },
    { nama: "Lore Woods", role: "Karyawan", jobdesk: "Dapur", status: "Aktif" },
    { nama: "Virion Christanti", role: "Karyawan", jobdesk: "Gudang", status: "Aktif" },
    { nama: "Lillith Graeme", role: "Karyawan", jobdesk: "Gudang", status: "Aktif" },
]

export default function AddEvent() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [polygon, setPolygon] = useState([])
    const [isDrawing, setIsDrawing] = useState(false)
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
    const [dapurList, setDapurList] = useState([])
    const [selectedSupervisor, setSelectedSupervisor] = useState('')
    const [karyawanDapurSelected, setKaryawanDapurSelected] = useState([])
    const mapRef = useRef(null)

    const kandidatSupervisor = ["Butler Winter", "Virion Christanti"]

    const handleSupervisorChange = (e) => {
        setSelectedSupervisor(e.target.value);
    }

    const handleAddMenu = () => {
        setDapurList(prev => [...prev, { menu: '', stan: '', jumlah_porsi: '', penanggung_jawab: [] }])
    }

    const handleRemoveMenu = (index) => {
        const newList = [...dapurList]
        newList.splice(index, 1)
        setDapurList(newList)
    }

    const handleChangeMenu = (index, field, value) => {
        const updated = [...dapurList]
        updated[index][field] = value
        setDapurList(updated)
    }

    const handleCheckboxDapur = (nama) => {
        setKaryawanDapurSelected((prev) =>
            prev.includes(nama) ? prev.filter(n => n !== nama) : [...prev, nama]
        );
    }

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
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
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
                params: { lat, lon, format: 'json' }
            });
            if (response.data && response.data.address) {
                const namaJalan = response.data.address.road || response.data.display_name;
                setSearchQuery(namaJalan);
                setSelectedLocation({ lat, lng: lon });
            }
        } catch (error) {
            console.log("TERJADI ERROR DALAM REVERSE GEOCODING", error)
        }
    }

    const addPoint = (point) => setPolygon((prev) => [...prev, point])
    const handleClearPolygon = () => setPolygon([])
    const toggleDrawing = () => { setIsReverseGeocoding(false); setIsDrawing((prev) => !prev) }
    const toggleReverseGeocoding = () => { setIsDrawing(false); setIsReverseGeocoding((prev) => !prev) }

    return (
        <div className='space-y-8'>
            <h1 className="text-3xl font-bold">Managemnet Penjadwalan</h1>
            <hr />

            {/* Info Acara */}
            <div>
                <label className="block mb-2 font-medium">Nama Acara</label>
                <input type="text" className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
                <label className="block mb-2 font-medium">Porsi</label>
                <input type="text" className="w-full border px-3 py-2 rounded" />
            </div>

            {/* Jadwal Prepare dan Service */}
            <div>
                <label className="block mb-2 font-medium">Prepare</label>
                <input type="date" className="w-full border px-3 py-2 rounded mb-3" />
                <input type="time" className="w-full border px-3 py-2 rounded mb-2" placeholder='waktu mulai' />
                <input type="time" className="w-full border px-3 py-2 rounded" placeholder='waktu selesai' />
            </div>
            <div>
                <label className="block mb-2 font-medium">Service</label>
                <input type="date" className="w-full border px-3 py-2 rounded mb-3" />
                <input type="time" className="w-full border px-3 py-2 rounded mb-2" placeholder='waktu mulai' />
                <input type="time" className="w-full border px-3 py-2 rounded" placeholder='waktu selesai' />
            </div>

            {/* Supervisor */}
            <div>
                <label className="block mb-2 font-medium">Supervisior</label>
                <select className="w-full border px-3 py-2 rounded" value={selectedSupervisor} onChange={handleSupervisorChange}>
                    <option value="">-- Pilih Supervisior</option>
                    {kandidatSupervisor.map((nama) => (
                        <option key={nama} value={nama}>{nama}</option>
                    ))}
                </select>
            </div>

            {/* Karyawan Gudang */}
            <div>
                <h2 className="text-xl font-semibold mb-2">Karyawan Gudang</h2>
                <div className="pl-4 space-y-1">
                    {karyawanData.filter(k => k.jobdesk === "Gudang").map((k) => (
                        <label key={k.nama} className="block">
                            <input
                                type="checkbox"
                                value={k.nama}
                                className="mr-2 border-2 border-gray-950"
                                disabled={selectedSupervisor === k.nama}
                                defaultChecked
                            />
                            {k.nama} (Tahap: Prepare & Service)
                            {selectedSupervisor === k.nama && <span className="text-sm text-red-500 ml-2">(Supervisor)</span>}
                        </label>
                    ))}
                </div>
            </div>
            {/* Menu Dapur */}
            <div>
                <h2 className="text-xl font-semibold mb-2">Menu Dapur</h2>
                {dapurList.map((item, index) => (
                    <div key={index} className="border p-4 rounded mb-4 space-y-2">
                        <input type="text" placeholder="Nama Menu" value={item.menu} onChange={(e) => handleChangeMenu(index, 'menu', e.target.value)} className="w-full border px-3 py-2 rounded" />
                        <div className="pl-2 space-y-1">
                            {karyawanData.filter(k => k.jobdesk === "Dapur").map((k) => (
                                <label key={k.nama} className="block">
                                    <input
                                        type="checkbox"
                                        value={k.nama}
                                        checked={item.penanggung_jawab.includes(k.nama)}
                                        onChange={(e) => {
                                            const updated = [...item.penanggung_jawab];
                                            if (e.target.checked) {
                                                updated.push(k.nama);
                                            } else {
                                                const index = updated.indexOf(k.nama);
                                                if (index > -1) updated.splice(index, 1);
                                            }
                                            handleChangeMenu(index, 'penanggung_jawab', updated);
                                        }}
                                        className="mr-2"
                                    />
                                    {k.nama} (Tahap: Service)
                                </label>
                            ))}
                        </div>
                        <button type="button" onClick={() => handleRemoveMenu(index)} className="text-red-600 text-sm">Hapus Menu</button>
                    </div>
                ))}
                <button type="button" onClick={handleAddMenu} className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-700">Tambah Menu Dapur</button>
            </div>

            {/* Map dan Action */}
            <div className='mb-4 flex justify-around'>
                <input type='text' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder='Cari Lokasi' className='border px-3 py-2 rounded w-full' />
                <button type='button' onClick={handleSearch} className='bg-violet-500 text-white px-3 py-2 rounded ml-2 hover:bg-violet-700'>Cari</button>
            </div>
            <div className='mb-4'>
                <button type='button' onClick={toggleDrawing} className='bg-green-500 text-white px-3 py-2 rounded hover:bg-green-700'>{isDrawing ? "Stop Menggambar Polygon" : "Gambar Polygon"}</button>
                <button type="button" onClick={handleClearPolygon} className='bg-red-500 text-white px-3 py-2 rounded ml-2 hover:bg-red-700'>Hapus Polygon</button>
                <button type="button" onClick={toggleReverseGeocoding} className='bg-amber-500 text-white px-3 py-2 rounded ml-2 hover:bg-amber-700'>{isReverseGeocoding ? "Stop Reverse Geocoding" : "Aktifkan Reverse Geocoding"}</button>
            </div>
            <MapContainer center={[0, 0]} zoom={2} style={{ height: "400px", width: "100%" }} ref={mapRef} whenCreated={(mapInstance) => { mapRef.current = mapInstance }}>
                <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                {selectedLocation && <Marker position={selectedLocation} icon={costumIcon} />}
                <MapClickHandler isDrawing={isDrawing} addPoint={addPoint} isReverseGeocoding={isReverseGeocoding} handleReverseGeocode={handleReverseGeocode} />
                {polygon.length > 0 && <Polygon positions={polygon} pathOptions={{ color: 'purple' }} />}
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