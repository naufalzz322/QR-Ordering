# Portfolio Demo Improvements Plan

## Goal

Improve the QR Ordering project as a polished, honest, and dependable portfolio demo by strengthening the demo journey, clarifying simulated behavior, adding a small set of high-value automated tests, and fixing the most visible correctness issues without turning the project into a production restaurant platform.

## Current context / assumptions

- Repository root: `D:/Work/Web/demo/QR Ordering`.
- The project is a Next.js App Router application using TypeScript, React, Prisma/PostgreSQL, NextAuth, Tailwind CSS, Zustand, Supabase client libraries, QR generation, and jsPDF.
- The project is intentionally a portfolio/demo application. Real payment gateway integration, inventory, loyalty, multi-branch operations, and full production infrastructure are out of scope.
- The main demo paths are:
  - Customer landing page: `/`
  - QR scan page: `/scan`
  - Customer menu: `/m/warung-nusantara-sby`
  - Kitchen display: `/kitchen/warung-nusantara-sby`
  - Admin: `/admin`
  - Demo guide: `/admin/demo`
- Demo credentials are documented in `README.md` and `prisma/seed.ts`.
- The current implementation already includes the end-to-end happy path, mock QRIS payment, seeded data, reports, QR/PDF generation, polling, and an admin UI.
- There is no configured test framework or test script in `package.json`; `npm run lint` and `npm run build` are the existing verification commands.
- Do not expose or modify secret-bearing `.env` files. Do not commit or push changes unless explicitly requested.
- The existing working tree is clean according to the planning inspection. Re-check status before implementation.

## Architecture / proposed approach

Use a portfolio-first vertical slice: make the existing demo easy to understand and replay, then add only targeted correctness safeguards around the public order flow and demo payment states. Keep the current UI and data model where possible; avoid production-only abstractions, real payment integration, multi-tenant redesigns, or a broad refactor. Add lightweight unit tests around pure order validation/payment-demo behavior and use the existing lint/build checks plus a manual browser walkthrough for the integrated flow.

## Step-by-step tasks

### Task 1 — Reconfirm repository state and document the implementation baseline

1. Run:

   ```bash
   git status --short
   git branch --show-current
   npm run lint
   npm run build
   ```

2. Expected output:
   - The current branch is shown.
   - No unexpected file changes are present.
   - Lint completes successfully, or any pre-existing failure is recorded before changes.
   - Build completes successfully, or any pre-existing failure is recorded.
3. Read `README.md`, `docs/USER_GUIDE.md`, `WORKING.md`, `app/admin/demo/page.tsx`, and `app/(public)/m/[outletSlug]/payment/page.tsx` before editing.
4. Create an implementation note in the work log or task handoff with the baseline command results. Do not change source code in this task.

Verification: preserve the exact baseline lint/build result so later failures can be distinguished from existing failures.

### Task 2 — Add an explicit demo-scope section to the README

Files:

- `README.md`
- `docs/USER_GUIDE.md`

1. Add a clearly visible section near the top of `README.md` titled `Portfolio Demo Scope`.
2. Explain, in concise English, that:
   - QRIS payment is simulated and no real money is transferred.
   - Seeded data is for demonstration.
   - Kitchen updates and status changes are demo workflows backed by the application database/polling.
   - Inventory, real payment verification, loyalty, and multi-branch management are not implemented.
3. Add a short `How to demo in 3 minutes` list linking to `/`, `/scan`, `/m/warung-nusantara-sby`, `/kitchen/warung-nusantara-sby`, and `/admin/demo`.
4. In `docs/USER_GUIDE.md`, update the payment section so the QRIS flow explicitly says `Simulasi QRIS — tidak ada transaksi nyata` and the cash flow is described as a demo confirmation rather than a real settlement.
5. Do not include any unredacted secret or imply that the seeded password is suitable for production.

Verification:

```bash
git diff --check
```

Expected output: no output and exit code `0`.

### Task 3 — Make the mock payment behavior unmistakable in the UI

Files:

