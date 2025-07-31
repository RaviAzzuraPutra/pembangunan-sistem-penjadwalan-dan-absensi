"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter, useParams } from "next/navigation"
import Swal from "sweetalert2"

export default function UpdateUser() {
    const { id, slug } = useParams();
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
                // Urutkan agar "jaga stan" selalu di atas
                const sortedJobdesk = response.data.data.sort((a, b) => {
                    if (a.category === "jaga stan") return -1;
                    if (b.category === "jaga stan") return 1;
                    return 0;
                });
                setJobdesk(sortedJobdesk);
            } catch (error) {
                console.log("Terjadi Error Saat Mengambil Data Jobdesk:", error);
            }
        };

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
        };

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
    };

    const handleJobdeskChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setSelectedJobdesk((prev) => [...prev, value]);
        } else {
            setSelectedJobdesk((prev) => prev.filter((job) => job !== value));
        }
    };

    // Ambil kategori dari jobdesk yang dipilih
    const selectedCategories = jobdesk
        .filter((jd) => selectedJobdesk.includes(jd._id))
        .map((jd) => jd.category);

    const isDapurSelected = selectedCategories.includes("dapur");
    const isGudangSelected = selectedCategories.includes("gudang");
    const isJagaStanSelected = selectedCategories.includes("jaga stan");

    // Disable kandidat supervisor jika dapur atau jaga stan dipilih
    const isSupervisorDisabled = isDapurSelected || isJagaStanSelected;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.name.length < 3 || formData.name.trim() === "") {
            Swal.fire({ icon: 'error', title: 'Nama Tidak Valid!!!', text: "Nama harus 3 karakter dan tidak boleh kosong." });
            return;
        }

        if (selectedJobdesk.length === 0) {
            Swal.fire({ icon: 'error', title: 'Jobdesk Tidak Dipilih!!!', text: "Anda harus memilih setidaknya satu jobdesk." });
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

        try {
            const payload = { ...formData, jobdesk: selectedJobdesk };
            const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/update-direktur/${id}`, payload);
            const successStatus = response.data.success ? 'true' : 'false';
            router.push(`/direktur/${slug}/users?success=${successStatus}&message=${encodeURIComponent(response.data.message)}`);
        } catch (error) {
            console.log("Gagal mengubah pengguna:", error);
            const errorMessage = error.response?.data?.message || "Terjadi Kesalahan Saat Mengubah Pengguna!";
            router.push(`/direktur/${slug}/users?success=false&message=${encodeURIComponent(errorMessage)}`);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Update Pengguna</h1>
            <hr />
            <form onSubmit={handleSubmit} className="space-y-5 p-7 rounded-lg shadow-md max-w-lg w-full">
                {/* Nama */}
                <div>
                    <label className="block mb-2 font-medium">Nama</label>
                    <input type="text" className="w-full border px-3 py-2 rounded"
                        name="name" value={formData.name} onChange={handleInputChange}
                        placeholder="masukkan nama lengkap" />
                </div>

                {/* Password */}
                <div>
                    <label className="block mb-2 font-medium">Password</label>
                    <input type="password" className="w-full border px-3 py-2 rounded"
                        name="password" value={formData.password} onChange={handleInputChange}
                        placeholder="kosongkan jika tidak ingin mengubah password" />
                </div>

                {/* No Telepon */}
                <div>
                    <label className="block mb-2 font-medium">No Telepon</label>
                    <input type="text" className="w-full border px-3 py-2 rounded"
                        name="phone" value={formData.phone} onChange={handleInputChange}
                        placeholder="ex: 081234567890" />
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
                                onChange={() => setFormData({ ...formData, is_supervisor_candidate: false })} />
                            <label className="text-black">Tidak</label>
                        </div>
                    </div>
                </div>

                {/* Jobdesk */}
                <div>
                    <label className="block mb-2 font-medium">Jobdesk</label>
                    <div className="w-full border px-3 py-2 rounded">
                        <div className="space-y-2">
                            {jobdesk.map((job) => {
                                const disabled =
                                    (isJagaStanSelected && job.category !== "jaga stan") || // Jika jaga stan dipilih, lainnya disable
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
