"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import * as turf from "@turf/turf";
import { getUserSession } from "../../../../../utils/getSession";
import Swal from "sweetalert2";

export default function InfoEventPageEmployees() {
    const { slug, id } = useParams();
    const [eventInfo, setEventInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [insideArea, setInsideArea] = useState(true);
    const [isPrepareTime, setIsPrepareTime] = useState(false);
    const [isServiceTime, setIsServiceTime] = useState(false);
    const [userPosition, setUserPosition] = useState(null);
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = await getUserSession();
            if (!currentUser) {
                router.replace("/login");
            } else {
                setUser(currentUser);
            }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        const fetchEventInfo = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/event/eventInfo/${slug}/info/${id}`);
                setEventInfo(response.data);
                console.log("Event info:", response.data);
                console.log("Polygon lokasi:", response.data?.event?.location?.polygon);
            } catch (error) {
                console.error("Gagal memuat detail acara:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEventInfo();
    }, [slug, id]);

    useEffect(() => {
        if (!eventInfo) return;

        const polygonCoords = eventInfo.event.location.polygon;

        if (!polygonCoords || !Array.isArray(polygonCoords) || polygonCoords.length === 0) {
            setInsideArea(false);
            return;
        }

        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = turf.point([
                        position.coords.latitude,
                        position.coords.longitude
                    ]);

                    const eventPolygon = turf.polygon([polygonCoords]);
                    const isInside = turf.booleanPointInPolygon(userLocation, eventPolygon);
                    setInsideArea(isInside);
                    setUserPosition(position);
                },
                (error) => {
                    switch (error.code) {
                        case 1:
                            Swal.fire({
                                icon: 'error',
                                title: 'Akses lokasi ditolak',
                                text: 'Silakan izinkan akses lokasi agar dapat menggunakan fitur ini.'
                            });
                            break;
                        case 2:
                            Swal.fire({
                                icon: 'error',
                                title: 'Lokasi tidak tersedia',
                                text: 'Pastikan GPS Anda aktif.'
                            });
                            break;
                        case 3:
                            Swal.fire({
                                icon: 'warning',
                                title: 'Waktu habis!',
                                text: 'Permintaan lokasi melebihi batas waktu. Anda akan dialihkan kembali.',
                                timer: 3000,
                                timerProgressBar: true,
                                showConfirmButton: false
                            }).then(() => {
                                router.push(`/employees/${slug}`);
                            });
                            router.push(`/employees/${slug}`);
                            break;
                        default:
                            Swal.fire({
                                icon: 'error',
                                title: 'Kesalahan',
                                text: 'Terjadi kesalahan saat mengambil lokasi.'
                            });
                    }
                    console.error("Geolocation error:", error);
                    setInsideArea(false);
                },
                geoOptions
            );
        } else {
            alert("Geolocation tidak didukung oleh browser ini.");
            setInsideArea(false);
        }
    }, [eventInfo]);

    useEffect(() => {
        if (!eventInfo) return;

        const checkAbsenceTime = () => {
            const now = new Date();

            const prepareStart = new Date(`${event.date_prepare.split("T")[0]}T${event.time_start_prepare}:00`);
            const prepareEnd = new Date(`${event.date_prepare.split("T")[0]}T${event.time_end_prepare}:00`);


            const serviceStart = new Date(`${event.date_service.split("T")[0]}T${event.time_start_service}:00`);
            const serviceEnd = new Date(`${event.date_service.split("T")[0]}T${event.time_end_service}:00`);


            setIsPrepareTime(now >= prepareStart && now <= prepareEnd);
            setIsServiceTime(now >= serviceStart && now <= serviceEnd);
        };

        checkAbsenceTime();
    }, [eventInfo]);

    const handleAbsensi = (tahap) => {
        if (!user?.face_data || user.face_data.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Data Wajah Tidak Ditemukan",
                text: "Anda belum memiliki data wajah. Silakan daftar wajah terlebih dahulu sebelum melakukan absensi.",
            });
            return;
        }

        if (!userPosition) {
            Swal.fire({
                icon: "error",
                title: "Lokasi Tidak Terdeteksi",
                text: "Pastikan Anda sudah mengaktifkan GPS.",
            });
            return;
        }

        router.push(`/employees/${slug}/info/${id}/attendance/${tahap}?lat=${userPosition.coords.latitude}&lng=${userPosition.coords.longitude}`);
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg font-semibold">Memuat data...</p>
            </div>
        );
    }

    if (!eventInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg font-semibold text-red-600">Data acara tidak ditemukan</p>
            </div>
        );
    }

    const { event, role, participants } = eventInfo;

    return (
        <div className="min-h-screen p-5 space-y-7">
            <Link href={`/employees/${slug}`}>
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
            <h1 className="text-2xl font-bold text-center">{event?.name}</h1>
            <hr className="border-1 border-gray-300" />
            <div className="shadow-lg p-4 space-y-4 border-2 border-black overflow-auto max-h-[80vh] sm:max-h-[90vh]">

                <div className="space-y-3 text-sm sm:text-base">
                    <p><span className="font-semibold">Tanggal Prepare:</span> {new Date(event.date_prepare).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Jam Prepare:</span> {event.time_start_prepare} - {event.time_end_prepare}</p>
                    <p><span className="font-semibold">Tanggal Service:</span> {new Date(event.date_service).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Jam Service:</span> {event.time_start_service} - {event.time_end_service}</p>
                    <p><span className="font-semibold">Lokasi:</span> {event.location?.name}</p>
                    <p><span className="font-semibold">Status:</span> {event.status}</p>
                </div>

                <div className="border p-3 rounded-md bg-white shadow-inner mt-4">
                    <h2 className="font-semibold mb-2">Status Absensi:</h2>
                    <p>Prepare: {eventInfo.attendanceStatus.prepare ? '✅' : '❌'}</p>
                    <p>Service: {eventInfo.attendanceStatus.service ? '✅' : '❌'}</p>
                </div>

                <div>
                    <h2 className="font-semibold mb-3">Daftar Karyawan Yang Mengikuti Acara</h2>
                    <div className="max-h-64 overflow-y-auto border p-3 rounded-md bg-white shadow-inner">
                        <ul className="space-y-3">
                            {participants.map((p, index) => (
                                <li key={index} className="border p-2 rounded-md bg-gray-50">
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-sm text-gray-600">Jobdesk: {p.jobdesk}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {insideArea ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
                        {userPosition && (role === 'gudang' || role === 'supervisor') && (
                            <button
                                onClick={() => handleAbsensi("prepare")}
                                className={`w-full px-2 py-1 rounded-md shadow-sm mt-3 ${isPrepareTime ? "bg-violet-500 hover:bg-violet-700 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
                                disabled={eventInfo.attendanceStatus.prepare || !isPrepareTime}
                            >
                                ABSEN PREPARE
                            </button>
                        )}
                        {userPosition && (role === 'gudang' || role === 'dapur' || role === 'supervisor') && (
                            <button
                                onClick={() => handleAbsensi("service")}
                                className={`w-full px-2 py-1 rounded-md shadow-sm mt-3 ${isServiceTime ? "bg-pink-500 hover:bg-pink-700 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
                                disabled={eventInfo.attendanceStatus.service || !isServiceTime}
                            >
                                ABSEN SERVICE
                            </button>

                        )}
                        {role === 'supervisor' && (
                            <Link href={`/employees/${slug}/info/${id}/monitoring`}>
                                <button className="w-full bg-yellow-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-yellow-700 mt-3">
                                    MONITORING
                                </button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <p className="text-red-600 font-semibold pt-5">Anda berada di luar area acara. Absensi dan monitoring tidak tersedia.</p>
                )}

            </div>
        </div >
    );
}