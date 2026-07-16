# QR Table Ordering System

**Segmen:** 05 · Kuliner  
**Target:** Restoran Franchise Lokal, Kafe Multi-Cabang, Central Kitchen  
**Status:** MVP Demo · Pytagotech 2026

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your database URL and other configs

# 3. Push schema to database
npm run db:push

# 4. Seed demo data
npm run db:seed

# 5. Start development
npm run dev
```

---

## 🔑 Demo Credentials

| Role | URL | Credentials |
|------|-----|-------------|
| **Admin Panel** | http://localhost:3000/admin | admin@warungnusantara.com / admin123 |
| **Kitchen Display** | http://localhost:3000/kitchen/warung-nusantara-sby | No auth (internal use) |
| **Menu Digital** | http://localhost:3000/m/warung-nusantara-sby | No auth (scan QR) |

---

## 📱 Demo URLs

| Page | URL | Purpose |
|------|-----|---------|
| Menu Digital (Guest) | `/m/warung-nusantara-sby` | Customer-facing menu |
| Checkout | `/m/warung-nusantara-sby/checkout` | Cart review |
| Payment | `/m/warung-nusantara-sby/payment` | Payment selection (Tunai/QRIS) |
| Order Success | `/m/warung-nusantara-sby/success` | Order confirmation |
| Kitchen Display | `/kitchen/warung-nusantara-sby` | Real-time order display |
| Admin Dashboard | `/admin` | Overview & stats |
| Menu Management | `/admin/menu` | CRUD menu items |
| Tables & QR | `/admin/tables` | Generate QR codes |
| Orders List | `/admin/orders` | All orders |
| Floor Monitor | `/admin/floor` | Table status grid |
| Reports | `/admin/reports` | Sales analytics |
| Demo Guide | `/admin/demo` | Interactive walkthrough |

---

## ✨ Features

### Customer Flow (Mobile)
- 📱 **QR Menu** — Scan QR → menu digital (no install required)
- 🛒 **Cart** — Add items, quantity control, notes per item
- 💳 **Payment** — Choose between Cash or QRIS (mockup)
- 📦 **Checkout** — Submit order after payment
- ⏱️ **Status Tracking** — Real-time order status with wait estimation
- 🔄 **Add More** — Add items to existing order

### Kitchen Display (KDS)
- 📊 **Real-time Orders** — New orders appear instantly
- 🔔 **Audio Notifications** — Sound alert for new orders
- 👆 **One-tap Actions** — MULAI PROSES → SELESAI
- ⏰ **Wait Estimation** — Queue position & time display
- 🎨 **Color-coded Status** — Red (new), Amber (processing), Green (ready)

### Admin Panel
- 📈 **Dashboard** — Real-time stats, recent orders
- 📋 **Menu Management** — Full CRUD categories & items
- 🏷️ **Toggle HABIS** — Mark items out of stock instantly
- 🪑 **Table Setup** — Generate tables & QR codes
- 🗺️ **Floor Monitor** — Visual table status grid
- 📊 **Sales Reports** — Best sellers, hourly distribution, CSV export
- 🎯 **Demo Guide** — Interactive feature walkthrough

### F-08: Wait Time Estimation
- Queue position calculation
- Estimated wait based on avg prep time
- "±Segera" for first in queue
- Real-time updates as queue changes

### F-PAY: Payment Mockup
- Cash payment (bayar di kasir)
- QRIS with mockup QR code
- Auto-redirect after payment
- Success confirmation

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | NextAuth.js (admin only) |
| Styling | Tailwind CSS |
| State | Zustand (cart) |
| QR Generation | qrcode + jsPDF |
| Deployment | Vercel + Supabase |

---

## 📁 Project Structure

```
05-qr-ordering/
├── app/
│   ├── admin/                    # Admin panel
│   │   ├── page.tsx            # Dashboard
│   │   ├── menu/               # Menu management
│   │   ├── tables/             # Table + QR setup
│   │   ├── orders/             # Orders list
│   │   ├── floor/              # Floor monitor
│   │   ├── reports/            # Sales reports
│   │   ├── settings/           # Outlet config
│   │   └── demo/               # Demo guide
│   │
│   ├── kitchen/[slug]/         # Kitchen Display System
│   ├── m/[slug]/               # Guest menu digital
│   │   ├── checkout/          # Cart & order
│   │   ├── success/           # Order confirmation
│   │   └── status/[id]/       # Order tracking
│   │
│   ├── api/                    # API routes
│   │   ├── admin/             # Admin APIs
│   │   ├── kitchen/           # KDS APIs
│   │   └── public/            # Guest APIs
│   │
│   └── login/                 # Admin login
│
├── components/
│   ├── ui/                    # Base UI components
│   └── admin/                 # Admin components
│
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── auth.ts               # NextAuth config
│   ├── utils.ts              # Utility functions
│   ├── qrGenerator.ts        # QR code generation
│   └── waitEstimate.ts       # F-08 logic
│
├── stores/
│   └── cartStore.ts          # Zustand cart store
│
└── prisma/
    ├── schema.prisma         # Database schema
    └── seed.ts               # Demo data
