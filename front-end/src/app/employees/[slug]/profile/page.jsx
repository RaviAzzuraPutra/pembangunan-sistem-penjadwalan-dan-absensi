"use client"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { getUserSession } from "../../../../utils/getSession";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";

export default function Profile() {
    const params = useParams();
    const slug = params.slug;
    const router = useRouter();
    const [user, setUser] = useState(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = await getUserSession();
            if (!currentUser) {
                router.replace("/login");
            } else {
                setUser(currentUser)
            }
        }

        fetchUser();
    }, []);

    useEffect(() => {
        const success = searchParams.get('success');
        const message = searchParams.get('message');

        if (success && message) {
            Swal.fire({
                icon: success === 'true' ? 'success' : 'error',
                title: success === 'true' ? 'Berhasil!!!' : 'Gagal!!!',
                text: decodeURIComponent(message),
            });

            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams]);

    if (!user) {
        return <p className="text-center mt-10">Loading...</p>;
    }

    const handleChangePassword = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Ubah Password',
            html:
                `<div class="flex flex-col items-start text-left text-sm w-full">
                <label for="swal-password" class="mb-1">Password Baru</label>
                <input id="swal-password" type="password" class="swal2-input" placeholder="Password baru" />
                <label for="swal-confirm" class="mt-3 mb-1">Konfirmasi Password</label>
                <input id="swal-confirm" type="password" class="swal2-input" placeholder="Ulangi password" />
            </div>`,
            focusConfirm: false,
            confirmButtonText: "Simpan",
            showCancelButton: true,
            preConfirm: () => {
                const password = document.getElementById('swal-password')?.value;
                const confirm = document.getElementById('swal-confirm')?.value;
                if (!password || !confirm) {
                    Swal.showValidationMessage('Semua kolom wajib diisi');
                    return false;
                }
                if (password !== confirm) {
                    Swal.showValidationMessage('Password tidak cocok');
                    return false;
                }
                return { password };
            },
            customClass: {
                popup: 'w-[95%] max-w-sm'
            }
        });
        if (formValues) {
            try {
                const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/update-self/${slug}`, {
                    password: formValues.password
                });

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!!!',
                        text: response.data.message,
                    });
                }
            } catch (error) {
                console.log("TERJADI KESALAHAN SAAT MENGUBAH PASSWORD", error)
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!!!',
                    text: "Terjadi kesalahan",
                });
            }
        }
    };

    const handleChangePhone = async () => {
        const { value: formValues } = await Swal.fire({
            title: "Ubah No Telepon",
            html:
                `<div class="flex flex-col items-start text-left text-sm w-full">
                <label for="swal-phone" class="mb-1">No Telephone Baru</label>
                <input id="swal-phone" type="text" class="swal2-input" placeholder="Ex. 081234567891" />
            </div>`,
            focusConfirm: false,
            confirmButtonText: "Simpan",
            showCancelButton: true,
            preConfirm: () => {
                const phone = document.getElementById('swal-phone')?.value;
                if (!phone) {
                    Swal.showValidationMessage('No telepon wajib diisi');
                    return false;
                }
                if (!/^0\d{9,13}$/.test(phone)) {
                    Swal.showValidationMessage('Format no telepon tidak valid (contoh: 08xxxx...)');
                    return false;
                }
                return { phone }
            },
            customClass: {
                popup: 'w-[95%] max-w-sm'
            },
        });
        if (formValues) {
            try {
                const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/update-self/${slug}`, {
                    phone: formValues.phone
                });

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!!!',
                        text: response.data.message,
                    });
                }

            } catch (error) {
                console.log("TERJADI KESALAHAN SAAT MENGUBAH NOMOR TELEPON", error)
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!!!',
                    text: "Terjadi kesalahan",
                });
            }
        }
    }

    return (
        <>
            <div className="p-6 space-y-5 h-[80%] overflow-y-auto pt-8">
                <Link href={`/employees/${slug}`}>
                    <div className="flex justify-start mb-5">
                        <Image
                            src="/icons/previous.png"
                            alt="Back Icon"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                    </div>
                </Link>
                <h1 className="text-2xl font-bold text-center">Profile {user.name}</h1>
                <div className="min-h-[80px] shadow-lg  p-4 border-2 border-black space-y-3">
                    <p><span className="font-medium">ID_Login :</span> {user.ID_Login}</p>
                    <p><span className="font-medium">Phone :</span> {user.phone}</p>
                    <p><span className="font-medium">Role :</span> {user.role}</p>
                    <p><span className="font-medium">Supervisor :</span> {user.is_supervisor_candidate ? "Ya" : "Tidak"}</p>
                    <p><span className="font-medium">Data Wajah :</span> {user.face_data ? "✅" : "❌"}</p>
                    <p>
                        <span className="font-medium">Jobdesk :</span>{" "}
                        {Array.isArray(user.jobdesk) && user.jobdesk.length > 0
                            ? user.jobdesk.map((item, index) => (
                                <span key={index}>{item.name}{index < user.jobdesk.length - 1 ? ", " : ""}</span>
                            ))
                            : "Tidak ada"}
                    </p>
                    <hr className="border-1 border-gray-300" />
                    <div className="flex gap-2 justify-between">
                        <button className="bg-amber-500 text-white py-1 px-1 text-sm rounded hover:bg-amber-700" onClick={handleChangePassword}>
                            Ubah Password
                        </button>
                        <button className="bg-pink-500 text-white py-1 px-1 text-sm rounded hover:bg-pink-700" onClick={handleChangePhone}>
                            Ubah No Telepon
                        </button>
                        <Link href={`/employees/${slug}/profile/change-face`} className="bg-emerald-500 text-white py-1 px-1 text-sm rounded text-center hover:bg-emerald-700">
                            Ubah Data Wajah
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}