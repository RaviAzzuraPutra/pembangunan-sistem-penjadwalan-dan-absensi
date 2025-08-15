"use client"
import Link from "next/link"
import Image from "next/image"
import AuthCheck from "../../../utils/authCheck"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import { useEffect, useState } from "react"

export default function Employees() {
    const router = useRouter()
    const params = useParams();
    const slug = params.slug;
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);


    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/event/assigned/${slug}`);
                console.log("Response full:", response.data);
                setEvents(response.data.data);
            } catch (error) {
                console.log("Gagal mengambil data event:", error);
            } finally {
                setLoading(false);
            }
        }

        if (slug) fetchEvents();
    }, [slug]);

    const handleLogout = async () => {
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, {}, {
                withCredentials: true,
            });
            try { localStorage.removeItem('auth_token'); } catch (e) { }
            if (response.data.success) {
                router.replace("/login");
                window.location.replace("/login");
            }
        } catch (error) {
            console.log("Logout failed:", error);
            try { localStorage.removeItem('auth_token'); } catch (e) { }
            router.replace("/login");
            window.location.replace("/login");
        }
    }

    const handleConfirm = async (status, event, kategori, userId, menu) => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/event/confirm/${event._id}`, {
                userId,
                status,
                kategori,
                menu,
            });

            if (status === "tidak bisa") {
                setEvents(events.filter(ev => ev._id !== event._id));
            } else {
                const updatedEvents = events.map(ev => {
                    if (ev._id === event._id) {
                        if (kategori === "Gudang") {
                            ev.gudang = ev.gudang.map(g => {
                                if (g.user_id?.slug === slug) {
                                    g.confirmation = status;
                                }
                                return g;
                            });
                        } else if (kategori === "Dapur") {
                            ev.dapur = ev.dapur.map(d => {
                                if (d.menu === menu) {
                                    d.penanggung_jawab = d.penanggung_jawab.map(pj => {
                                        if (pj.user_id?.slug === slug) {
                                            pj.confirmation = status;
                                        }
                                        return pj;
                                    });
                                }
                                return d;
                            });
                        } else if (kategori === "Supervisor") {
                            ev.supervisor.confirmation = status;
                        }
                    }
                    return ev;
                });
                setEvents(updatedEvents);
            }
        } catch (err) {
            console.log("Gagal konfirmasi:", err);
        }
    };


    return (
        <>
            <AuthCheck />
            <div className="w-full h-screen">
                <div className="relative w-full h-full border-1 bg-white shadow-lg">
                    <div className="relative h-[15%] w-full bg-gradient-to-b from-gray-200 to-gray-500">
                        <Link
                            href={`/employees/${slug}/profile`}
                            className="absolute top-4 right-4 h-12 w-12 rounded-full flex items-center justify-center bg-white 
                        shadow-lg border-2 border-purple-200 hover:bg-purple-50 transition-all duration-300 z-10"
                        >
                            <Image
                                src="/assets/no-photo-profile.jpg"
                                alt="Profile"
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                            />
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center px-5 py-2 text-black"
                            onClick={(e) => { e.preventDefault(); handleLogout(); }}
                        >
                            <Image
                                src="/icons/logout.png"
                                alt="Logout"
                                width={24}
                                height={24}
                                className="w-6 h-6 mr-3"
                            />
                        </Link>
                        <svg
                            className="absolute bottom-0 left-0 w-full h-auto"
                            viewBox="0 0 1440 320"
                            preserveAspectRatio="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                fill="white"
                                d="M0,192L80,186.7C160,181,320,171,480,176C640,181,800,203,960,208C1120,213,1280,203,1360,197.3L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
                            />
                        </svg>
                    </div>

                    <div className="p-6 space-y-5 h-[80%] overflow-y-auto pt-8">
                        <h1 className="text-2xl font-bold text-center">Catering Ny. Soewardono</h1>

                        {loading ? (
                            <p className="text-center">Memuat jadwal...</p>
                        ) : events.length === 0 ? (
                            <p className="text-center font-semibold">Anda belum memiliki jadwal acara</p>
                        ) : (
                            events.filter(event => {
                                const gudang = event.gudang.find(g => g.user_id?.slug === slug);
                                if (gudang?.confirmation === 'tidak bisa') return false;

                                const dapurMenu = event.dapur.find(menu =>
                                    menu.penanggung_jawab.some(pj =>
                                        pj.user_id?.slug === slug && pj.confirmation === 'tidak bisa'
                                    )
                                );
                                if (dapurMenu) return false;

                                const isSupervisor = event.supervisor?.id?.slug === slug;
                                if (isSupervisor && event.supervisor.confirmation === 'tidak bisa') return false;

                                return true;
                            })
                                .map((event) => {
                                    const gudang = event.gudang.find(g => g.user_id?.slug === slug);
                                    const dapurMenu = event.dapur.find(menu =>
                                        menu.penanggung_jawab.some(pj => pj.user_id?.slug === slug)
                                    );
                                    const isSupervisor = event.supervisor?.id?.slug === slug;

                                    let confirmationStatus;
                                    let kategori;
                                    let menu;

                                    if (gudang) {
                                        confirmationStatus = gudang.confirmation;
                                        kategori = "Gudang";
                                    } else if (dapurMenu) {
                                        const pj = dapurMenu.penanggung_jawab.find(pj => pj.user_id?.slug === slug);
                                        confirmationStatus = pj?.confirmation;
                                        kategori = "Dapur";
                                        menu = dapurMenu.menu;
                                    } else if (isSupervisor) {
                                        confirmationStatus = event.supervisor.confirmation;
                                        kategori = "Supervisor";
                                    }




                                    return (
                                        <div key={event._id} className="min-h-[80px] shadow-lg p-4 border-2 border-black space-y-3">
                                            <h2 className="text-lg font-bold">{event.name}</h2>
                                            <hr className="border-1 border-gray-300" />
                                            <p><span className="font-medium">Lokasi:</span> {event.location.name}</p>
                                            <p><span className="font-medium">Tanggal Prepare:</span> {new Date(event.date_prepare).toLocaleDateString()}</p>
                                            <p><span className="font-medium">Tanggal Service:</span> {new Date(event.date_service).toLocaleDateString()}</p>
                                            <p><span className="font-medium">Status:</span> {event.status}</p>

                                            {confirmationStatus === "bisa" ? (
                                                <Link href={`/employees/${slug}/info/${event._id}`}>
                                                    <button className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-700 mt-3">
                                                        INFO
                                                    </button>
                                                </Link>
                                            ) : confirmationStatus === "tidak bisa" ? null : (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-700"
                                                        onClick={() =>
                                                            handleConfirm(
                                                                "bisa",
                                                                event,
                                                                kategori,
                                                                kategori === "Gudang"
                                                                    ? gudang?.user_id?._id
                                                                    : kategori === "Dapur"
                                                                        ? dapurMenu?.penanggung_jawab.find(pj => pj.user_id?.slug === slug)?.user_id?._id
                                                                        : event?.supervisor?.id?._id,
                                                                menu
                                                            )
                                                        }
                                                    >
                                                        Saya Ikut
                                                    </button>
                                                    <button
                                                        className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-700"
                                                        onClick={() =>
                                                            handleConfirm("tidak bisa", event, kategori,
                                                                kategori === "Gudang"
                                                                    ? gudang?.user_id?._id
                                                                    : kategori === "Dapur"
                                                                        ? dapurMenu?.penanggung_jawab.find(pj => pj.user_id?.slug === slug)?.user_id?._id
                                                                        : event?.supervisor?.id?._id,
                                                                menu
                                                            )
                                                        }
                                                    >
                                                        Tidak Bisa
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}