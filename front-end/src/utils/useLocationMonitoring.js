"use client"

import { useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import axios from 'axios';

export default function useLocationMonitoring({ eventInfo, userId, setStatus }) {
    const watchIdRef = useRef(null);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
        if (!eventInfo || eventInfo.status !== "berlangsung") return;

        const serviceDate = new Date(eventInfo.date_service);
        const timeStart = eventInfo.time_start_service.split(":");
        const startTime = new Date(serviceDate);
        startTime.setHours(Number(timeStart[0]), Number(timeStart[1]));

        const now = new Date();
        if (now < startTime) return;

        const polygon = turf.polygon([[...eventInfo.location.polygon.map(([lat, lng]) => [lng, lat])]]);

        console.log("🔍 Menjalankan useLocationMonitoring");
        console.log("Status Event:", eventInfo?.status);
        console.log("Mulai Service:", startTime);
        console.log("Now:", new Date());
        console.log("Polygon:", eventInfo.location.polygon);

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                console.log("📍 Posisi diperbarui:", position);
                const { latitude, longitude } = position.coords;
                const point = turf.point([longitude, latitude]);
                const isInside = turf.booleanPointInPolygon(point, polygon);

                if (setStatus) {
                    setStatus(isInside ? "inside" : "outside");
                }

                if (!isInside) {
                    try {
                        await axios.post(`${BACKEND_URL}/attendance/out-of-bounds`, {
                            user_id: userId,
                            event_id: eventInfo._id,
                            location: { latitude, longitude },
                            note: "Keluar dari area kerja",
                        });
                    } catch (err) {
                        console.error("Monitoring failed:", err);
                    }
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                if (error.code === 1) {
                    alert("Akses lokasi ditolak.");
                } else if (error.code === 2) {
                    console.warn("Posisi tidak tersedia. Coba pindah ke area terbuka.");
                } else if (error.code === 3) {
                    console.warn("Timeout saat mencoba ambil lokasi.");
                }
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
            }
        };
    }, [eventInfo, userId, setStatus]);
}