- `app/(public)/m/[outletSlug]/payment/page.tsx`
- `app/(public)/m/[outletSlug]/success/page.tsx` if the success page needs matching copy
- `app/globals.css` only if an existing badge style is needed; do not add broad styling

1. Write the desired UI behavior before implementation:
   - The payment page visibly displays a `DEMO / SIMULASI` badge near the payment heading.
   - The QRIS option says it is a simulated QRIS screen and does not charge money.
   - The QRIS screen says successful payment is simulated automatically for the portfolio demo.
   - The success page says payment status is simulated when the order was created through this demo flow.
2. Add the smallest JSX changes that implement those messages using existing Tailwind classes and existing components.
3. Keep the existing two payment paths and redirect behavior unchanged.
4. Do not add a real gateway SDK, webhook, payment model, or external API.

Verification:

```bash
npm run lint
```

Expected output: lint exits `0` with no new warnings/errors.

Manual verification: open `/m/warung-nusantara-sby`, add an item, go to payment, and confirm that both the cash and QRIS options visibly communicate demo behavior before confirmation.

### Task 4 — Add a deterministic demo reset path to the admin demo guide

Files:

- `app/admin/demo/page.tsx`
- `README.md` only if the reset instructions need a link or short note

1. Inspect the existing demo guide structure and its quick links.
2. Add a small `Reset demo`/`Demo data note` panel that tells a visitor that the seeded dataset can be restored with the repository command below; do not expose a public destructive reset endpoint.
3. Include the exact local reset command:

   ```bash
   npm run db:seed
   ```

4. Warn that the seed command deletes and recreates demo records. Make the warning visually prominent enough to prevent accidental execution.
5. If the guide is intended for deployed visitors who cannot run commands, instead label the command as `For the project owner/developer` and provide a non-destructive `Refresh the page` instruction for visitors.

Verification:

```bash
npm run lint
git diff --check
```

Expected output: both commands exit `0`; `git diff --check` prints nothing.

### Task 5 — Define pure order-input validation before changing the order API

Files:

- New file: `lib/orderValidation.ts`
- New test file: `lib/orderValidation.test.ts`
- `package.json`

1. Add Vitest as a development dependency and scripts without changing application runtime dependencies:

   ```json
   "scripts": {
     "test": "vitest run",
     "test:watch": "vitest"
   }
   ```

2. Add a minimal `vitest.config.ts` configured for TypeScript and the existing `@/*` alias if Vitest cannot resolve the alias by default. Keep the config limited to test discovery and alias resolution.
3. Add a failing test first in `lib/orderValidation.test.ts` for these behaviors:
   - Empty `items` is rejected.
   - A non-integer or non-positive `qty` is rejected.
   - Missing `menuItemId` is rejected.
   - A valid item list containing an optional variant and note is accepted.
4. Run:

   ```bash
   npm test -- --run lib/orderValidation.test.ts
   ```

   Expected RED result: the test fails because `lib/orderValidation.ts` does not yet export the requested validator.
5. Implement the minimal pure function in `lib/orderValidation.ts`:

   ```ts
   export type PublicOrderItemInput = {
     menuItemId?: unknown
     variantId?: unknown
     qty?: unknown
     itemNotes?: unknown
   }

   export type OrderValidationResult =
     | { valid: true; items: Array<{ menuItemId: string; variantId: string | null; qty: number; itemNotes: string | null }> }
     | { valid: false; error: string }

   export function validatePublicOrderItems(input: unknown): OrderValidationResult {
     if (!Array.isArray(input) || input.length === 0) {
       return { valid: false, error: 'Items are required' }
     }

     const items = []
     for (const rawItem of input as PublicOrderItemInput[]) {
       if (typeof rawItem?.menuItemId !== 'string' || rawItem.menuItemId.length === 0) {
         return { valid: false, error: 'Each item must include a menu item ID' }
       }
       if (!Number.isInteger(rawItem.qty) || Number(rawItem.qty) <= 0) {
         return { valid: false, error: 'Each item quantity must be a positive integer' }
       }
       if (rawItem.variantId !== undefined && rawItem.variantId !== null && typeof rawItem.variantId !== 'string') {
         return { valid: false, error: 'Variant ID must be a string' }
       }
       if (rawItem.itemNotes !== undefined && rawItem.itemNotes !== null && typeof rawItem.itemNotes !== 'string') {
         return { valid: false, error: 'Item notes must be a string' }
       }

       items.push({
         menuItemId: rawItem.menuItemId,
         variantId: rawItem.variantId ?? null,
         qty: rawItem.qty as number,
         itemNotes: rawItem.itemNotes ?? null,
       })
     }

     return { valid: true, items }
   }
   ```

