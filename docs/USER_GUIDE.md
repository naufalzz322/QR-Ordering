# Panduan Pengguna - QR Ordering System

## 📋 Daftar Isi

1. [Cara Kerja Sistem](#1-cara-kerja-sistem)
2. [Menu Digital (HP Tamu)](#2-menu-digital-hp-tamu)
3. [Admin Panel](#3-admin-panel)
4. [Kitchen Display System (KDS)](#4-kitchen-display-system-kds)
5. [Demo Guide](#5-demo-guide)
6. [Tips & Troubleshooting](#6-tips--troubleshooting)

---

## 1. Cara Kerja Sistem

### Alur Pemesanan

```
Tamu Scan QR → Pilih Menu → Tambah ke Keranjang → Bayar → Dapur Terima → Tamu Pantau → Pesanan Selesai
```

### Komponen Sistem

| Komponen | Fungsi | Akses |
|----------|--------|-------|
| Menu Digital | Tamu pesan via HP | Scan QR di meja |
| Admin Panel | Kelola menu, meja, laporan | /admin |
| Kitchen Display | dapur terima & proses order | /kitchen/[outlet] |
| Demo Guide | Tutorial sistem | /admin/demo |

---

## 2. Menu Digital (HP Tamu)

### 2.1 Scan QR Code

Gunakaan [Scan Page](https://qr-ordering-eight.vercel.app/scan) atau aplikasi scan

1. Tamu scan QR code yang tertera di meja
2. Menu digital terbuka di browser HP
3. Outlet otomatis terdeteksi dari QR

### 2.2 Pilih Meja

- Jika scan QR → meja otomatis terpilih
- Jika buka manual → pilih meja dari banner "Dining in?"
- Meja yang sedang digunakan ditandai dengan dot orange

### 2.3 Pilih Menu

1. **Pilih Kategori** - Tap tab kategori di header
2. **Lihat Detail** - Tap card menu untuk buka modal
3. **Pilih Varian** - Jika ada varian (size, level, dll)
4. **Tambah Catatan** - Opsional, contoh: "kurang pedas"
5. **Atur Jumlah** - Gunakan +/- di modal
6. **Tambah ke Keranjang** - Tap tombol "Tambah"

### 2.4 Keranjang

- Tap ikon keranjang di header untuk lihat isi
- Ubah jumlah dengan +/-
- Hapus item dengan kurangi jumlah ke 0
- Lihat total di bagian bawah

### 2.5 Pembayaran

1. Tap **"Pesan Sekarang"** di keranjang
2. Pilih metode pembayaran:
   - **Tunai** - Bayar di kasir
   - **QRIS** - Scan QR dengan aplikasi bank/e-wallet
3. Untuk QRIS, scan kode QR dan konfirmasi pembayaran
4. Pesanan terkirim ke dapur

### 2.6 Pantau Status

- Setelah bayar, muncul halaman status pesanan
- Status berurutan:
  - **Diterima** - Pesanan diterima dapur
  - **Diproses** - Sedang dibuat
  - **Siap** - Siap diambil
  - **Selesai** - Sudah diambil

---

## 3. Admin Panel

Akses: [`/admin`](https://qr-ordering-eight.vercel.app/login) (login required)

### 3.1 Dashboard

**Halaman utama** yang menampilkan:
- **Total Order** - Jumlah order hari ini
- **Revenue** - Total penjualan
- **Order Aktif** - Pesanan yang sedang berjalan
- **Menu Terlaris** - Item paling banyak dipesan
- **Order Terbaru** - 5 order terakhir (klik untuk lihat detail)
- **Status Lantai** - Peta meja dengan status (kosong/aktif/selesai)

### 3.2 Menu

**Kelola menu makanan & minuman**

Fitur:
- Tambah/edit/hapus kategori
- Tambah/edit/hapus menu item
- Set harga, foto, deskripsi
- Tandai **HABIS** (tidak tersedia)
- Atur varian (size, level pedas, dll)

### 3.3 Meja & QR

**Setup meja dan generate QR code**

Fitur:
- Tambah/edit/hapus meja
- Generate QR code untuk tiap meja
- Download QR code sebagai gambar
- Print QR code untuk ditempel di meja

### 3.4 Orders

**Kelola semua pesanan**

Fitur:
- Lihat daftar semua order
- Filter berdasarkan status
- Update status order:
  - PENDING → PROCESSING → READY → COMPLETED
- Cancel order (dengan konfirmasi)

### 3.5 Floor Monitor

**Pantau semua meja secara visual**

Fitur:
- Grid visual semua meja
- Warna menunjukkan status:
  - Abu-abu = Kosong
  - Orange = Aktif (ada order)
  - Hijau = Selesai
- Klik meja untuk lihat order terkait

### 3.6 Laporan

**Analytics penjualan**

Fitur:
- Pilih periode: Hari Ini, Kemarin, 7 Hari, Bulan Ini
- **Hero Metrics**: Total Order, Revenue, Avg Order, Peak Hour
- **Menu Terlaris**: Item dengan progress bar
- **Distribusi Per Jam**: Grafik order per jam
- **Performa Meja**: Revenue per meja
- **Insight**: Ringkasan key metrics
- **Download**: Export laporan sebagai file teks

### 3.7 Demo Guide

**Tutorial interaktif untuk new user**

Terdapat:
- Alur sistem visual (6 step)
- Link demo cepat ke setiap komponen
- Key features highlight

### 3.8 Pengaturan

**Konfigurasi outlet**

Fitur:
- Edit nama outlet
- Edit alamat
- Update URL logo
- Lihat jumlah meja & menu item

---

## 4. Kitchen Display System (KDS)

Akses: [`/kitchen/[outlet-slug]`](https://qr-ordering-eight.vercel.app/kitchen/warung-nusantara-sby)

**Display khusus untuk dapur**

### 4.1 Tampilan

- **Header**: Outlet name, jam, sound toggle, refresh
- **Stats Bar**: Total order, Baru (merah), Proses (kuning), Siap (hijau)
- **Order Cards**: Grid kartu pesanan

### 4.2 Order Card

Setiap kartu menampilkan:
- **Nomor Meja** - dengan badge warna
- **Status Badge** - BARU/PROSES/SIAP
- **Timer** - Waktu proses (untuk status PROSES)
- **Queue Position** - Posisi antrian (untuk BARU)
- **Item List** - Daftar pesanan dengan jumlah
- **Notes** - Catatan khusus dari tamu
- **Action Buttons** - Mulai/Batal/Selesai

### 4.3 Alur Kerja Dapur

```
1. ORDER BARU (merah) → tap "MULAI"
2. ORDER DIPROSES (kuning) → tap "SELESAI"
3. ORDER SIAP (hijau) → pesanan diambil kasir
```

### 4.4 Fitur Tambahan

- **Sound Alert** - Bunyi saat ada order baru
- **Light/Dark Mode** - Toggle tema
- **Auto Refresh** - Update otomatis tiap 5 detik
- **Timer** - Hitung waktu proses tiap order

---

## 5. Demo Guide

Lokasi: `/admin/demo`

Panduan visual 6 step:
1. Scan QR Code
2. Pilih & Pesan
3. Bayar
4. Dapur Terima Order
5. Pantau Status
6. Selesai

Terdapat link cepat ke:
- Menu Digital
- Kitchen Display
- Admin Panel
- Tables & QR

---

## 6. Tips & Troubleshooting

### Tamu (Menu Digital)

| Masalah | Solusi |
|---------|--------|
| QR tidak bisa di-scan | Pastikan kamera HP允许 akses |
| Menu tidak muncul | Refresh halaman atau cek koneksi internet |
| Pembayaran gagal | Coba lagi atau pilih metode lain |
| Status tidak update | Refresh halaman status |

### Admin

| Masalah | Solusi |
|---------|--------|
| Tidak bisa login | Cek email & password |
| Data tidak tampil | Refresh halaman |
| Gagal save | Cek koneksi internet |
| QR tidak download | Allow popup di browser |

### Dapur

| Masalah | Solusi |
|---------|--------|
| Order tidak muncul | Refresh atau cek sound |
| Bunyi tidak keluar | Nyalakan sound toggle |
| Salah klik | Gunakan konfirmasi dialog |

---

## 📞 Kontak Support

Jika ada pertanyaan atau menemukan bug, hubungi admin restoran.

---

*Dokumen ini dibuat untuk QR Ordering System - Demo Version*
