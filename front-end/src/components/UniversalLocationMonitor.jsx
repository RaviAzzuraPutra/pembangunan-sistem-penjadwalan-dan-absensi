"use client";
import { useEffect, useState } from "react";
import useLocationMonitoring from "../utils/useLocationMonitoring";
import { getUserSession } from "../utils/getSession";
import axios from "axios";

export default function UniversalLocationMonitor({ setStatus }) {
    const [eventInfo, setEventInfo] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const session = await getUserSession();
            if (!session?.id) return;
            setUserId(session.id);

            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/active/${session.id}`);
                const data = res.data;

                // ✅ Filter berdasarkan fase aktif (jika perlu)
                if (data.faseAktif === 'prepare' || data.faseAktif === 'service') {
                    setEventInfo(data);
                } else {
                    setEventInfo(null); // di luar jam kerja
                }

            } catch (err) {
                console.warn("Tidak ada event aktif atau error:", err.message);
            }
        };

        fetchData();
    }, []);

    useLocationMonitoring({ eventInfo, userId, setStatus });

    return null;
}
