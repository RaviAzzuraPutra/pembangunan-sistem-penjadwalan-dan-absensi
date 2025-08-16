'use client'

import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import Link from 'next/link'
import { useParams, useRouter } from "next/navigation"
import Swal from 'sweetalert2'


const costumIcon = L.icon({
    iconUrl: '/assets/marker.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -32],
});

function MapClickHandler({ isDrawing, addPoint, handleReverseGeocode }) {
    useMapEvents({
        dblclick(e) {
            if (!isDrawing) {
                handleReverseGeocode(e.latlng.lat, e.latlng.lng);
            }
        },
        click(e) {
            if (isDrawing) {
                addPoint(e.latlng);
            }
        }
    });
    return null;
}



export default function UpdateEvent() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [polygon, setPolygon] = useState([])
    const [isDrawing, setIsDrawing] = useState(false)
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
    const [searchGudang, setSearchGudang] = useState('')
    const [allKaryawan, setAllKaryawan] = useState([]);
    const [event, setEvent] = useState(null);
    const mapRef = useRef(null)

    const params = useParams();
    const slug = params.slug;
    const router = useRouter();

    useEffect(() => {
        const fetchEvent = async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/event/${params.id}`);
            const event = res.data.data;
            setEvent(event);


            // Jika supervisor konfirmasi "tidak bisa", set ke kosong agar user harus memilih supervisor baru
            if (event.supervisor?.confirmation === 'tidak bisa') {
                setSelectedSupervisor("");
            } else {
                setSelectedSupervisor(event.supervisor?.id?.name || "");
            }

            // Preload minimal
            setNamaAcara(event.name);
            setPorsi(event.porsi);
            setPrepareDate(event.date_prepare?.slice(0, 10));
            setServiceDate(event.date_service?.slice(0, 10));
            setPrepareStartTime(event.time_start_prepare);
            setPrepareEndTime(event.time_end_prepare);
            setServiceStartTime(event.time_start_service);
            setServiceEndTime(event.time_end_service);
            setSelectedLocation({
                lat: event.location.latitude,
                lng: event.location.longitude
            });
            setPolygon(event.location.polygon.map(([lat, lng]) => ({ lat, lng })));
            setSearchQuery(event.location.name);
            setLocationAddress(event.location.address);
            setSelectedSupervisor(event.supervisor?.id?.name);
            // Simpan seluruh kombinasi user-jobdesk (bukan hanya index 0) agar tidak hilang saat update
            const gudangSelected = [];
            event.gudang
                .filter(g => g.confirmation !== 'tidak bisa')
                .forEach(g => {
                    (g.jobdesk || []).forEach(jd => {
                        if (jd?.name) {
                            gudangSelected.push({ userId: g.user_id._id, jobdesk: jd.name });
                        }
                    });
                });
            setSelectedGudang(gudangSelected);
            setDapurList(
                event.dapur.map(d => ({
                    menu: d.menu,
                    jumlah_porsi: d.jumlah_porsi,
                    penanggung_jawab: d.penanggung_jawab
                        .filter(pj => pj.confirmation !== 'tidak bisa')
                        .map(pj => pj.user_id.name)
                }))
            );
        };

        fetchEvent();
    }, []);


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
                // Ambil karyawan yang available di tanggal prepare dan service
                const params = [];
                if (prepareDate) params.push(`date_prepare=${prepareDate}`);
                if (serviceDate) params.push(`date_service=${serviceDate}`);
                const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/event/available-employees${params.length ? '?' + params.join('&') : ''}`;
                const res = await axios.get(url);
                if (res.data.success) {
                    // Simpan hanya daftar available; karyawanData akan dibentuk ulang di effect merging
                    setAllKaryawan(res.data.data);
                }
            } catch (err) {
                console.log('Gagal fetch semua karyawan:', err);
            }
        };
        // Hanya fetch jika tanggal sudah ada
        if (prepareDate && serviceDate) {
            fetchAllKaryawan();
        }
    }, [prepareDate, serviceDate]);

    // Gabungkan peserta event (supervisor, gudang, dapur) ke dalam karyawanData agar tetap muncul meski sudah dianggap unavailable oleh backend
    useEffect(() => {
        if (!event) return;
        // Mulai dari list available terbaru agar tidak mempertahankan data usang
        const base = Array.isArray(allKaryawan) ? allKaryawan : [];
        const map = new Map(base.map(emp => [emp._id, emp]));

        // Supervisor (kecuali 'tidak bisa')
        if (event.supervisor?.id && event.supervisor.confirmation !== 'tidak bisa') {
            const sup = event.supervisor.id;
            if (!map.has(sup._id)) map.set(sup._id, { ...sup });
        }

        // Gudang participants (tetap tampil jika 'bisa' atau 'menunggu')
        (event.gudang || []).forEach(g => {
            if (g.confirmation === 'tidak bisa') return; // hilangkan yang diganti
            const u = g.user_id;
            if (u && !map.has(u._id)) map.set(u._id, { ...u });
        });

        // Dapur penanggung jawab (kecuali 'tidak bisa')
        (event.dapur || []).forEach(d => {
            (d.penanggung_jawab || []).forEach(pj => {
                if (pj.confirmation === 'tidak bisa') return;
                const u = pj.user_id;
                if (u && !map.has(u._id)) map.set(u._id, { ...u });
            });
        });

        setKaryawanData(Array.from(map.values()));
    }, [event, allKaryawan]);

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
                const currentZoom = mapRef.current?.getZoom();
                mapRef.current?.setView([lat, lon], currentZoom);
            }
        } catch (error) {
            console.log("TERJADI ERROR DALAM REVERSE GEOCODING", error)
        }
    }

    const addPoint = (point) => setPolygon((prev) => [...prev, point])
    const handleClearPolygon = () => setPolygon([])
    const toggleDrawing = () => { setIsDrawing((prev) => !prev) }

    const handleSupervisorChange = (e) => {
        const selectedName = e.target.value;
        setSelectedSupervisor(selectedName);

        // Jika user memilih placeholder, tidak lakukan apa-apa
        if (!selectedName) return;

        // Cari userId supervisor yang dipilih
        const supervisorCandidate = karyawanData.find(emp => emp.name === selectedName);
        if (!supervisorCandidate) return;

        // Cek apakah dia sudah ada di daftar gudang
        const isInGudang = selectedGudang.some(item => item.userId === supervisorCandidate._id);
        if (isInGudang) {
            // Hapus otomatis dari gudang jika pindah ke supervisor
            setSelectedGudang(prev =>
                prev.filter(item => item.userId !== supervisorCandidate._id)
            );
        }
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

    let closedPolygon = [...polygon]
    if (closedPolygon.length > 1) {
        const first = closedPolygon[0]
        const last = closedPolygon[closedPolygon.length - 1]
        if (first.lat !== last.lat || first.lng !== last.lng) {
            closedPolygon.push(first)
        }
    }



    const selectedSupervisorId = karyawanData.find(emp => emp.name === selectedSupervisor)?._id;


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!namaAcara) {
            Swal.fire({
                icon: 'error',
                title: 'Nama Acara Tidak Boleh Kosong!!!',
                text: 'Silakan masukkan nama acara.',
            });
            return;
        }

        if (!porsi || isNaN(porsi) || porsi <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Porsi Tidak Valid!!!',
                text: 'Silakan masukkan jumlah porsi yang valid.',
            });
            return;
        }

        // const today = new Date();
        // const minPrepareDate = new Date(today);
        // minPrepareDate.setDate(today.getDate() + 7);
        // minPrepareDate.setHours(0, 0, 0, 0);

        // if (new Date(prepareDate) < minPrepareDate) {
        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Penjadwalan Terlambat!!!',
        //         text: 'Penjadwalan harus dilakukan minimal 7 hari sebelum tanggal prepare.',
        //     });
        //     return;
        // }

        // if (!prepareDate) {
        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Tanggal Prepare Tidak Boleh Kosong!!!',
        //         text: 'Silakan pilih tanggal prepare untuk acara ini.',
        //     });
        //     return;
        // }

        // if (!serviceDate) {
        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Tanggal Service Tidak Boleh Kosong!!!',
        //         text: 'Silakan pilih tanggal service untuk acara ini.',
        //     });
        //     return;
        // }

        // if (!prepareStartTime || !prepareEndTime) {
        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Waktu Prepare Tidak Boleh Kosong!!!',
        //         text: 'Silakan pilih waktu mulai dan selesai prepare.',
        //     });
        //     return;
        // }

        // if (!serviceStartTime || !serviceEndTime) {
        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Waktu Service Tidak Boleh Kosong!!!',
        //         text: 'Silakan pilih waktu mulai dan selesai service.',
        //     });
        //     return;
        // }

        // const parseTime = (time) => new Date(`1970-01-01T${time}:00`);

        // if (parseTime(prepareStartTime) >= parseTime(prepareEndTime)) {
        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Waktu Prepare Tidak Valid!!!',
        //         text: 'Waktu mulai prepare harus sebelum waktu selesai prepare.',
        //     });
        //     return;
        // }

        // if (parseTime(serviceStartTime) >= parseTime(serviceEndTime)) {
        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Waktu Service Tidak Valid!!!',
        //         text: 'Waktu mulai service harus sebelum waktu selesai service.',
        //     });
        //     return;
        // }

        // if (new Date(prepareDate) > new Date(serviceDate)) {
        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Tanggal Prepare Tidak Valid!!!',
        //         text: 'Tanggal prepare harus sebelum tanggal service.',
        //     });
        //     return;
        // }

        // if (new Date(prepareDate).getTime() === new Date(serviceDate).getTime()) {
        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Tanggal Prepare dan Service Tidak Boleh Sama!!!',
        //         text: 'Silakan pilih tanggal prepare tidak boleh sama dengan tanggal service, harus h-1',
        //     });
        //     return;
        // }

        if (!selectedSupervisor) {
            Swal.fire({
                icon: 'error',
                title: 'Supervisor Tidak Boleh Kosong!!!',
                text: 'Silakan pilih supervisor untuk acara ini.',
            });
            return;
        }

        if (selectedGudang.length === 0) {
            Swal.fire({
                icon: "error",
                title: "Karyawan Gudang Tidak Boleh Kosong!!!",
                text: "Silakan pilih karyawan gudang untuk acara ini.",
            });
            return;
        }

        // Validasi penanggung jawab dapur
        if (dapurList.length === 0) {
            Swal.fire({
                icon: "error",
                title: "Menu Dapur Tidak Boleh Kosong!!!",
                text: "Silakan tambahkan minimal satu menu dapur.",
            });
            return;
        }

        const hasPenanggungJawab = dapurList.every(menu => menu.penanggung_jawab.length > 0);
        if (!hasPenanggungJawab) {
            Swal.fire({
                icon: "error",
                title: "Penanggung Jawab Dapur Tidak Boleh Kosong!!!",
                text: "Silakan pilih penanggung jawab untuk setiap menu dapur.",
            });
            return;
        }

        // Validasi jumlah karyawan (gudang + dapur + supervisor)
        const gudangIds = selectedGudang.map(item => item.userId);
        const dapurIds = dapurList.flatMap(menu => menu.penanggung_jawab.map(name => {
            const emp = karyawanData.find(e => e.name === name);
            return emp ? emp._id : null;
        })).filter(Boolean);
        const supervisorId = selectedSupervisorId;
        const allKaryawanSet = new Set([...gudangIds, ...dapurIds, supervisorId]);
        const totalKaryawan = allKaryawanSet.size;


        // if (totalKaryawan < 35 || totalKaryawan > 50) {
        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Jumlah Karyawan Tidak Valid!!!',
        //         text: 'Jumlah total karyawan (gudang, dapur, supervisor) harus antara 35 dan 50 orang.',
        //     });
        //     return;
        // }



        if (!selectedLocation) {
            Swal.fire({
                icon: 'error',
                title: 'Lokasi Tidak Ditemukan!!!',
                text: 'Silakan pilih lokasi acara terlebih dahulu.',
            });
            return;
        }

        if (!polygon || polygon.length < 4) {
            Swal.fire({
                icon: 'error',
                title: 'Polygon Tidak Valid!!!',
                text: 'Silakan polygon harus digambar terlebih dahulu.',
            });
            return;
        }

        try {
            const locationPayload = {
                name: searchQuery,
                address: locationAddress,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
                polygon: closedPolygon.map(p => [p.lat, p.lng]),
            };

            // Gabungkan jobdesk per user
            const gudangMap = {};
            selectedGudang.forEach(item => {
                if (!gudangMap[item.userId]) {
                    gudangMap[item.userId] = [];
                }
                gudangMap[item.userId].push(item.jobdesk);
            });

            const gudangPayload = Object.entries(gudangMap).map(([userId, jobdeskNames]) => {
                const emp = karyawanData.find(e => e._id === userId);
                const eventGudang = event?.gudang?.find(g => g.user_id._id === userId);
                // Gabungkan semua sumber jobdesk (karyawan + event existing) supaya tidak hilang jika tidak ter-select di UI sekarang
                const sourceJobdesks = [
                    ...(Array.isArray(emp?.jobdesk) ? emp.jobdesk : []),
                    ...(Array.isArray(eventGudang?.jobdesk) ? eventGudang.jobdesk : [])
                ];
                const uniqueJobdeskMap = new Map();
                sourceJobdesks.forEach(jd => { if (jd?._id) uniqueJobdeskMap.set(jd._id, jd); });
                // Filter hanya yang kategorinya gudang dan dipilih (jobdeskNames) agar tidak kirim jobdesk dapur atau lain
                const jdIds = Array.from(uniqueJobdeskMap.values())
                    .filter(jd => jd.category === 'gudang' && jobdeskNames.includes(jd.name))
                    .map(jd => jd._id);
                return { user_id: userId, jobdesk: jdIds, tahap: ['prepare', 'service'] };
            });

            const dapurPayload = dapurList.map(menu => ({
                menu: menu.menu,
                jumlah_porsi: Number(menu.jumlah_porsi),
                penanggung_jawab: menu.penanggung_jawab.map(name => {
                    const emp = karyawanData.find(e => e.name === name);
                    return emp ? {
                        user_id: emp._id,
                        confirmation: 'menunggu'
                    } : null;
                }).filter(Boolean),
                tahap: 'service'
            }));

            const body = {
                name: namaAcara,
                porsi: Number(porsi),
                date_prepare: prepareDate,
                time_start_prepare: prepareStartTime,
                time_end_prepare: prepareEndTime,
                date_service: serviceDate,
                time_start_service: serviceStartTime,
                time_end_service: serviceEndTime,
                supervisor: {
                    id: selectedSupervisorId
                },
                location: locationPayload,
                gudang: gudangPayload,
                dapur: dapurPayload
            };

            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/event/update/${params.id}`,
                body
            );
            const successStatus = response.data.success ? 'true' : 'false';
            router.push(`/direktur/${slug}/events?success=${successStatus}&message=${encodeURIComponent(response.data.message)}`);
        } catch (error) {
            if (error.response) {
                console.log("RESPONSE ERROR:", error.response.data);
            } else if (error.request) {
                console.log("NO RESPONSE RECEIVED:", error.request);
            } else {
                console.log("REQUEST SETUP ERROR:", error.message);
            }
            const errorMessage = error.response?.data?.message || "Terjadi Kesalahan Saat Mengupdate Acara!";
            router.push(`/direktur/${slug}/events?success=false&message=${encodeURIComponent(errorMessage)}`);
        }
    }



    // List unik nama jobdesk gudang (aman jika jobdesk undefined)
    const jdList = Array.from(new Set(
        karyawanData.flatMap(emp =>
            (emp.jobdesk || [])
                .filter(jd => jd && jd.category === 'gudang')
                .map(jd => jd.name)
        )
    )).filter(Boolean);

    // Filter gudang: hanya tampilkan yang available (sudah difilter backend), dan bukan supervisor terpilih
    const filteredGudangData = karyawanData.filter(emp => {
        // Cek status konfirmasi dari event.gudang
        const gudangEvent = event?.gudang?.find(g => g.user_id._id === emp._id);
        const konfirmasi = gudangEvent?.confirmation || 'menunggu';
        return (emp.jobdesk || []).some(jd => jd && jd.category === 'gudang') &&
            emp._id !== selectedSupervisorId &&
            emp.name.toLowerCase().includes(searchGudang.toLowerCase()) &&
            konfirmasi !== 'tidak bisa';
    });

    // Dapur: hanya tampilkan yang available (sudah difilter backend)
    const isDapurKaryawanDisabled = (karyawan, currentStanIndex) => {
        const selectedId = karyawan._id;
        let alasan = null;
        // Cek apakah sudah dipilih di stan lain
        for (let i = 0; i < dapurList.length; i++) {
            if (i !== currentStanIndex) {
                const alreadySelected = dapurList[i].penanggung_jawab.some(name => {
                    const emp = karyawanData.find(e => e.name === name);
                    return emp && emp._id === selectedId;
                });
                if (alreadySelected) {
                    alasan = `sudah dipilih pada stan "${dapurList[i].menu}"`;
                    return { disabled: true, reason: alasan };
                }
            }
        }
        // Cek jika sudah 2 orang di stan ini
        if (
            dapurList[currentStanIndex].penanggung_jawab.length >= 2 &&
            !dapurList[currentStanIndex].penanggung_jawab.includes(karyawan.name)
        ) {
            return { disabled: true, reason: `maksimal 2 orang` };
        }
        return { disabled: false };
    };


    return (
        <form onSubmit={handleSubmit}>
            <div className='space-y-8'>
                <h1 className="text-3xl font-bold">Tambah Acara</h1>
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
                    <span>Waktu Mulai Prepare</span>
                    <input type="time" className="w-full border px-3 py-2 rounded mb-2" value={prepareStartTime} onChange={(e) => setPrepareStartTime(e.target.value)} placeholder='waktu mulai' />
                    <span>Waktu Selesai Prepare</span>
                    <input type="time" className="w-full border px-3 py-2 rounded" value={prepareEndTime} onChange={(e) => setPrepareEndTime(e.target.value)} placeholder='waktu selesai' />
                </div>
                <div>
                    <label className="block mb-2 font-medium">Service</label>
                    <input type="date" className="w-full border px-3 py-2 rounded mb-3" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                    <span>Waktu Mulai Service</span>
                    <input type="time" className="w-full border px-3 py-2 rounded mb-2" value={serviceStartTime} onChange={(e) => setServiceStartTime(e.target.value)} placeholder='waktu mulai' />
                    <span>Waktu Selesai Service</span>
                    <input type="time" className="w-full border px-3 py-2 rounded" value={serviceEndTime} onChange={(e) => setServiceEndTime(e.target.value)} placeholder='waktu selesai' />
                </div>

                {/* Supervisor */}
                <div>
                    <label className="block mb-2 font-medium">Supervisor</label>
                    {event?.supervisor?.confirmation === 'bisa' ? (
                        <select
                            className="w-full border px-3 py-2 rounded bg-gray-100 cursor-not-allowed"
                            value={selectedSupervisor}
                            disabled
                        >
                            <option value={selectedSupervisor}>{selectedSupervisor} (Sudah Konfirmasi Bisa)</option>
                        </select>
                    ) : (
                        <select
                            className="w-full border px-3 py-2 rounded"
                            value={selectedSupervisor}
                            onChange={handleSupervisorChange}
                        >
                            <option value="">-- Silakan pilih supervisor --</option>
                            {karyawanData
                                .filter(emp => emp.is_supervisor_candidate)
                                .map(emp => {
                                    let konfirmasi = 'menunggu';
                                    if (event?.supervisor?.id?._id === emp._id) {
                                        konfirmasi = event.supervisor.confirmation;
                                    }
                                    if (konfirmasi === 'tidak bisa') return null;
                                    return (
                                        <option key={emp._id} value={emp.name}>
                                            {emp.name} {konfirmasi === 'bisa' ? '(Sudah Konfirmasi Bisa)' : ''}
                                        </option>
                                    );
                                })}
                        </select>
                    )}
                </div>

                {/* Gudang */}
                <div>
                    <h2 className="text-xl font-semibold mb-2">Pilih Karyawan Gudang</h2>
                    <input
                        type="text"
                        placeholder="Cari karyawan gudang..."
                        className="w-full border px-3 py-2 rounded mb-4"
                        value={searchGudang}
                        onChange={e => setSearchGudang(e.target.value)}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto border p-3 rounded">
                        {jdList.map(jdName => (
                            <div key={jdName}>
                                <span className="block font-semibold mb-1">{jdName}</span>
                                <div className="space-y-1 ml-2">
                                    {filteredGudangData
                                        .filter(emp => (emp.jobdesk || []).some(jd => jd && jd.name === jdName && jd.category === 'gudang'))
                                        .map(emp => {
                                            const gudangEvent = event?.gudang.find(g =>
                                                g.user_id._id === emp._id &&
                                                (g.jobdesk || []).some(j => j && j.name === jdName)
                                            );
                                            const konfirmasi = gudangEvent?.confirmation || 'menunggu';
                                            if (konfirmasi === 'tidak bisa') return null;
                                            const isChecked = selectedGudang.some(item => item.userId === emp._id && item.jobdesk === jdName);
                                            return (
                                                <label key={emp._id + jdName} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 border-2 border-black"
                                                        checked={isChecked}
                                                        onChange={() => handleGudangToggle(emp._id, jdName)}
                                                        disabled={konfirmasi === 'bisa'}
                                                    />
                                                    <span className="truncate">
                                                        {emp.name} {konfirmasi === 'bisa' && '(sudah konfirmasi)'}
                                                    </span>
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
                                            .filter(emp => {
                                                const hasDapurJobdesk = emp.jobdesk?.some(jd => jd.category === 'dapur');
                                                // Pastikan yang sudah ada sebagai penanggung jawab tetap muncul walau tidak punya jobdesk (data minim)
                                                const alreadyInThisMenu = event?.dapur?.[index]?.penanggung_jawab?.some(pj => pj.user_id._id === emp._id && pj.confirmation !== 'tidak bisa');
                                                return hasDapurJobdesk || alreadyInThisMenu;
                                            })
                                            .map(emp => {
                                                // Cari status konfirmasi dapur dari event (per menu)
                                                const dapurEvent = event?.dapur?.[index]?.penanggung_jawab?.find(pj => pj.user_id._id === emp._id);
                                                const konfirmasi = dapurEvent?.confirmation || 'menunggu';
                                                if (konfirmasi === 'tidak bisa') return null;
                                                const disabledInfo = isDapurKaryawanDisabled(emp, index);
                                                const isDisabled = konfirmasi === 'bisa' || disabledInfo.disabled;
                                                return (
                                                    <div key={emp._id} className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`dapur-${index}-${emp._id}`}
                                                            checked={menu.penanggung_jawab.includes(emp.name)}
                                                            disabled={isDisabled}
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
                                                            className={`h-4 w-4 border-2 ${isDisabled ? "border-gray-400 bg-gray-200 cursor-not-allowed" : "border-black"}`}
                                                        />
                                                        <label
                                                            htmlFor={`dapur-${index}-${emp._id}`}
                                                            className={`text-sm ${isDisabled ? "text-gray-400" : ""}`}
                                                        >
                                                            {emp.name}
                                                            {konfirmasi === 'bisa' && (
                                                                <span className="ml-2 text-xs text-gray-500 italic">– sudah konfirmasi bisa</span>
                                                            )}
                                                            {disabledInfo.disabled && (
                                                                <span className="ml-2 text-xs text-gray-500 italic">– {disabledInfo.reason}</span>
                                                            )}
                                                        </label>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </div>
                                <button type="button" onClick={() => handleRemoveMenu(index)} className="mt-3 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700">Hapus Menu</button>
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
                </div>
                {event && (
                    <MapContainer
                        center={[event.location.latitude, event.location.longitude]}
                        zoom={20}
                        style={{ height: "400px", width: "100%" }}
                        ref={mapRef}
                        whenCreated={(mapInstance) => {
                            mapRef.current = mapInstance;
                            mapInstance.setView([event.location.latitude, event.location.longitude], 16);
                        }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {event.location.latitude && event.location.longitude && (
                            <Marker position={[event.location.latitude, event.location.longitude]} icon={costumIcon} />
                        )}
                        <MapClickHandler
                            isDrawing={isDrawing}
                            addPoint={addPoint}
                            handleReverseGeocode={handleReverseGeocode}
                        />
                        {polygon.length > 0 && <Polygon positions={polygon} pathOptions={{ color: "blue" }} />}
                    </MapContainer>
                )}
                <div className="flex justify-end gap-3">
                    <button type='submit' onClick={handleSubmit} className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">SUBMIT</button>
                    <Link href={`/direktur/${slug}/events`} className="bg-slate-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-slate-700">
                        KEMBALI
                    </Link>
                </div>
            </div>
        </form>
    )
}
