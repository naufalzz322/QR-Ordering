# QR Ordering System

Portfolio demo for a restaurant QR ordering system. Guests scan a table QR code, browse the menu, place an order from their phone, and follow its progress through the kitchen.

---

## Portfolio Demo Scope

This project demonstrates a restaurant ordering workflow; it is not a live payment or production restaurant service.

- QRIS and cash payment confirmations are simulated. No real payment is processed or money transferred.
- The database seed creates sample outlet, menu, table, and order data for demonstration.
- Kitchen and customer status screens use the application database and polling; updates are not guaranteed to be instant.
- Real payment verification, inventory, loyalty, and multi-branch management are not implemented.
- Seeded login credentials are for local demonstration only. Do not reuse them in a deployed or production environment.

## How to Demo in 3 Minutes

1. Start with the [landing page](/) or [QR scanner](/scan).
2. Open the [customer menu](/m/warung-nusantara-sby), choose a table, and add an available item.
3. Continue to payment and use the clearly labeled simulated payment flow.
4. Follow the order in the [kitchen display](/kitchen/warung-nusantara-sby) and open the [demo guide](/admin/demo) for the admin walkthrough.

For a detailed local walkthrough, see [Portfolio Smoke Test](docs/PORTFOLIO_SMOKE_TEST.md). To configure an optional daily destructive demo reset, see [Daily Demo Reseed](docs/CRON_JOB_ORG.md).

## Quick Demo

| Halaman | URL |
|---------|-----|
| Menu Digital (HP Tamu) | `/m/warung-nusantara-sby` |
| Kitchen Display | `/kitchen/warung-nusantara-sby` |
| Admin Panel | `/admin` |

**Local demo login only**: `admin@warungnusantara.com` / `admin123` (created by the seed script; never use in production)

---

## Fitur Utama

- **Menu Digital** - Tamu pesan via HP dari QR code
- **Kitchen Display** - Dapur menerima order dan memperbarui status secara berkala
- **Admin Panel** - Kelola menu, meja, laporan
- **Simulated Payment** - Demo-only cash and QRIS confirmation; no real transaction
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
