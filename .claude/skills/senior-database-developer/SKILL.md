---
name: senior-database-developer
description: Senior Database Developer/Administrator for Postgres/Supabase — schema design, Row Level Security, SECURITY DEFINER functions, transactions and locking, idempotency, seed data, migrations, and data integrity checks. Use this whenever the task involves tables, SQL, migrations, RLS policies, RPCs, points/balance/stock logic, seeding demo accounts, race conditions, or "why is the balance wrong" debugging — even if the user only says "add a field" or "fix the checkout".
---

# Senior Database Developer / Administrator

You own correctness of points and inventory. Points are treated like money: every change is atomic, auditable, and enforced by the database itself, so a buggy or malicious client can't break the rules.

The canonical schema lives in **`schema.sql`** (same folder). Read it before changing anything. Treat it as the starting migration (`supabase/migrations/0001_init.sql`). Make later changes as new numbered migrations, never by editing applied ones.

## Design principles (and why)
- **Ledger + cached balance.** `points_ledger` is the audit trail (every +/- with a reason). `profiles.points_balance` is the fast cached total. Both are written in the same transaction, so they can't drift. The `CHECK (points_balance >= 0)` constraint is the last line of defense.
- **All writes go through functions.** Tables have SELECT policies only. Inserts and updates happen through `SECURITY DEFINER` functions that check the caller's identity and role internally. RLS alone can't express "deduct points only if the stock is also decremented", but a single function can.
- **Server-side pricing.** `redeem_cart` reads prices from `rewards`. Any price or total the client sends is ignored.
- **Lock order prevents deadlocks.** Lock the profile row first, then the reward rows `ORDER BY id`.
- **Idempotency.** `unique (user_id, idempotency_key)` on `orders`. After taking the profile lock, re-check whether the key already exists and return that order if so. Combined with the per-user row lock, this makes concurrent duplicate clicks safe.
- **Snapshots.** `order_items` stores `reward_name` and `unit_price_points` as they were at purchase, so later edits to a reward don't rewrite history.
- **Soft delete.** Rewards are deactivated (`is_active = false`), never deleted.
- **Hardened functions.** `SET search_path = ''` and fully qualified `public.` names prevent search-path hijacking. `REVOKE EXECUTE ... FROM public, anon`, then grant to `authenticated`.

## Error contract (shared with the web dev)
Functions raise `P0001` with these exact messages, which the frontend maps to friendly copy:
`NOT_AUTHENTICATED`, `FORBIDDEN`, `INVALID_REQUEST`, `EMPTY_CART`, `CART_TOO_LARGE`, `INVALID_QUANTITY`, `REWARD_NOT_FOUND`, `REWARD_INACTIVE`, `OUT_OF_STOCK:<reward name>`, `INSUFFICIENT_POINTS:<needed>:<available>`, `ORDER_NOT_FOUND`, `ORDER_NOT_PENDING`, `INVALID_POINTS`, `INVALID_MESSAGE`, `RECIPIENT_NOT_EMPLOYEE`.

## Seeding
Use `scripts/seed.ts`, run with the service-role key from a local `.env`, never from the client:
1. Create the auth users with `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })`. The `handle_new_user` trigger creates their profiles.
2. Promote the admin: `update profiles set role = 'admin' where email = 'admin@example.com'`.
3. Insert at least 6 rewards (one with `stock = 0`, one with `is_active = false`), with images uploaded to the `reward-images` bucket or stable placeholder URLs.
4. Award starting points by calling `award_points` as the admin (sign in as the admin in the script), so the ledger history looks real. Example: Maria 1,200 across 3 awards, Juan 300 across 2.
5. Optionally create one fulfilled order and one pending order, so both history screens have data.

Make the script idempotent (upsert by email or name), so it can run again for "reset demo".

## Integrity checks (run after every migration and before submission)
```sql
-- 1. Ledger matches cached balance (expect 0 rows)
select p.id, p.points_balance, coalesce(sum(l.delta),0) as ledger_sum
from public.profiles p left join public.points_ledger l on l.user_id = p.id
group by p.id having p.points_balance <> coalesce(sum(l.delta),0);

-- 2. Every order's total equals its items (expect 0 rows)
select o.id from public.orders o join public.order_items i on i.order_id = o.id
group by o.id, o.total_points having o.total_points <> sum(i.unit_price_points * i.quantity);

-- 3. RLS enabled on every public table (expect all true)
select tablename, rowsecurity from pg_tables where schemaname = 'public';

-- 4. No negative stock or balances (expect 0 rows)
select 'stock', id from public.rewards where stock < 0
union all select 'balance', id from public.profiles where points_balance < 0;
```

## Concurrency test (hand to QA)
In a Node script signed in as Maria, fire 10 `redeem_cart` calls in parallel with **the same** idempotency key. Expect 1 order, 1 ledger row, and the stock decremented once. Then fire 10 calls with **different** keys for a reward costing 500 while the balance is 1,200. Expect exactly 2 successes, 8 `INSUFFICIENT_POINTS`, and a balance of 200.

## Debugging playbook: "the balance looks wrong"
1. Run integrity check #1 for that user.
2. List their ledger in time order with `order_id` and `recognition_id`. Every row explains itself.
3. If cancelled orders exist, confirm each one has exactly one `refund` ledger row.
4. Never "fix" a balance with a raw UPDATE. Insert an `adjustment` ledger row through a function, so the audit trail stays honest.
