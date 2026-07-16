# QR Ordering System

**Sistem pemesanan makanan via QR Code untuk restoran.**

Scan QR di meja → pesan dari HP → bayar → dapur terima otomatis.

Tanpa download app, tanpa antre kasir.

---

## Quick Demo

| Halaman | URL |
|---------|-----|
| Menu Digital (HP Tamu) | `/m/warung-nusantara-sby` |
| Kitchen Display | `/kitchen/warung-nusantara-sby` |
| Admin Panel | `/admin` |

**Login Admin**: `admin@warungnusantara.com` / `admin123`

---

## Fitur Utama

- **Menu Digital** - Tamu pesan via HP dari QR code
- **Kitchen Display** - Dapur terima order real-time
- **Admin Panel** - Kelola menu, meja, laporan
- **QRIS Payment** - Bayar dengan QRIS
- **Floor Monitor** - Pantau semua meja
- **Laporan Penjualan** - Analytics & export

---

## Alur

```
Scan QR → Pilih Menu → Bayar → Dapur Terima → Pantau Status → Selesai
```

---

## Tech

- Next.js 15 + React 19 + TypeScript
- PostgreSQL (Supabase)
- NextAuth.js
- Tailwind CSS
- Zustand + Prisma

---

## Setup

```bash
npm install
cp .env.example .env
# configure DATABASE_URL
npm run db:push
npm run db:seed
npm run dev
```

---

*Simple. Fast. No app needed.*
