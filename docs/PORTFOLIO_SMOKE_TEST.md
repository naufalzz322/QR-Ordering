# Portfolio Smoke Test

Use this checklist to verify the local portfolio demo. The payment flow is simulated; do not enter or expect real payment details.

## Prerequisites

- Node.js and npm installed.
- A local PostgreSQL database configured with `DATABASE_URL` in the local environment file.
- Dependencies installed with `npm install`.
- This project uses a seeded demo account and sample restaurant data. Credentials are for local demonstration only.

## Seed demo data

For the project owner/developer, create or restore the sample data with:

```bash
npm run db:push
npm run db:seed
```

Warning: `npm run db:seed` deletes existing application records before recreating demo records. Do not run it against a database containing data you need to keep. Visitors of a deployed demo should refresh the page instead; no public reset endpoint is provided.

Start the development server:

```bash
npm run dev
```

Expected output includes a local URL, usually `http://localhost:3000`.

## Customer flow

1. Open `/` and confirm the landing page loads.
2. Open `/scan`. If camera access is unavailable, use the manual table selection/code option.
3. Open `/m/warung-nusantara-sby` and select a table if necessary.
4. Add an available item to the cart. Confirm the cart shows the chosen item, quantity, and expected total.
5. Continue to payment. Confirm the page displays `DEMO / SIMULASI` and says no real payment is made.
6. Try either payment option. For QRIS, confirm the UI explicitly describes the QR as a mockup and the confirmation as simulated. No banking application or real scan is needed.
7. Complete the simulated flow and record the order number shown on the success/status page.

## Kitchen flow

1. Open `/kitchen/warung-nusantara-sby` in another tab or device.
2. Wait for the new order to appear; kitchen data refreshes through polling, so allow several seconds.
3. Move the order from `PENDING` to `PROCESSING`, then to `READY`.
4. Return to the customer status page and allow its polling interval to refresh. Verify the customer status reflects the kitchen update.
5. Optional: enable the KDS sound toggle and place another demo order to try the new-order notification.

## Admin flow

1. Open `/admin` and sign in using the local demo credentials listed in the repository README.
2. Confirm the dashboard loads.
3. Visit the Menu, Tables & QR, Orders, Floor Monitor, Reports, and Settings pages from the admin navigation.
4. Open `/admin/demo` and check the workflow links and the warning that payment is simulated and reset is developer-only.

## Expected demo-only behavior

- Cash and QRIS flows only simulate confirmation. No transaction, payment capture, settlement, or transfer occurs.
- The QRIS visual is not a valid payment code.
- The database seed is sample data and the seeded account is not production-safe.
- Customer and kitchen status updates use polling; they are periodic, not guaranteed instant/realtime delivery.
- Inventory, loyalty, real payment verification, and multi-branch administration are not implemented.

## Troubleshooting

- If the menu or API reports no outlet/table data, configure the local database and run the developer-only seed command above.
- If the build fails while initializing Supabase Storage, verify the local Supabase URL and keys are valid for the environment; do not paste secrets into issue reports.
- If the order does not appear immediately in the KDS, wait for the polling interval and check that both pages use the same outlet slug and database.
- If a menu item is sold out, choose another item or restore the seed data only in a disposable local database.
- If admin sign-in fails, confirm that the seed script has completed and use the local demo credentials in the README.
