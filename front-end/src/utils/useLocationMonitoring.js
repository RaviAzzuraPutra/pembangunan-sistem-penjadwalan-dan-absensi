"use client";
import { useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import axios from 'axios';

export default function useLocationMonitoring({ eventInfo, userId, setStatus }) {
    const watchIdRef = useRef(null);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const lastSendRef = useRef(0);

    useEffect(() => {
        if (!eventInfo || eventInfo.status !== "berlangsung") return;

        function getRole(event, uid) {
            if (event.gudang?.some(g => g.user_id?.toString() === uid)) return "gudang";
            if (event.dapur?.some(d => d.penanggung_jawab?.some(pj => pj.user_id?.toString() === uid))) return "dapur";
            return "lain";
        }

        const role = getRole(eventInfo, userId);
        const phase = role === "gudang" ? "prepare" : "service";
        if (phase === "prepare" && !eventInfo.attendanceStatus?.prepare) return;
        if (phase === "service" && !eventInfo.attendanceStatus?.service) return;
        const date = phase === "prepare" ? eventInfo.date_prepare : eventInfo.date_service;
        const [h, m] = (phase === "prepare" ? eventInfo.time_start_prepare : eventInfo.time_start_service).split(":");

        const phaseStart = new Date(date);
        phaseStart.setHours(+h, +m);
        if (new Date() < phaseStart) return;


        if (!eventInfo.location?.polygon?.length) {
            console.log("Polygon tidak tersedia atau kosong.");
            return;
        }

        const polygon = turf.polygon([
            [...eventInfo.location.polygon.map(([lat, lng]) => [lng, lat])]
        ]);

        if (!navigator.geolocation) {
            console.log("Geolocation tidak didukung oleh browser.");
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
                const { latitude, longitude, accuracy, speed } = pos.coords;
                const isFake = accuracy < 5 || accuracy > 500 || (speed !== null && speed > 2);

                if (isFake) {
                    setStatus?.("fake");
                    return;
                }

                const point = turf.point([longitude, latitude]);
                const isInside = turf.booleanPointInPolygon(point, polygon);
                setStatus?.(isInside ? "inside" : "outside");

                if (!isInside && Date.now() - lastSendRef.current > 60 * 1000) {
                    lastSendRef.current = Date.now();

                    try {
                        await axios.post(`${BACKEND_URL}/attendance/out-of-bounds`, {
                            user_id: userId,
                            event_id: eventInfo._id,
                            location: { latitude, longitude },
                            note: "Keluar dari area kerja"
                        });
                    } catch (err) {
                        console.log("Gagal kirim monitoring:", err);
                    }
                }
            },
            (err) => {
                console.log("Geolocation error:", err);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [eventInfo, userId, setStatus]);
}
