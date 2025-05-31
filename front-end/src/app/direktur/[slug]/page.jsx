"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalEvents: 0,
        upcomingEvents: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
        },
    });

    useEffect(() => {
        const getDashboardData = async () => {
            try {
                const response = await axios.get("http://localhost:5001/dashboard");
                setStats(response.data.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            };
        }

        getDashboardData();
    }, [])

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <hr />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                <div className="bg-white p-7 rounded-3xl shadow-md border-2 border-gray-400 flex flex-col items-center">
                    <h2 className="text-md font-semibold mb-4 text-center text-blue-500">
                        JUMLAH ACARA
                    </h2>
                    <p className="text-4xl font-bold text-blue-400">{stats.totalEvents}</p>
                </div>

                <div className="bg-white p-7 rounded-3xl shadow-md border-2 border-gray-400 flex flex-col items-center">
                    <h2 className="text-md font-semibold mb-4 text-center text-green-500">
                        JUMLAH ACARA TERDEKAT
                    </h2>
                    <div className="font-bold text-green-400 space-y-1 text-left">
                        <ul className="list-disc list-inside">
                            <li>Acara Hari Ini : {stats.upcomingEvents.today}</li>
                            <li>Acara Minggu Ini : {stats.upcomingEvents.thisWeek}</li>
                            <li>Acara Bulan Ini : {stats.upcomingEvents.thisMonth}</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white p-7 rounded-3xl shadow-md border-2 border-gray-400 flex flex-col items-center">
                    <h2 className="text-md font-semibold mb-4 text-center text-pink-500">
                        JUMLAH KARYAWAN
                    </h2>
                    <p className="text-4xl font-bold text-pink-400">{stats.totalUsers}</p>
                </div>
            </div>

            <div className="bg-white p-7 rounded-3xl shadow-md border-2 border-gray-400">
                <h2 className="text-md font-semibold mb-7 text-left">
                    VISUALISASI
                </h2>

                <div className="space-y-9">
                    <div className="space-y-7">
                        {[
                            { label: "Jumlah Acara", color: "blue", value: stats.totalEvents },
                            { label: "Acara Hari Ini", color: "green", value: stats.upcomingEvents.today },
                            { label: "Acara Minggu Ini", color: "yellow", value: stats.upcomingEvents.thisWeek },
                            { label: "Acara Bulan Ini", color: "purple", value: stats.upcomingEvents.thisMonth },
                            { label: "Jumlah Karyawan", color: "pink", value: stats.totalUsers },
                        ].map((item, idx) => (
                            <div className="space-y-2" key={idx}>
                                <div className="flex justify-between">
                                    <span className="text-black">{item.label}</span>
                                    <span className="font-md">{item.value}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`bg-${item.color}-500 h-2 rounded-full`}
                                        style={{ width: `${Math.min((item.value / 100) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>



        </div>
    )
}