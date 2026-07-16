# CHANGELOG — 05-qr-ordering

All notable changes to this project will be documented in this file.

## [Unreleased] Landing Page + QR Scan

### Added
- **Landing page** (`/`) — Beautiful homepage with restaurant branding, featured menu, how-it-works section
- **Scan page** (`/scan`) — QR scanner with camera support and manual code entry
- **Table token tracking** — Menu page reads `?token=` from URL to track customer's table

### Changed
- **Theme**: Changed from "Kafe Coklat Surabaya" to "Warung Nusantara" (general restaurant)
- **Outlet slug**: `kafe-coklat-sby` → `warung-nusantara-sby`
- **Email**: `admin@kafecoklatsby.com` → `admin@warungnusantara.com`
- **Order prefix**: `ORD-KCS-` → `ORD-WNS-`

## [Released] Bug Fixes & Enhancements

### Critical Fixes

#### Added
- **Centralized config** (`lib/config.ts`) — Single source of truth for outletSlug and appUrl
- **Receipt page** (`/m/[outletSlug]/receipt/[orderId]`) — Printable order receipt with print functionality
- **Settings API** (`/api/admin/settings`) — Real API for outlet settings CRUD
- **Order cancellation** — Kitchen can now cancel PENDING orders

#### Fixed
- **Hardcoded slugs** — Replaced all 20+ occurrences of `kafe-coklat-sby` with `config.outletSlug`
- **Hardcoded app URL** — Replaced `localhost:3000` with `config.appUrl` in QR generation
- **N+1 query** — Reports API now uses single query + Map for table performance
- **Auto-refresh missing** — Floor and Orders pages now auto-refresh every 30 seconds
- **Menu polling** — Menu page now polls every 10s for HABIS updates

#### Enhanced
- **Reports page** — Now includes SimplePie chart for status distribution
- **Kitchen Display** — Cancel button for PENDING orders
- **Settings page** — Connected to real API with outlet stats display

---

## [Released] Sprint 7 Complete

### Sprint 7: Fix Gaps + Payment Mockup + Polish (July 2026)

#### Added
- **Payment Mockup Flow** — Added payment selection page (`/m/[outletSlug]/payment`) with:
  - Cash payment option (bayar di kasir)
  - QRIS payment with mockup QR code display
  - Payment processing simulation with success animation
  - Auto-redirect to order success page after payment
- **SalesChart component** (`components/admin/SalesChart.tsx`)
  - Ranking chart for best sellers
  - HorizontalBarChart for hourly distribution
  - SimplePie for status breakdown
- **Edit Menu Item functionality** — Full CRUD for menu items in admin panel
- **Payment step in demo guide** — Updated walkthrough to include payment flow

#### Enhanced
- **Checkout flow** — Now routes to payment page instead of direct order submission
- **Success page** — Shows "Pembayaran Berhasil!" with payment confirmation
- **Success page** — Dynamic outlet slug instead of hardcoded
- **Success page tips** — Updated to reflect paid orders
- **Reports page** — Uses new SalesChart components for better visuals
- **Admin menu page** — Full edit functionality for menu items
- **Demo guide** — 6 steps including payment flow

#### Fixed
- **Hardcoded slugs** — Changed from `kafe-coklat-sby` to dynamic `{outletSlug}`
- **Button onClick handler** — Fixed payment page button logic
- **Cart store integration** — Added `setOrderId` to payment page

---

### Sprint 6: Final Testing + README

#### Added
- Enhanced seed script with realistic order history (20+ completed orders for reports)
- Added variation in table statuses (ACTIVE, DONE, EMPTY)
- Added "HABIS" items in seed (Matcha Latte, Rice Bowl Teriyaki) for demo
- Dashboard stats API (`/api/admin/stats`) with real database queries
- Demo Guide page (`/admin/demo`) with walkthrough and quick links
- Demo banner on dashboard showing active orders count

#### Enhanced
- Dashboard now fetches real stats from API (orders, revenue, wait time, best seller)
- Dashboard displays recent orders with real data
- Dashboard refreshes automatically every 30 seconds
- Kitchen page now fetches outlet name dynamically
- Kitchen header shows real outlet name from database
- Seed script uses menuItemIds map for cleaner reference
- Better order number generation in seed script

#### Fixed
- Seed script now properly references menu items by ID instead of findFirst queries

---

### Sprint 6: Final Testing + README

#### Added
- Complete README documentation with all features
- Demo credentials section with all URLs
- Troubleshooting section with common issues
- Demo scenarios documentation
- Project structure documentation
- Database schema documentation

#### Enhanced
- Code review for consistency across all admin pages
- Verified all API routes are properly structured
- Verified seed script works with proper ID references
- Verified wait estimation logic (F-08)
- Verified cart store integration

---

### Sprint 4: Reports + Settings

