# DemoBid — lowest-unique-bid DEMO platform

A **DEMO** web application of a lowest-unique-bid competition platform (an original implementation not affiliated with OneBid.et). Demo credits with no monetary value; no real payments, prizes, or withdrawals.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript (strict)
- Tailwind CSS v4, Lucide React icons
- MySQL / MariaDB + Prisma ORM (migrations)
- Auth.js (next-auth v5 beta, JWT credentials provider)
- Zod (server-side validation), React Hook Form (forms)
- Vitest (unit + DB integration tests), Playwright (e2e)

## Quick start (local)

1. Requirements: Node ≥ 22, a running MySQL-compatible server (tested with MariaDB).
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — e.g. `mysql://user:pass@localhost:3306/onebid_demo`
   - `AUTH_SECRET` — any long random string (demo).
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` — used **only** by the seed script to create the initial administrator. Never hardcoded in app code.
   - `STARTING_DEMO_CREDITS` (default 500) and `BID_DEMO_CREDIT_FEE` (default 5) — demo-credit config.
3. Install & migrate & seed:

```bash
npm install
npx prisma migrate deploy   # or: npx prisma migrate dev
npx tsx --env-file=./.env prisma/seed.ts
npm run dev                 # http://localhost:3000
```

Demo login after seeding: `demo@demo.local` / `DemoPass-2026!` — admin credentials come from your `.env`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` / `npm start` | production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (next config) |
| `npm run test` / `vitest` | unit + integration tests |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run db:studio` | Prisma Studio |

## Bidding rules (lowest unique bid)

**Authoritative engine:** `src/lib/engine.ts` (pure) — settlement service: `src/services/results.ts`.

Default demo rule (applied consistently in DB, UI, and tests):

1. Only bids accepted before the draw's closing time (server clock is authoritative) are eligible.
2. **Each accepted bid is one entry.** If the *same participant* (or anyone) bids the same amount twice, that amount is used by two entries and is therefore not unique.
3. An amount is *unique* when exactly one eligible entry used it.
4. The winner is the participant of the **lowest unique amount**.
5. If no amount occurs exactly once, the draw has **no winner**.

Changing this rule (e.g. tallying *distinct participants* instead of entries) requires updating `engine.ts`, the settlement query, the UI copy on draw/state pages, the tests, and this README together.

### Server-side safety measures

- All bid validation + credit deduction happens in one DB transaction (`submitBid`).
- No floating point is used for money: bids are stored and compared as exact `DECIMAL(14,4)` values; the pure engine operates on decimal strings.
- Demo-credit deduction runs inside the transaction and is guarded by a `SELECT … FOR UPDATE` row lock on the user — concurrent bids can never drive the balance negative or double-spend.
- Result settlement is **idempotent**: a `DrawResult` row has a unique constraint on `drawId`; repeated or concurrent settlement calls are no-ops that return the existing row.
- Malformed, negative, zero, or out-of-range amounts are rejected server-side; the browser form is only a convenience.

## Demo credits (not currency)

- New accounts receive `STARTING_DEMO_CREDITS` (configurable in `.env`).
- Each bid consumes a per-draw demo-credit fee (`bidCreditFee`, falling back to `BID_DEMO_CREDIT_FEE`).
- An immutable ledger (`DemoCreditTransaction`) records every movement (`AWARD`, `BID_FEE`, `REFUND`, `ADJUSTMENT`) with the resulting balance.
- The balance can never become negative. Demo credits are clearly labelled as simulated — **no real value, not withdrawable**. Payments, crypto, and withdrawal features are intentionally not implemented.

## Admin

`/admin` is protected on the server: the layout re-reads the user's role from the database on every request; hidden UI alone is never relied on. Capabilities:

- **Dashboard**: users, active/upcoming/completed draws, total demo bids, recent administrative activity (audit log).
- **Draws**: create/edit draws — slug, title, prize, description, currency, bid precision, min/max bid, demo-credit fee, status (DRAFT → UPCOMING → ACTIVE / PAUSED → CLOSED → SETTLED), gallery images. Settled results are never edited without an explicit audited correction.
- **Users**: search/filter, suspend/reactivate (audited), view bid counts, adjust demo credits only via audited adjustment (logged to `AdminAuditLog`).
- **Results**: preview eligible bids + uniqueness counts for closed draws, settle (idempotent), public display after settlement with the settling actor recorded.

## Database schema

Models in `prisma/schema.prisma`: `User`, `Account`, `Session`, `VerificationToken`, `Draw`, `PrizeImage`, `Bid`, `DrawResult`, `DemoCreditTransaction`, `AdminAuditLog` — normalized, with FKs, unique constraints (`users.email`, `draws.slug`, `draw_results.drawId`), indexes (draw status+closing time, opening/closing time, bids per draw+amount, bids per user), timestamps, enums for roles/statuses/tx types, and explicit `DECIMAL` money columns.

Migrations live in `prisma/migrations`. Never reset/delete the database without explicit permission.

## What has been verified

- `npx tsc --noEmit` — clean.
- `npx vitest run` — 17/17 tests pass (pure engine incl. invalid amounts, duplicates, ties, out-of-range; DB integration incl. credit deduction, late-bid rejection, concurrent race-safe submissions, idempotent settlement).
- `npm run build` — production build succeeds.
- Homepage returns 200 and unknown routes return the custom 404 (verified against a running dev server).

## What was **not** fully verified

- MySQL **was** reachable (MariaDB) and migrations/seed/tests/build ran against it. A direct end-to-end browser test of registration → bid → settlement UI has **not** been executed here (Playwright is configured with smoke tests; run `npm run test:e2e` locally for that).
- No email delivery (contact form only records to audit log — intentional in demo).

## Deployment notes

- Provide real `DATABASE_URL` + `AUTH_SECRET` + admin env vars via the platform's secret management; do not commit `.env`.
- Default rule documented above; the entire application is demo-only.