6. Run the focused test again:

   ```bash
   npm test -- --run lib/orderValidation.test.ts
   ```

   Expected GREEN result: all order-validation tests pass.
7. Keep this function pure and independent of Prisma so it can be reused by API tests.

### Task 6 — Integrate validation and menu/variant checks into public order creation

Files:

- `app/api/public/order/route.ts`
- `lib/orderValidation.ts`
- `lib/orderValidation.test.ts` if additional pure cases are needed

1. Add a failing test for the pure menu/variant validation helper before implementing it. The test must prove that a selected variant must belong to the selected menu item and that unavailable menu items are rejected.
2. Extract or add a pure helper only for the data-independent portion if practical; database-dependent checks can stay in `route.ts`.
3. In `POST` in `app/api/public/order/route.ts`, call `validatePublicOrderItems(body.items)` before any database lookup. Return HTTP `400` with the validator’s error for invalid input.
4. When loading each menu item, verify all of the following before adding it to `orderItems`:
   - The menu item exists.
   - `menuItem.outletId === table.outletId`.
   - `menuItem.isAvailable === true`.
   - If `variantId` is supplied, the variant exists and `variant.menuItemId === menuItem.id`.
5. Return a clear HTTP `400` response for each invalid case. Do not silently skip unknown items; an order must be rejected rather than created with a different cart than the visitor saw.
6. Preserve the existing response shape `{ order, estimate }` for valid demo orders.
7. Add a duplicate-submit guard at the UI/API boundary only if the existing flow does not already prevent it. Prefer disabling the payment action while `processing` is true; do not create a broad idempotency system for this demo.
8. Use a Prisma transaction for order creation and table status update if the current Prisma setup allows it without a large refactor:
   - Create the order.
   - Update the table to `ACTIVE`.
   - Return the created order.
9. Run the focused tests, then `npm run lint` and `npm run build`.

Expected verification:

```bash
npm test -- --run lib/orderValidation.test.ts
npm run lint
npm run build
```

Expected output: focused tests pass, lint exits `0`, and Next.js build completes successfully. If the baseline build already fails, report only the new failure introduced by this task.

### Task 7 — Add a small demo-quality error surface for failed order submission

Files:

- `app/(public)/m/[outletSlug]/payment/page.tsx`
- `app/(public)/m/[outletSlug]/checkout/page.tsx` only if the same submit error is handled there

1. Add a failing UI/component-level test only if the chosen test setup supports React component tests without a disproportionate dependency increase. Otherwise, use a manual acceptance checklist and keep the change limited.
2. Add a local `error` state to the payment page.
3. In the `catch` block and non-OK API response path, set a customer-readable Indonesian error such as `Pesanan belum berhasil dikirim. Periksa koneksi lalu coba lagi.`
4. Render the error near the action button with an accessible alert role.
5. Keep the cart intact on failure so the visitor can retry.
6. Clear the error when the visitor changes payment method or retries.
7. Ensure `processing` is always reset after a failed request.

Verification:

```bash
npm run lint
npm run build
```

Expected output: both commands exit `0`. Manual acceptance: temporarily use an invalid table token or disconnect the request in the browser, submit, confirm the error is visible, and confirm the cart remains populated.

### Task 8 — Add portfolio smoke-test documentation and a manual acceptance checklist

Files:

- `README.md`
- `docs/USER_GUIDE.md`
- New file: `docs/PORTFOLIO_SMOKE_TEST.md`