#### Added
- Reports API with real database queries (`/api/admin/reports`)
- Best sellers calculation from order data
- Hourly distribution analysis
- Table performance metrics
- Peak hour detection
- Reports page with real API integration
- Period filtering (today, yesterday, week, month)
- CSV export for reports
- Settings page for outlet configuration

#### Enhanced
- Reports page: real data from database
- Stats cards with period-aware data
- Table performance grid

---

### Sprint 3: Admin CRUD + KDS

#### Added
- `MenuItemForm` component for create/edit menu items
- Category CRUD (create, edit, delete)
- Toggle category active/inactive
- Menu item CRUD (create, toggle HABIS, delete)
- Kitchen audio notification via Web Audio API (beep-beep-beep pattern)
- Sound toggle button with visual indicator
- Kitchen stats bar (total, baru, proses, siap counts)
- Age color coding: white (<5min), yellow (5-10min), red (>10min)
- Admin orders API with status filtering and stats
- Floor monitor API with table closing endpoint
- Admin orders page with real API integration
- Floor monitor page with real API integration
- Enhanced kitchen display with larger fonts for readability

#### Enhanced
- Kitchen order cards: bigger table numbers, bolder fonts
- Kitchen actions: larger buttons with icons
- Orders list: clickable stat cards for filtering
- Floor grid: hover effects, better spacing

---

### Sprint 2: Menu Digital + Checkout

#### Added
- Checkout page with order submission flow
- Order success page with countdown timer
- Table token handling via session storage
- Improved item detail modal with animations
- Cart drawer with full CRUD operations
- Mobile-responsive menu grid (2 columns)
- Category tabs with horizontal scroll
- Quick-add quantity controls directly on cards
- "HABIS" overlay for out-of-stock items
- Order status tracking page with visual stepper
- Real-time polling for order status (5s interval)
- Remaining time calculation
- Admin orders list with status filters
- Floor monitor page with table grid
- Public table API endpoints
- Floor monitor link in admin sidebar

#### Enhanced
- Menu page UI with better cards and animations
- Mobile touch targets (44px minimum)
- Cart floating button with price display
- Item modal with variant selection
- Status page with visual progress bar

---

### Sprint 1: Foundation

#### Added
- Initial project scaffold (Next.js 14 + App Router + TypeScript)
- Prisma schema with full data model (Outlet, Table, Category, MenuItem, Order, User)
- NextAuth.js setup (admin only, credential-based)
- Seed script for demo outlet + 12 tables + 15 menu items + demo orders
- QR code generation per table (`lib/qrGenerator.ts`)
- PDF export for QR cards (A5 format via jsPDF)
- Base UI components (Button, Input, Card, Dialog, Tabs, Select, Label, Textarea)
- Admin layout shell with sidebar navigation
- Admin dashboard with stats cards and quick actions
- Tables management with QR generation and PDF download
- Menu management with category organization
- Kitchen Display System (KDS) with real-time order cards
- Guest menu digital with category tabs and cart
- Order status tracking page with stepper
- Wait time estimation (F-08)
- Reports page with charts and export

#### Dependencies
- next@14, react@18, typescript
- prisma, @prisma/client
- next-auth@4
- qrcode, jspdf
- tailwindcss, tailwindcss-animate, @radix-ui/*
- @supabase/supabase-js
- zustand (for cart state)
- lucide-react, class-variance-authority, clsx, tailwind-merge
- bcryptjs (for password hashing)

#### Config Files
- .env.example with all required vars
- prisma/schema.prisma
- tailwind.config.ts
- next.config.js
- tsconfig.json
- .eslintrc.json

#### Pages
- `/admin` - Dashboard
- `/admin/menu` - Menu management
- `/admin/tables` - Table setup + QR codes
- `/admin/orders` - Orders list
- `/admin/floor` - Floor monitor
- `/admin/reports` - Sales reports
- `/admin/settings` - Outlet settings
- `/login` - Admin login
- `/m/[outletSlug]` - Guest menu digital
- `/m/[outletSlug]/checkout` - Checkout
- `/m/[outletSlug]/success` - Order success
- `/m/[outletSlug]/status/[orderId]` - Order tracking
- `/kitchen/[outletSlug]` - Kitchen Display System

#### APIs
- `GET /api/admin/tables` - List tables
- `POST /api/admin/tables` - Generate tables
- `GET/POST/PUT/DELETE /api/admin/menu` - Menu CRUD
- `GET/POST/PUT/DELETE /api/admin/categories` - Category CRUD
- `GET /api/admin/orders` - Orders with stats + filtering
- `GET/POST /api/admin/floor` - Floor status + close table
- `GET /api/admin/reports` - Sales reports with analytics
- `GET /api/public/menu/[outletSlug]` - Public menu
- `GET /api/public/table` - Get table by token
- `GET /api/public/tables` - List all tables
- `POST /api/public/order` - Create order
- `GET /api/public/order/[id]/status` - Order status
- `GET /api/kitchen/orders` - Kitchen orders
- `PATCH /api/kitchen/order/[id]/status` - Update order status

---

## Previous
- (none — fresh project)
