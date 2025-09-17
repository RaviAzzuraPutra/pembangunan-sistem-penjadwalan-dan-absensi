# Membangun Website Sebagai Salah Satu Syarat Untuk Memperoleh Gelar Sarjana (S1).

## 📌 Sistem Penjadwalan & Absensi Karyawan Catering Ny. Soewardono

Proyek ini merupakan implementasi **Progressive Web App (PWA)** untuk mempermudah proses **penjadwalan, absensi, dan monitoring** karyawan pada perusahaan **Catering Ny. Soewardono**.  
Sistem dibangun dengan memanfaatkan **Geolocation (GPS)** dan **Face Recognition (face-api.js)** agar absensi lebih akurat, serta integrasi **WhatsApp Web** untuk notifikasi otomatis.

## ⚡ Fitur Utama
1. **Manajemen Jadwal**
   - Direktur dapat membuat, mengedit, dan membatalkan jadwal acara.
   - Jadwal dikirim otomatis via WhatsApp ke karyawan.

2. **Absensi Karyawan**
   - Verifikasi ganda menggunakan **Geolocation** + **Face Recognition**.
   - Absensi hanya bisa dilakukan di lokasi event yang sudah ditentukan.

3. **Monitoring Area Kerja**
   - Supervisor dapat memantau lokasi karyawan dengan **polygon area (Leaflet.js + Turf.js)**.
   - Push notification jika ada karyawan keluar area tanpa izin.

4. **Notifikasi Otomatis**
   - Notifikasi jadwal baru, perubahan, pembatalan acara.
   - Pengingat absensi & verifikasi wajah berkala.
   - Gagal Karena PWA tidak bisa melakukan tracking lokasi secara penuh di background, sehingga saat aplikasi ditutup atau browser tidak aktif, notifikasi gagal terkirim dan service workers tidak terdaftar pada browser.

5. **Progressive Web App**
   - Bisa diakses melalui browser atau di-install seperti aplikasi mobile.
   - Mendukung push notification walaupun browser sedang tidak aktif.

## 🛠️ Teknologi yang Digunakan
- **Frontend**: [Next.js](https://nextjs.org/)
- **Backend**: [Express.js](https://expressjs.com/), [Node.js](https://nodejs.org/)  
- **Database**: [MongoDB](https://www.mongodb.com/)  
- **API & Library Pendukung**:
    - 🧩Geolokasi ➡️ buat tahu posisi pengguna secara real-time pakai GPS.
    - 🧩Turf.Js ➡️ ngecek apakah posisi karyawan masih ada di dalam area berlangsungnya acara atau diluar area tempat berlangsungnya acara.
    - 🧩Leaflet.Js ➡️ peta interaktif biar bisa gambar lokasi dan area kerja langsung di layer.
    - 🧩Nominatim API ➡️ alat untuk cari alamat atau koordinat dari nama tempat berlangsungnya acara.
    - 🧩Face-Api.Js ➡️ dipakai untuk absensi dengan verifikasi wajah supaya lebih aman dan akurat.
    - 🧩whatsapp-web.Js ➡️ ngirim notifikasi otomatis lewat WhatsApp, jadi info langsung sampai ke karyawan.
- **Testing**: Blackbox Testing, UAT (User Acceptance Test)

## Kesimpulan
**Pada akhirnya, perancangan sistem penjadwalan dan absensi ini menunjukkan bahwa integrasi teknologi berbasis web, geolokasi, dan biometrik bukan sekadar menyelesaikan permasalahan operasional sehari-hari, tetapi juga menegaskan bahwa efisiensi dan akurasi kerja hanya dapat dicapai melalui pendekatan ilmiah yang berlandaskan arsitektur teknologi yang tepat dan berorientasi masa depan.**

## Saran
Sistem yang dibangun masih memerlukan pengembangan lanjutan. Oleh karena itu, beberapa saran berikut dapat menjadi pedoman untuk penyempurnaan perangkat lunak di masa mendatang:
 - 1.	Disarankan untuk mengganti library whatsapp-web.js dengan API resmi yang dapat mengirim pesan otomatis tanpa perlu pemindaian QR code, serta mengganti Nominatim API dengan Google Maps Geocoding API yang memiliki cakupan lokasi lebih luas.
 - 2.	Disarankan untuk menggunakan biometrik sidik jari sebagai validasi absensi dan menambahkan teknologi blockhain berbasis Hyperledger Fabric untuk keamanan.
 - 3.	Disarankan jika ingin mengaktifkan pelacakan lokasi di background, untuk membuat sistem berbasis aplikasi native seperti Android/iOS.
