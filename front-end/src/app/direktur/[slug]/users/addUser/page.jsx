"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import Swal from "sweetalert2"

export default function AddUser() {
    const params = useParams();
    const [jobdesk, setJobdesk] = useState([]);
    const [selectedJobdesk, setSelectedJobdesk] = useState([]);
    const slug = params.slug;
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
                // Urutkan agar "jaga stan" di paling atas
                const sortedJobdesk = response.data.data.sort((a, b) => {
                    if (a.category === "jaga stan") return -1;
                    if (b.category === "jaga stan") return 1;
                    return 0;
                });
                setJobdesk(sortedJobdesk);
            } catch (error) {
                console.error(error);
            }
        }
        fetchJobdesk();
    }, []);

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

    const selectedCategories = jobdesk
        .filter((jd) => selectedJobdesk.includes(jd._id))
        .map((jd) => jd.category);

    const isDapurSelected = selectedCategories.includes("dapur");
    const isGudangSelected = selectedCategories.includes("gudang");
    const isJagaStanSelected = selectedCategories.includes("jaga stan");

    // Supervisor disabled jika dapur atau jaga stan dipilih
    const isSupervisorDisabled = isDapurSelected || isJagaStanSelected;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.name.length < 3 || formData.name.trim() === "") {
            Swal.fire({ icon: 'error', title: 'Nama Tidak Valid!!!!', text: "Nama harus 3 karakter dan tidak boleh kosong." });
            return;
        }

        if (!formData.password || formData.password.trim() === "" || formData.password.length < 8) {
            Swal.fire({ icon: 'error', title: 'Password Tidak Valid!!!', text: "Password minimal harus 8 karakter." });
            return;
        }

        if (!formData.phone || formData.phone.trim() === "") {
            Swal.fire({ icon: 'error', title: 'Nomor Telepon Tidak Valid!!!', text: "Nomor telepon tidak boleh kosong." });
            return;
        }

        const phoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;
        if (!phoneRegex.test(formData.phone)) {
            Swal.fire({ icon: 'error', title: 'Nomor Telepon Tidak Valid!!!', text: "Nomor telepon harus diawali dengan 62, dan diikuti oleh 8 digit angka." });
            return;
        }

        if (selectedJobdesk.length === 0) {
            Swal.fire({ icon: 'error', title: 'Jobdesk Tidak Dipilih!!!', text: "Anda harus memilih setidaknya satu jobdesk." });
            return;
        }

        try {
            const payload = { ...formData, jobdesk: selectedJobdesk };
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/create`, payload);
            const successStatus = response.data.success ? 'true' : 'false';
            router.push(`/direktur/${slug}/users?success=${successStatus}&message=${encodeURIComponent(response.data.message)}`);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Terjadi Kesalahan Saat Menambahkan Pengguna!";
            router.push(`/direktur/${slug}/users?success=false&message=${encodeURIComponent(errorMessage)}`);
        }
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Tambah Pengguna</h1>
            <hr />
            <form onSubmit={handleSubmit} className="space-y-5 p-7 rounded-lg shadow-md max-w-lg w-full">
                {/* Input Nama */}
                <div>
                    <label className="block mb-2 font-medium">Nama</label>
                    <input type="text" className="w-full border px-3 py-2 rounded"
                        name="name" value={formData.name} onChange={handleInputChange} placeholder="masukkan nama lengkap" />
                </div>

                {/* Input Password */}
                <div>
                    <label className="block mb-2 font-medium">Password</label>
                    <input type="password" className="w-full border px-3 py-2 rounded"
                        name="password" value={formData.password} onChange={handleInputChange} placeholder="masukkan password" />
                </div>

                {/* Input No Telepon */}
                <div>
                    <label className="block mb-2 font-medium">No Telepon</label>
                    <input type="text" className="w-full border px-3 py-2 rounded"
                        name="phone" value={formData.phone} onChange={handleInputChange} placeholder="ex: 081234567890" />
                </div>

                {/* Kandidat Supervisor */}
                <div>
                    <label className="block mb-2 font-medium">Apakah Kandidat Supervisor?</label>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <input type="radio" name="is_supervisor_candidate"
                                className="h-4 w-4 mr-2 border-2 border-gray-950"
                                checked={formData.is_supervisor_candidate === true}
                                onChange={() => setFormData({ ...formData, is_supervisor_candidate: true })}
                                disabled={isSupervisorDisabled} />
                            <label className={isSupervisorDisabled ? "text-gray-500" : "text-black"}>Ya</label>
                        </div>
                        <div className="flex items-center">
                            <input type="radio" name="is_supervisor_candidate"
                                className="h-4 w-4 mr-2 border-2 border-gray-950"
                                checked={formData.is_supervisor_candidate === false}
                                onChange={() => setFormData({ ...formData, is_supervisor_candidate: false })}
                            />
                            <label className="text-black">Tidak</label>
                        </div>
                    </div>
                </div>

                {/* Pilihan Jobdesk */}
                <div>
                    <label className="block mb-2 font-medium">Jobdesk</label>
                    <div className="w-full border px-3 py-2 rounded">
                        <div className="space-y-2">
                            {jobdesk.map((job) => {
                                const disabled =
                                    (isJagaStanSelected && job.category !== "jaga stan") || // Disable semua selain jaga stan jika jaga stan dipilih
                                    (isDapurSelected && job.category === "gudang") ||
                                    (isGudangSelected && job.category === "dapur") ||
                                    (formData.is_supervisor_candidate && job.category === "dapur");

                                return (
                                    <div className="flex items-center" key={job._id}>
                                        <input type="checkbox" value={job._id}
                                            className={`h-4 w-4 rounded mr-2 border-2 border-gray-950 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                            onChange={(e) => !disabled && handleJobdeskChange(e)}
                                            disabled={disabled}
                                            checked={selectedJobdesk.includes(job._id)} />
                                        <label className={disabled ? "text-gray-500" : "text-black"}>
                                            {job.name} ({job.category})
                                        </label>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Tombol */}
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
