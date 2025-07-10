"use client";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { getUserSession } from "../utils/getSession";

export default function PeriodicFaceSwal() {
    const [showSwal, setShowSwal] = useState(false);
    const [countdown, setCountdown] = useState(300); // 5 menit = 300 detik
    const [event, setEvent] = useState(null);
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [isVerifying, setIsVerifying] = useState(false);
    const [hasFailed, setHasFailed] = useState(false);
    const timerRef = useRef(null);
    const router = useRouter();
    const params = useParams();
    const slug = params.slug || '';
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        getUserSession().then((user) => {
            if (user && user._id) setUserId(user._id);
        });
    }, []);

    // Ambil lokasi user
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                () => { },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }, []);
    // Ambil event aktif user
    useEffect(() => {
        if (!userId) return;
        axios
            .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/active/${userId}`)
            .then((res) => {
                setEvent(res.data);
            })
            .catch(() => {
                setEvent(null);
            });
    }, [userId]);

    // Timer interval 1 jam
    useEffect(() => {
        const interval = setInterval(() => {
            setShowSwal(true);
            setCountdown(300);
        }, 60 * 60 * 1000); // 1 jam
        // Munculkan swal pertama kali saat mount
        setShowSwal(true);
        setCountdown(300);
        return () => clearInterval(interval);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!showSwal) return;
        if (countdown <= 0) {
            handleFail();
            return;
        }
        timerRef.current = setTimeout(() => {
            setCountdown((c) => c - 1);
        }, 1000);
        return () => clearTimeout(timerRef.current);
        // eslint-disable-next-line
    }, [showSwal, countdown]);

    // Handler jika user tidak verifikasi
    const handleFail = async () => {
        if (hasFailed) return;
        setHasFailed(true);
        setShowSwal(false);
        setCountdown(0);
        if (!event || !event._id || !userId) return;
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/periodic-face-fail`, {
                user_id: userId,
                event_id: event._id,
                location,
                note: "Tidak melakukan verifikasi wajah periodik",
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Gagal!!!",
                text: "Anda tidak melakukan verifikasi wajah periodik dalam waktu yang ditentukan.",
                confirmButtonText: "Tutup",
            });
        }
    };

    // Handler jika user klik verifikasi
    const handleVerify = () => {
        setIsVerifying(true);
        setShowSwal(false);
        // Redirect ke halaman selfie/face-verification
        router.push(`/employees/${slug}/face-verification?id=${event?._id}&lat=${location.latitude}&lng=${location.longitude}`);
    };

    // Tampilkan SWAL jika showSwal true
    useEffect(() => {
        if (!showSwal || !event) return;
        Swal.fire({
            title: "Verifikasi Wajah Periodik",
            html: `<b>Silakan lakukan verifikasi wajah dalam waktu <span id='swal-timer'>${Math.floor(countdown / 60)}:${('0' + (countdown % 60)).slice(-2)}</span> menit</b>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Verifikasi Sekarang",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                const timerInterval = setInterval(() => {
                    const el = document.getElementById('swal-timer');
                    if (el) {
                        el.textContent = `${Math.floor(countdown / 60)}:${('0' + (countdown % 60)).slice(-2)}`;
                    }
                }, 1000);
                Swal.timerInterval = timerInterval;
            },
            willClose: () => {
                clearInterval(Swal.timerInterval);
            },
        }).then((result) => {
            if (result.isConfirmed) {
                handleVerify();
            } else {
                handleFail();
            }
        });
        // eslint-disable-next-line
    }, [showSwal, event, countdown]);

    return null; // Komponen ini tidak render apapun
}
