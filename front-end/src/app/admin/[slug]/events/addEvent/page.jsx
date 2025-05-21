'use client'

import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet'
if (typeof window === 'undefined') {
    global.L = {};
} else {
    require('leaflet');
}
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import Link from 'next/link'
import { useParams, useRouter } from "next/navigation"


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



export default function AddEvent() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [polygon, setPolygon] = useState([])
    const [isDrawing, setIsDrawing] = useState(false)
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
    const [karyawanData, setKaryawanData] = useState([])
    const [dapurList, setDapurList] = useState([])
    const [selectedSupervisor, setSelectedSupervisor] = useState('')
    const [prepareDate, setPrepareDate] = useState('')
    const [serviceDate, setServiceDate] = useState('')
    const [namaAcara, setNamaAcara] = useState('')
    const [porsi, setPorsi] = useState('')
    const [prepareStartTime, setPrepareStartTime] = useState('')
    const [prepareEndTime, setPrepareEndTime] = useState('')
    const [serviceStartTime, setServiceStartTime] = useState('')
    const [serviceEndTime, setServiceEndTime] = useState('')
    const [selectedGudang, setSelectedGudang] = useState([]);
    const [locationAddress, setLocationAddress] = useState(null)
    const mapRef = useRef(null)

    const params = useParams();
    const slug = params.slug;
    const router = useRouter();

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

    useEffect(() => {
        const fetchAllKaryawan = async () => {
            try {
                const res = await axios.get('http://localhost:5001/event/available-employees');
                if (res.data.success) {
                    setKaryawanData(res.data.data);
                    console.log('Initial karyawan:', res.data.data);
                }
            } catch (err) {
                console.error('Gagal fetch semua karyawan:', err);
            }
        };
        fetchAllKaryawan();
    }, []);

    useEffect(() => {
        fetchAvailableEmployees();
    }, [prepareDate, serviceDate]);

    const handleGudangToggle = (userId, jobdesk) => {
        setSelectedGudang(prev => {
            const exists = prev.find(item => item.userId === userId && item.jobdesk === jobdesk);
            if (exists) {
                return prev.filter(item => !(item.userId === userId && item.jobdesk === jobdesk));
            } else {
                return [...prev, { userId, jobdesk }];
            }
        });
    };

    const fetchAvailableEmployees = async () => {
        if (!prepareDate || !serviceDate) return;
        try {
            const { data: { data: available } } = await axios.get(
            `http://localhost:5001/event/available-employees?date_prepare=${prepareDate}&date_service=${serviceDate}`
            );
            setKaryawanData(available);
            console.log('Karyawan tersedia di kedua tanggal:', available);
        } catch (error) {
            console.error('Error fetch available employees:', error);
        }
 }

    const handleSearch = async () => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(searchQuery)}`
            const response = await axios.get(url)
            if (response.data && response.data.length > 0) {
                const location = response.data[0]
                const latlng = L.latLng(parseFloat(location.lat), parseFloat(location.lon))
                setSelectedLocation(latlng)
                setLocationAddress(location.address)
                mapRef.current?.setView(latlng, 20)
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
                setLocationAddress(response.data.address) 
                mapRef.current?.setView([lat, lon], 14); 
            }
        } catch (error) {
            console.log("TERJADI ERROR DALAM REVERSE GEOCODING", error)
        }
    }

    const addPoint = (point) => setPolygon((prev) => [...prev, point])
    const handleClearPolygon = () => setPolygon([])
    const toggleDrawing = () => { setIsReverseGeocoding(false); setIsDrawing((prev) => !prev) }
    const toggleReverseGeocoding = () => { setIsDrawing(false); setIsReverseGeocoding((prev) => !prev) }

    const handleSupervisorChange = (e) => {
        setSelectedSupervisor(e.target.value);
    }

    const selectedSupervisorId = karyawanData.find(emp => emp.name === selectedSupervisor)?._id;

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

     let closedPolygon = [...polygon]
            if (closedPolygon.length > 1) {
                const first = closedPolygon[0]
                const last = closedPolygon[closedPolygon.length - 1]
                if (first.lat !== last.lat || first.lng !== last.lng) {
                    closedPolygon.push(first)
                }
            }


    const handleSubmit = async (e) => {
         e.preventDefault();
        try {
            const locationPayload = {
                name: searchQuery,
                address: locationAddress,
                longitude: selectedLocation.lng,
                latitude: selectedLocation.lat,
                polygon:  closedPolygon.map(p => [p.lng, p.lat]),
            }

            const gudangPayload = selectedGudang.map(item => {
                const emp = karyawanData.find(e => e._id === item.userId)
                const jdObj = emp.jobdesk.find(jd => jd.name === item.jobdesk && jd.category === 'gudang')
                return {
                    user_id: item.userId,
                    jobdesk: [jdObj ? jdObj._id : null].filter(Boolean),
                    tahap: ['prepare', 'service']
                }
            })

            const dapurPayload = dapurList.map(menu => ({
                menu: menu.menu,
                stan: menu.stan,
                jumlah_porsi: Number(menu.jumlah_porsi),
                penanggung_jawab: menu.penanggung_jawab.map(name => {
                    const emp = karyawanData.find(e => e.name === name)
                    return emp
                        ? { user_id: emp._id, name: emp.name }
                        : null
                }).filter(Boolean)
            }))

            const body = {
                name: namaAcara,
                porsi: Number(porsi),
                date_prepare: prepareDate,
                time_start_prepare: prepareStartTime,
                time_end_prepare: prepareEndTime,
                date_service: serviceDate,
                time_start_service: serviceStartTime,
                time_end_service: serviceEndTime,
                supervisor: selectedSupervisorId,
                location: locationPayload,
                gudang: gudangPayload,
                dapur: dapurPayload
            }

            const response = await axios.post(
                'http://localhost:5001/event/create',
                body
            )

            console.log('RESPONSE:', response.status, response.data);
            const successStatus = response.data.success ? 'true' : 'false';
            router.push(`/admin/${slug}/events?success=${successStatus}&message=${encodeURIComponent(response.data.message)}`);
        } catch (error) {
            console.error("DETAIL ERROR SUBMIT EVENT:", error); // Tambahkan ini
            const errorMessage = error.response?.data?.message || "Terjadi Kesalahan Saat Menambahkan Event";
            router.push(`/admin/${slug}/events?success=false&message=${encodeURIComponent(errorMessage)}`);
        }
    }



    const jdList = Array.from(new Set(
        karyawanData.flatMap(emp =>
            emp.jobdesk
                .filter(jd => jd.category === 'gudang')
                .map(jd => jd.name)
        )
    ));

    return (
         <form onSubmit={handleSubmit}>     
            <div className='space-y-8'>
                <h1 className="text-3xl font-bold">Management Penjadwalan</h1>
                <hr />

                {/* Info Acara */}
                <div>
                    <label className="block mb-2 font-medium">Nama Acara</label>
                    <input type="text" className="w-full border px-3 py-2 rounded" value={namaAcara} onChange={(e) => setNamaAcara(e.target.value)} />
                </div>
                <div>
                    <label className="block mb-2 font-medium">Porsi</label>
                    <input type="text" className="w-full border px-3 py-2 rounded" value={porsi} onChange={(e) => setPorsi(e.target.value)} />
                </div>

                {/* Jadwal Prepare dan Service */}
                <div>
                    <label className="block mb-2 font-medium">Prepare</label>
                    <input type="date" className="w-full border px-3 py-2 rounded mb-3" value={prepareDate} onChange={(e) => setPrepareDate(e.target.value)} />
                    <span>Waktu Mulai</span>
                    <input type="time" className="w-full border px-3 py-2 rounded mb-2" value={prepareStartTime} onChange={(e) => setPrepareStartTime(e.target.value)} placeholder='waktu mulai' />
                    <span>Waktu Selesai</span>
                    <input type="time" className="w-full border px-3 py-2 rounded" value={prepareEndTime} onChange={(e) => setPrepareEndTime(e.target.value)} placeholder='waktu selesai' />
                </div>
                <div>
                    <label className="block mb-2 font-medium">Service</label>
                    <input type="date" className="w-full border px-3 py-2 rounded mb-3" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                    <span>Waktu Mulai</span>
                    <input type="time" className="w-full border px-3 py-2 rounded mb-2" value={serviceStartTime} onChange={(e) => setServiceStartTime(e.target.value)} placeholder='waktu mulai' />
                    <span>Waktu Selesai</span>
                    <input type="time" className="w-full border px-3 py-2 rounded" value={serviceEndTime} onChange={(e) => setServiceEndTime(e.target.value)} placeholder='waktu selesai' />
                </div>

                {/* Supervisor */}
                <div>
                    <label className="block mb-2 font-medium">Supervisor</label>
                    <select className="w-full border px-3 py-2 rounded" value={selectedSupervisor} onChange={handleSupervisorChange}>
                        <option value="">-- Pilih Supervisor --</option>
                        {karyawanData
                            .filter(emp => emp.is_supervisor_candidate)
                            .map(emp => (
                                <option key={emp._id} value={emp.name}>{emp.name}</option>
                            ))}
                    </select>
                </div>

                {/* Gudang */}
                <div>
                    <h2 className="text-xl font-semibold mb-2">Pilih Karyawan Gudang</h2>
                    <div className="space-y-4">
                        {jdList.map(jdName => (
                            <div key={jdName} className="mb-3">
                                <span className="block font-semibold mb-1">{jdName}</span>
                                <div className="space-y-2 ml-4">
                                    {karyawanData
                                        .filter(emp =>
                                            emp.jobdesk.some(jd => jd.name === jdName && jd.category === 'gudang') &&
                                            emp._id !== selectedSupervisorId
                                        )
                                        .map(emp => {
                                            const isChecked = selectedGudang.some(item =>
                                                item.userId === emp._id && item.jobdesk === jdName
                                            );
                                            return (
                                                <label key={emp._id + jdName} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 border-2 border-black"
                                                        checked={isChecked}
                                                        onChange={() => handleGudangToggle(emp._id, jdName)}
                                                    />
                                                    {emp.name}
                                                </label>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dapur */}
                <div>
                    <h2 className="text-xl font-semibold mb-2 mt-6">Dapur - Menu & Penanggung Jawab</h2>
                    <button type="button" onClick={handleAddMenu} className="mb-4 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-700">Tambah Menu</button>
                    <div className="space-y-4">
                        {dapurList.map((menu, index) => (
                            <div key={index} className="border p-4 rounded space-y-2 bg-gray-50">
                                <div>
                                    <label className="block text-sm font-medium">Menu</label>
                                    <input
                                        type="text"
                                        className="w-full border px-3 py-2 rounded"
                                        value={menu.menu}
                                        onChange={(e) => handleChangeMenu(index, 'menu', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Stan</label>
                                    <input
                                        type="text"
                                        className="w-full border px-3 py-2 rounded"
                                        value={menu.stan}
                                        onChange={(e) => handleChangeMenu(index, 'stan', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Jumlah Porsi</label>
                                    <input
                                        type="number"
                                        className="w-full border px-3 py-2 rounded"
                                        value={menu.jumlah_porsi}
                                        onChange={(e) => handleChangeMenu(index, 'jumlah_porsi', e.target.value)}
                                    />
                                </div>

                                {/* Penanggung Jawab untuk Dapur */}
                                <div>
                                    <label className="block text-sm font-medium">Penanggung Jawab</label>
                                    <div className="space-y-1">
                                        {karyawanData
                                            .filter(emp => emp.jobdesk.some(jd => jd.category === 'dapur'))
                                            .map(emp => (
                                                <div key={emp._id} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`dapur-${index}-${emp._id}`}
                                                        checked={menu.penanggung_jawab.includes(emp.name)}
                                                        onChange={(e) => {
                                                            const updatedList = [...dapurList];
                                                            if (e.target.checked) {
                                                                updatedList[index].penanggung_jawab.push(emp.name);
                                                            } else {
                                                                updatedList[index].penanggung_jawab = updatedList[index].penanggung_jawab.filter(
                                                                    n => n !== emp.name
                                                                );
                                                            }
                                                            setDapurList(updatedList);
                                                        }}
                                                        className="h-4 w-4 border-2 border-black"
                                                    />
                                                    <label htmlFor={`dapur-${index}-${emp._id}`} className="text-sm">{emp.name}</label>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Tombol Hapus Menu */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMenu(index)}
                                    className="mt-3 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                                >
                                    Hapus Menu
                                </button>
                            </div>
                        ))}
                    </div>
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
                    {polygon.length > 0 && <Polygon positions={polygon} pathOptions={{ color: 'blue' }} />}
                </MapContainer>
                <div className="flex justify-end gap-3">
                   <button type='submit' className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">SUBMIT</button>
                    <Link href={`/admin/${slug}/events`}>
                        <button className="bg-slate-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-slate-700">KEMBALI</button>
                    </Link>
                </div>
            </div>
         </form>
    )
}
