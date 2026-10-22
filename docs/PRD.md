# PRD

Versi terbaru, menggantikan semua PRD sebelumnya.

## Latar belakang

SMKIT As Syifa Boarding School di Jalancagak, Subang, adalah sekolah khusus putra dengan dua jurusan yang ditonjolkan, yaitu RPL dan DKV. Saat ini ada 24 pendaftar dari kuota 100. Targetnya 60 pendaftar. Sekolah mengadakan open house awal November 2026 untuk memperkenalkan sekolah dan menjaring pendaftar baru.

Pengunjung datang dari postingan Instagram, iklan Meta, dan tautan di bio akun sekolah. Aplikasi ini adalah halaman tujuan dan form pendaftaran hadir sebelum acara.

## Fakta acara

1. Waktu: awal November 2026, tanggal pasti belum final. Jam 08.00 sampai 15.00 WIB.
2. Tempat: di sekolah, offline saja. Gratis. Diadakan satu kali.
3. Rangkaian: pemaparan jurusan RPL dan DKV di aula, melihat kelas dan lab, mencoba langsung di lab atau kelas, tour asrama, dan konsultasi. Rundown lengkap belum ada.
4. Target hadir: sekitar 50 calon siswa, ditambah orang tua dan saudara.
5. Pendaftaran di tempat pada hari H memakai Google Form terpisah. Itu di luar aplikasi ini.
6. Insentif biaya pendaftaran seleksi: normal Rp500 ribu. Mendaftar langsung saat open house Rp100 ribu. Hadir tetapi mendaftar belakangan Rp300 ribu. Teks insentif perlu persetujuan sekolah sebelum tayang.

## Tujuan

1. Mengubah klik dari Instagram dan iklan menjadi pendaftar hadir sebanyak mungkin.
2. Mengumpulkan data seperlunya agar panitia bisa menghubungi lewat WhatsApp.
3. Memberi kesan pertama yang menyenangkan, tepercaya, dan khas sekolah.
4. Mengetahui sumber kunjungan mana yang menghasilkan pendaftar.

## Pengguna dan akses

Hanya ada dua jenis pengguna.

1. Peserta, yaitu orang tua, wali, calon siswa, atau pengunjung lain. Tidak login, tidak punya akun, dan hanya bisa membuka halaman publik dan mengirim form. Peserta tidak pernah bisa membaca data apa pun dari sistem.
2. Admin. Satu satunya yang punya akun. Akun dibuat lewat undangan oleh pengelola. Pendaftaran akun publik dimatikan. Admin bisa melihat, mencari, memfilter, mengubah status, mencatat, membagi penanggung jawab, dan mengekspor CSV.

Pegawai sekolah yang menindaklanjuti lewat WhatsApp pribadi tidak punya akun. Mereka menerima daftar bagian masing masing dari admin lewat ekspor CSV yang difilter.

## Perjalanan peserta

1. Mengetuk tautan dari bio atau konten Instagram.
2. Membuka halaman utama. Tidak langsung form. Halaman ini memberi teaser pengalaman acara dan detail acara.
3. Menekan tombol Daftar Hadir Open House, yang membawa ke bagian form di halaman yang sama.
4. Mengisi form dua langkah.
5. Mengirim. Berpindah ke halaman terima kasih.
6. Di halaman terima kasih:
   - Menampilkan ringkasan pendaftaran beserta QR Code Tiket Masuk unik (dibuat instan di browser tanpa Cloudinary).
   - Tombol simpan/unduh gambar tiket QR ke galeri ponsel.
   - Tombol kirim tiket dan konfirmasi ke WhatsApp pribadi.
   - Tombol bergabung ke WhatsApp open house, menambah acara ke kalender, dan menghubungi admisi.

## Perjalanan admin

1. Membuka halaman admin dan login.
2. Melihat daftar pendaftar terbaru, jumlah total, dan jumlah per sumber kunjungan.
3. Tab/Fitur Pemindai QR (Scan Presensi) menggunakan kamera ponsel/laptop untuk verifikasi kehadiran peserta di meja registrasi hari-H.
4. Melihat rekapitulasi riwayat kehadiran (sudah hadir vs belum hadir/tidak hadir).
5. Mencari atau memfilter berdasarkan status kehadiran, status tindak lanjut, dan penanggung jawab.
6. Membuka satu pendaftar, menekan tombol chat WhatsApp dengan pesan yang sudah terisi, lalu mengirim dari aplikasi WhatsApp.
7. Mengubah status, menulis catatan, dan mengisi nama penanggung jawab.
8. Mengekspor CSV, termasuk hasil filter dan status kehadiran (beserta waktu check-in).

## Data yang dikumpulkan

Wajib diisi peserta: nama anak, nomor HP orang tua, jumlah yang akan hadir, asal kota atau kabupaten, asal sekolah, dan persetujuan dihubungi lewat WhatsApp.

Opsional, nilai bawaan boleh dihapus pemilik proyek: nama orang tua atau wali, dan minat jurusan dengan pilihan RPL, DKV, atau belum tahu.

Tercatat otomatis: waktu kirim, kode tiket pendaftaran, waktu kehadiran (check-in saat scan hari-H), UTM, kode klik Meta, halaman asal, dan jenis perangkat.

Tidak diminta sama sekali: NIK, alamat lengkap, email, penghasilan, data kesehatan, dan foto.

## Ruang lingkup

Masuk: halaman utama bercerita, rundown acara, embed lokasi peta, form dua langkah, halaman terima kasih dengan QR code tiket dan kirim WA, fitur scan QR check-in & riwayat kehadiran di admin, halaman privasi, admin sederhana, penangkapan UTM, dan Pixel Meta opsional yang hanya mengirim event pendaftaran selesai.

Tidak masuk: object storage Cloudinary (QR di-generate di browser sebagai teks/SVG), nama anggota keluarga selain anak, pilihan sesi jam terpisah, umpan balik kuesioner, Conversions API, login akun untuk peserta. Pengaturan acara berada di berkas konfigurasi kode.

## Ukuran keberhasilan

1. Jumlah pendaftar hadir mendekati 50 calon siswa.
2. Lebih dari 60 persen yang mulai mengisi form sampai mengirim.
3. LCP di bawah 2,5 detik pada HP kelas menengah dengan 4G.
4. Setiap pendaftar punya sumber kunjungan yang tercatat.

## Nilai bawaan yang dipakai sampai ada keputusan lain

1. Nama orang tua dan minat jurusan ada di form sebagai kolom opsional.
2. Tautan WhatsApp setelah daftar bisa berupa grup atau saluran, diatur di konfigurasi. Jika grup, halaman terima kasih menampilkan peringatan bahwa nomor terlihat oleh anggota lain.
3. Jumlah yang hadir dipilih 1 sampai 10, bawaan 2.
4. Tanggal acara, alamat, nomor admisi, dan tautan WhatsApp ditulis sebagai teks pengganti di konfigurasi sampai diisi pemilik proyek.
5. Hosting di Cloudflare Pages dengan alamat pages.dev. Pindah ke subdomain sekolah dilakukan belakangan tanpa mengubah kode.
