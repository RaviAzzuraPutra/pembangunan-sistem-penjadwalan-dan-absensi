"use client"

import { useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function useLocationMonitoring({ eventInfo, userId, setStatus }) {
    const watchIdRef = useRef(null);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const lastSendTimeRef = useRef(0);

    useEffect(() => {
        if (!eventInfo || eventInfo.status !== "berlangsung") return;

        // 1. Validasi apakah hari ini sama dengan tanggal service
        const serviceDate = new Date(eventInfo.date_service);
        const today = new Date();
        const isSameDate = serviceDate.toDateString() === today.toDateString();

        if (!isSameDate) {
            console.log("⛔ Monitoring tidak aktif karena bukan tanggal service");
            return;
        }

        // 2. Validasi waktu mulai service
        const timeStart = eventInfo.time_start_service.split(":");
        const startTime = new Date(serviceDate);
        startTime.setHours(Number(timeStart[0]), Number(timeStart[1]));

        const now = new Date();
        if (now < startTime) {
            console.log("⛔ Monitoring belum dimulai, menunggu waktu service");
            return;
        }

        // 3. Polygon area
        const polygon = turf.polygon([
            [...eventInfo.location.polygon.map(([lat, lng]) => [lng, lat])]
        ]);

        console.log("✅ Memulai Monitoring Lokasi");

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude, accuracy, speed } = position.coords;

                const isFakeGPS =
                    accuracy < 5 || accuracy > 500 || (speed !== null && speed > 2);

                if (isFakeGPS) {
                    console.warn("🚨 Diduga Fake GPS aktif! Monitoring dibatalkan.");
                    if (setStatus) setStatus("fake");
                    return;
                }

                const point = turf.point([longitude, latitude]);
                const isInside = turf.booleanPointInPolygon(point, polygon);

                if (setStatus) {
                    setStatus(isInside ? "inside" : "outside");
                }

                if (!isInside) {
                    const now = Date.now();
                    if (now - lastSendTimeRef.current < 1000 * 60) {
                        // throttle 1 menit
                        console.log("⏱️ Throttle: menunggu sebelum kirim ulang");
                        return;
                    }

                    try {
                        await axios.post(`${BACKEND_URL}/attendance/out-of-bounds`, {
                            user_id: userId,
                            event_id: eventInfo._id,
                            location: { latitude, longitude },
                            note: "Keluar dari area kerja",
                        });
                        lastSendTimeRef.current = now;
                        console.log("📡 Monitoring dikirim ke backend");
                    } catch (err) {
                        console.error("❌ Gagal kirim monitoring:", err);
                    }
                }
            },
            (error) => {
                console.error("❌ Geolocation error:", error);
                if (error.code === 1) alert("Akses lokasi ditolak.");
                else if (error.code === 2) alert("Lokasi tidak tersedia.");
                else if (error.code === 3) alert("Timeout saat mengambil lokasi.");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                console.log("🛑 Monitoring dihentikan");
            }
        };
    }, [eventInfo, userId, setStatus]);
}