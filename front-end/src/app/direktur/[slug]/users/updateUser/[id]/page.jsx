"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useParams } from 'next/navigation'
import Swal from "sweetalert2"

export default function UpdateUser() {
    const { id, slug } = useParams();  // Mengambil ID pengguna dari URL
    const [jobdesk, setJobdesk] = useState([]);
    const [selectedJobdesk, setSelectedJobdesk] = useState([]);
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        password: "",
        phone: "",
        role: "karyawan",
        is_supervisor_candidate: false,
    });

    useEffect(() => {
        const fetchJobdesk = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/jobdesk`);
                setJobdesk(response.data.data);
            } catch (error) {
                console.log("Terjadi Error Saat Mengambil Data Jobdesk.:", error);
            }
        }
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${id}`);
                const user = response.data.data;
                setFormData({
                    name: user.name,
                    password: "",
                    phone: user.phone,
                    is_supervisor_candidate: user.is_supervisor_candidate,
                    role: "karyawan",
                });
                setSelectedJobdesk(user.jobdesk.map(jd => jd._id));
            } catch (error) {
                console.log("Gagal mengambil data pengguna:", error);
            }
        }
        fetchJobdesk();
        fetchUserData();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox" && name === "is_supervisor_candidate") {
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    }

    const handleJobdeskChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setSelectedJobdesk((prev) => [...prev, value]);
        } else {
            setSelectedJobdesk((prev) => prev.filter((job) => job !== value));
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedJobdesk.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Jobdesk Tidak Dipilih!',
                text: "Anda harus memilih setidaknya satu jobdesk.",
            });
            return;
        }


        if (formData.name.length < 3 || formData.name.length > 50 || formData.name.trim() === "") {
            Swal.fire({
                icon: 'error',
                title: 'Nama Tidak Valid!',
                text: "Nama harus antara 3 dan 50 karakter dan tidak boleh kosong.",
            });
            return;
        }

        try {
            const payload = {
                ...formData,
                jobdesk: selectedJobdesk,
            }

            const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/update-direktur/${id}`, payload);
            console.log("Response:", response.data);
            const successStatus = response.data.success ? 'true' : 'false';
            router.push(`/direktur/${slug}/users?success=${successStatus}&message=${encodeURIComponent(response.data.message)}`);
        } catch (error) {
            console.log("Gagal mengubah pengguna:", error);
            const errorMessage = error.response?.data?.message || "Terjadi Kesalahan Saat Mengubah Pengguna!";
            router.push(`/direktur/${slug}/users?success=false&message=${encodeURIComponent(errorMessage)}`);
        }
    }

    const selectedCategories = jobdesk
        .filter((jd) => selectedJobdesk.includes(jd._id))
        .map((jd) => jd.category);

    const isDapurSelected = selectedCategories.includes("dapur");
    const isGudangSelected = selectedCategories.includes("gudang");

    const isSupervisorDisabled = isDapurSelected;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Update Pengguna</h1>
            <hr />
            <form onSubmit={handleSubmit} className="space-y-5 p-7 rounded-lg shadow-md max-w-lg w-full">
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">Nama</label>
                    <input
                        type="text" className="w-full border px-3 py-2 rounded"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="masukkan nama lengkap"
                    />
                </div>
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">Password</label>
                    <input
                        type="password" className="w-full border px-3 py-2 rounded"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="masukkan password (biarkan kosong jika tidak ingin diubah)"
                    />
                </div>
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">No Telepon</label>
                    <input
                        type="text" className="w-full border px-3 py-2 rounded"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="ex: 081234567890"
                    />
                </div>
                <div>
                    <label htmlFor="" className="block mb-2 font-medium">Apakah Kandidat Supervisor?</label>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="is_supervisor_candidate"
                                name="is_supervisor_candidate"
                                value={formData.is_supervisor_candidate === true}
                                className="h-4 w-4 rounded mr-2 border-2 border-gray-950"
                                checked={formData.is_supervisor_candidate === true}
                                onChange={() => {
                                    const dapurJobdeskIds = jobdesk
                                        .filter(j => j.category === 'dapur')
                                        .map(j => j._id);
                                    const filteredJobdesk = selectedJobdesk
                                        .filter(id => !dapurJobdeskIds.includes(id));
                                    setSelectedJobdesk(filteredJobdesk);
                                    setFormData({ ...formData, is_supervisor_candidate: true });
                                }}
                                disabled={isSupervisorDisabled}
                            />
                            <label htmlFor="listrik" className="ml-2 text-md text-black">
                                Ya
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="is_supervisor_candidate"
                                name="is_supervisor_candidate"
                                value={formData.is_supervisor_candidate === false}
                                className="h-4 w-4 rounded mr-2 border-2 border-gray-950"
                                checked={formData.is_supervisor_candidate === false}
                                onChange={() => setFormData({ ...formData, is_supervisor_candidate: false })}
                            />
                            <label htmlFor="listrik" className="ml-2 text-md text-black">
                                Tidak
                            </label>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block mb-2 font-medium">Jobdesk</label>
                    <div className="w-full border px-3 py-2 rounded">
                        <div className="space-y-2">
                            {jobdesk.map((job) => {
                                const disabled =
                                    (isDapurSelected && job.category === "gudang") ||
                                    (isGudangSelected && job.category === "dapur") ||
                                    (formData.is_supervisor_candidate && job.category === "dapur");
                                const labelClass = disabled ? "text-gray-500" : "text-black";
                                const inputClass = disabled ? "h-4 w-4 rounded mr-2 border-2 border-gray-950 opacity-50 cursor-not-allowed" : "h-4 w-4 rounded mr-2 border-2 border-gray-950";
                                return (
                                    <div className="flex items-center" key={job._id}>
                                        <input
                                            type="checkbox"
                                            id="listrik"
                                            name="jobdesk"
                                            value={job._id}
                                            className={inputClass}
                                            onChange={(e) => {
                                                if (!disabled) {
                                                    return handleJobdeskChange(e);
                                                }
                                            }}
                                            disabled={disabled}
                                            checked={selectedJobdesk.includes(job._id)}
                                        />
                                        <label className={labelClass}>
                                            {job.name} ({job.category})
                                        </label>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-blue-700">SUBMIT</button>
                    <Link href={`/direktur/${slug}/users`} className="bg-slate-500 text-white px-2 py-1 rounded-md shadow-sm hover:bg-slate-700">
                        KEMBALI
                    </Link>
                </div>
            </form>
        </div>
    )
}