1. Create `docs/PORTFOLIO_SMOKE_TEST.md` with these exact sections:
   - `Prerequisites`
   - `Seed demo data`
   - `Customer flow`
   - `Kitchen flow`
   - `Admin flow`
   - `Expected demo-only behavior`
   - `Troubleshooting`
2. Document the following exact smoke test:
   - Start with `npm run dev`.
   - Open `/` and `/scan`.
   - Open `/m/warung-nusantara-sby`, select a table if necessary, add an available item, and verify the cart total.
   - Continue to payment and verify the `DEMO / SIMULASI` copy.
   - Complete the simulated flow and record the order number.
   - Open `/kitchen/warung-nusantara-sby`, wait for the order to appear, move it from `PENDING` to `PROCESSING` to `READY`, and verify the customer status page changes after polling.
   - Log into `/admin` using the credentials already documented in the repository and verify dashboard, menu, tables, floor, reports, and settings links load.
3. Add a concise link to this smoke test from `README.md`.
4. Do not claim real payment, realtime guarantees, or production readiness.

Verification:

```bash
git diff --check
```

Expected output: no output and exit code `0`.

### Task 9 — Run the complete quality gate and review the final scope

1. Run:

   ```bash
   npm test -- --run
   npm run lint
   npm run build
   git diff --check
   git status --short
   ```

2. Expected output:
   - All configured tests pass.
   - Lint exits `0` with no new issues.
   - Production build completes.
   - `git diff --check` prints nothing.
   - Only intended files are modified or added.
3. Review the diff for accidental production claims, secrets, debug logging, broad refactors, and changes outside the portfolio-demo goal.
4. Do not commit or push as part of this plan unless the user separately approves it.

## Tests / validation

Follow a vertical RED-GREEN-REFACTOR cycle for each code behavior:

1. Write one focused failing test first.
2. Run the exact focused test and confirm it fails for the expected missing behavior.
3. Implement the smallest change that makes it pass.
4. Run the focused test again and confirm it passes.
5. Refactor only after green, keeping behavior unchanged.
6. Run the full test suite, lint, build, and `git diff --check` after the related slice.

Because the repository currently has no test framework, the first test task must add the smallest Vitest setup. Do not add end-to-end browser automation unless manual smoke testing reveals a repeatable regression that justifies Playwright.

Recommended final commands:

```bash
npm test -- --run
npm run lint
npm run build
git diff --check
git status --short
```

Expected result: tests pass, lint passes, build passes, diff check is clean, and the status list contains only intended portfolio-demo improvements.

## Risks, tradeoffs, and open questions

- Adding Vitest introduces a development dependency and configuration overhead. The tradeoff is justified for pure order validation, which is high-value and low-maintenance.
- API validation improves demo correctness but does not attempt full production abuse prevention, rate limiting, or payment reconciliation.
- A Prisma transaction may expose existing database or schema assumptions. If it causes unrelated build/runtime complexity, keep the validation changes and document the transaction limitation rather than broadening scope.
- The current public table list endpoint exposes table tokens to support manual selection. Avoid redesigning that flow in this portfolio pass unless a manual smoke test demonstrates a visible problem.
- The current menu API caches for 60 seconds while the menu page polls more frequently. This is worth documenting for the demo; cache invalidation can be a later improvement unless stale sold-out status visibly harms the walkthrough.
- The kitchen URL and APIs are not being converted into a complete production staff-authentication system because this is a demo. If the project is later presented as deployable software, revisit staff authorization separately.
- The seed script intentionally destroys and recreates demo data. Keep reset instructions developer-only and never expose an unauthenticated reset route.
- The seeded admin credential is useful for a local demo but must be labeled demo-only and must not be reused in a production deployment.
- Open question for implementation: should the portfolio copy be entirely English, entirely Indonesian, or bilingual? The existing UI is primarily Indonesian and the plan assumes Indonesian UI copy with concise English developer documentation.
- Open question for implementation: whether the deployed Vercel demo has a writable/available database. The plan does not assume that a visitor can reset deployed data; it only documents `npm run db:seed` for the project owner.
