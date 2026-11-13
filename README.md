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
1. **Home** shows your balance, recent recognitions and latest orders.
2. **Points** lists every award, redemption and refund, with a running balance.
3. **Rewards**: browse the catalog (image, description, price in points, stock) and **Add to cart**.
4. **Cart**: change quantities and check the "balance after" line, then **Redeem**. Checkout is blocked if you can't afford the cart or an item is out of stock.
5. **Orders** shows your redemption history with Pending / Fulfilled / Cancelled status.

**As the admin**
1. **Overview** has pending-order and low-stock counts, employee balances, and the **Award points** form (employee, points, message).
2. **Rewards**: add a reward, or open **Edit** on any reward to change its name, description, price, stock or image, or to deactivate it. Rewards are never deleted, so old orders keep their history.
3. **Orders**: filter by status, then **Mark fulfilled** or **Cancel order**. Cancelling refunds the points and restores the stock automatically.

**Things to try:** double-click **Redeem** (only one order is created). Try buying the *Company hoodie* (out of stock) or *Wireless earbuds* (more than Maria can afford). Log in as Maria and open `/admin` (you're redirected). Cancel an order and watch Maria's balance and the stock come back.

## How it works

- **Stack:** Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth, Storage), Vercel.
- **The database is the source of truth.** Every change to points or stock runs inside one Postgres function and one transaction: `award_points`, `redeem_cart`, `fulfill_order` and `cancel_order`. The browser only sends reward IDs and quantities. Prices and totals are always computed in the database.
- **No duplicate orders.** Each checkout carries an idempotency key with `unique(user_id, idempotency_key)`, plus a per-user row lock. The Redeem button is also disabled while a request is in flight.
- **Permissions are enforced by the database, not just the UI.** Every table has row-level security, so employees can read only their own rows. All writes go through functions that check the caller's role. A `CHECK (points_balance >= 0)` constraint means balances can't go negative. A signup can never choose its own role.
- **Security headers** (frame denial, nosniff, HSTS, referrer policy) are on every page. The service-role key is used only by the local seed script.

**Verified against the live database:**
- 5 parallel checkouts with the same key create 1 order.
- Checkout deducts the exact points and stock.
- Insufficient points, out of stock, and negative-quantity or price tampering are all rejected.
- An employee can't award points, edit their own balance, edit rewards, or see another employee's orders.
- Cancelling an order twice refunds only once.

## Run it locally

1. Create a Supabase project and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in its SQL Editor.
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key and service-role key, and set `DEMO_MODE` and `DEMO_PASSWORD`.
3. `npm install`, then `npm run seed` to create the demo accounts, 6 rewards, awards and sample orders. The seed is safe to re-run.
4. `npm run dev` and open http://localhost:3000.

## AI tools used

- **Claude Code** (Anthropic, model Claude Opus 5.5) in VS Code wrote the code: planning, database schema and security design, Next.js pages, the seed script, and the verification scripts. Project-specific "skills" (team-lead, web developer, UI/UX, database, security, QA) kept it consistent with the brief.
- The UI direction ("Soft Cloud": soft UI with glass accents) was chosen from three mockups that Claude generated.

## Known limitations / unfinished

- **Reward images are placeholders** until an admin uploads one (Admin → Rewards → Edit). Landing-page screenshots are placeholders too.
- **The demo buttons let anyone with the link log in as any test account.** This is intentional for assessment; set `DEMO_MODE=false` to hide them.
- **No password reset**, profile editing or admin-user management. Promoting a user to admin is done in SQL.
- **The rewards catalog has no search or category filter**, and lists have no pagination. That's fine for demo-sized data.
- **The cart is stored in the browser** (per user, per device). Orders, balances and stock are all stored in the database.
- **Dates are formatted on the server (UTC)**, so they can be off by a day near midnight in your time zone.
- **No automated end-to-end test suite.** The behavior above was verified with scripts against the live database.
