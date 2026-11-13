# TB Rewards: employee recognition & rewards demo

A working sample of a Qarrot-style recognition app. Admins award points with a message, and employees redeem those points for rewards in a catalog.

**Live demo:** <YOUR-VERCEL-URL>

## Test accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | `<DEMO_PASSWORD>` |
| Employee | maria@example.com | `<DEMO_PASSWORD>` |
| Employee | juan@example.com | `<DEMO_PASSWORD>` |

You can also skip typing: the login page has **Admin / Maria / Juan** demo buttons. You can create a new employee account on **Sign up**. New accounts start with 0 points.

## How to use the demo

**As an employee (Maria or Juan)**
1. **Home** shows your available, earned and redeemed points, a recognition feed, rewards within reach, and recent orders.
2. **Points** lists every award, redemption and refund, with a running balance.
3. **Rewards**: search or filter by category, then browse the catalog (image, description, price in points, stock) and **Add to cart**. Rewards you can't afford yet show exactly how many more points you need.
4. **Cart**: change quantities and check the "balance after" line, then **Redeem**. Checkout is blocked if you can't afford the cart or an item is out of stock.
5. **Orders** shows your redemption history with Pending / Fulfilled / Cancelled status.

**As the admin**
1. **Overview** has pending-order, points-awarded, active-reward and low-stock counts, the **Award points** form (employee, points, message), and a recent-recognition feed.
2. **Employees** lists each employee's balance, points earned and redeemed, and order count, with a one-click **Award** shortcut.
3. **Rewards**: add a reward, or open **Edit** on any reward to change its name, description, price, stock or image, or to deactivate it. Rewards are never deleted, so old orders keep their history.
4. **Orders**: filter by status (with counts), then **Mark fulfilled** or **Cancel order**. Cancelling refunds the points and restores the stock automatically.

**Things to try:** double-click **Redeem** (only one order is created). Try buying the *Company hoodie* (out of stock) or *Wireless earbuds* (more than Maria can afford). Log in as Maria and open `/admin` (you're redirected). Cancel an order and watch Maria's balance and the stock come back.

## How it works

- **Stack:** Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth, Storage), Vercel.
- **The database is the source of truth.** Every change to points or stock runs inside one Postgres function and one transaction: `award_points`, `redeem_cart`, `fulfill_order` and `cancel_order`. The browser only sends reward IDs and quantities. Prices and totals are always computed in the database.
- **No duplicate orders.** Each checkout carries an idempotency key with `unique(user_id, idempotency_key)`, plus a per-user row lock. The Redeem button is also disabled while a request is in flight.
- **Permissions are enforced by the database, not just the UI.** Every table has row-level security, so employees can read only their own rows. All writes go through functions that check the caller's role. A `CHECK (points_balance >= 0)` constraint means balances can't go negative. A signup can never choose its own role.
- **Security headers** (Content-Security-Policy, frame denial, nosniff, HSTS, referrer policy) are on every page. The service-role key is used only by local scripts.
- **Instant feedback:** navigation shows a skeleton immediately, every button shows a spinner while it works and can't be double-submitted, and results appear as toasts.

**Verified against the live database:**
- 5 parallel checkouts with the same key create 1 order.
- Checkout deducts the exact points and stock.
- Insufficient points, out of stock, and negative-quantity or price tampering are all rejected.
- An employee can't award points, edit their own balance, edit rewards, or see another employee's orders.
- Cancelling an order twice refunds only once.

## Quality checks

Two scripts run against the real Supabase project. Each creates a temporary employee and rewards, then deletes them, so demo data is never touched.

- `npm run verify` runs **31 checks**: the full security threat model, parallel-checkout concurrency, and database integrity (every balance equals its ledger, every order equals its items, nothing negative).
- `npm run e2e` runs **30 checks** that click through the real UI in Chrome, at desktop size and at 375px mobile. They cover login per role, award, catalog states, a triple-click on Redeem (1 order), persistence, permissions, cancel → refund, fulfil, add/edit/deactivate rewards, no horizontal scroll, and no console errors.

Latest run: **all 61 checks pass.**

## Run it locally

1. Create a Supabase project and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in its SQL Editor.
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key and service-role key, and set `DEMO_MODE` and `DEMO_PASSWORD`.
3. `npm install`, then `npm run seed` to create the demo accounts, 6 rewards, awards and sample orders. The seed is safe to re-run.
4. `npm run dev` and open http://localhost:3000.
5. Optional: `npm run verify`, plus `npm run build && npx next start -p 3125` and then `npm run e2e`.

## AI tools used

- **Claude Code** (Anthropic, model Claude Opus 5.5) in VS Code wrote the code: planning, database schema and security design, Next.js pages, the seed script, and the verification scripts. Project-specific "skills" (team-lead, web developer, UI/UX, database, security, QA) kept it consistent with the brief.
- The UI direction ("Soft Cloud": soft UI with glass accents) was chosen from three mockups that Claude generated.

## Known limitations / unfinished

- **Rewards show category artwork** until an admin uploads a photo (Admin → Rewards → Edit).
- **The demo buttons let anyone with the link log in as any test account.** This is intentional for assessment; set `DEMO_MODE=false` to hide them.
- **No password reset**, profile editing or admin-user management. Promoting a user to admin is done in SQL.
- **The cart is stored in the browser** (per user, per device). Orders, balances and stock are all stored in the database.
- **Dates are formatted on the server (UTC)**, so they can be off by a day near midnight in your time zone.
- **The CSP allows inline scripts.** Next.js needs them unless every page uses per-request nonces, which would stop pages from being prerendered.