```

---

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Supabase (optional - for realtime & storage)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_OUTLET_SLUG=warung-nusantara-sby
```

---

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema to database
npm run db:seed     # Seed demo data
npm run db:studio   # Open Prisma Studio
npm run lint        # Run ESLint
```

---

## 🗄️ Database Schema

### Core Models

- **Outlet** — Restaurant/café info
- **Table** — Tables with QR tokens
- **Category** — Menu categories
- **MenuItem** — Menu items with pricing
- **MenuVariant** — Size/variant options
- **Order** — Customer orders
- **OrderItem** — Individual items in order
- **User** — Admin users

### Order Status Flow

```
PENDING → PROCESSING → READY → COMPLETED
              ↓
          CANCELLED
```

### Table Status Flow

```
EMPTY → ACTIVE → DONE → EMPTY
```

---

## 🎨 Design System

### Guest Interface (Warm Cream)
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FFFBF0` | Page background |
| Primary | `#C2410C` | Buttons, accents |
| Cart Badge | `#DC2626` | Cart notification |

### Kitchen Display (Dark)
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#111827` | Page background |
| New Order | `#7F1D1D` | Red card bg |
| Processing | `#78350F` | Amber card bg |
| Ready | `#14532D` | Green card bg |

### Admin Panel
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F8F9FA` | Page background |
| Primary | `#C2410C` | Brand color |

---

## 🔧 Troubleshooting

### Database Connection Issues
```
Error: P1001: Can't reach database server
```
**Solution:** Check `DATABASE_URL` in `.env` file. Ensure PostgreSQL is running.

### Prisma Client Not Generated
```
Error: Cannot find module '@prisma/client'
```
**Solution:** Run `npm run db:generate`

### Seed Fails
```
Error: PrismaClientKnownRequestError
```
**Solution:** Run `npm run db:push` first to create tables.

### QR Codes Not Loading
```
Error: QR generation failed
```
**Solution:** Ensure `NEXT_PUBLIC_APP_URL` is correct in `.env`.

### Audio Notifications Not Working
Audio requires user interaction to enable (browser policy). Click anywhere on the KDS page to enable sounds.

---

## 📋 Demo Scenarios

### Scenario 1: Full Order Flow
1. Go to `/m/warung-nusantara-sby` (menu digital)
2. Add items to cart
3. Go to checkout and submit order
4. View order status at success page
5. Check KDS at `/kitchen/warung-nusantara-sby` to see new order

### Scenario 2: KDS Workflow
1. Open `/kitchen/warung-nusantara-sby` (KDS)
2. Click "MULAI PROSES" on a PENDING order
3. Click "SELESAI" when ready
4. Order moves to COMPLETED

### Scenario 3: Toggle HABIS
1. Go to `/admin/menu`
2. Find an item and click the toggle
3. Item immediately shows "HABIS" overlay in menu

### Scenario 4: Reports
1. Go to `/admin/reports`
2. Change period filter (today/week/month)
3. View best sellers, hourly distribution
4. Export CSV

---

## 📄 License

MIT License - Pytagotech 2026
