# TB Rewards — Employee Recognition & Rewards (Talent Bridging test project)

Paid test project ($50). A Qarrot/Applauz-style app: employees log in, receive recognition points, and redeem them for rewards. The assessor will try to break the workflows, so **points and inventory accuracy plus permission enforcement matter more than polish.**

## Team skills (in `.claude/skills/`)
| Need | Skill |
|---|---|
| Planning, scope calls, "what should we do next", README, walkthrough prep | `/senior-team-lead` |
| Next.js pages, server actions, API wiring, deployment | `/senior-web-developer` |
| Layout, tokens, components, mobile, empty/loading states | `/senior-uiux-designer` |
| Schema, RLS, Postgres functions, seed data, migrations | `/senior-database-developer` |
| Threat model, permission audit, abuse cases | `/senior-cybersecurity` |
| Test plan, test runs, bug reports, release sign-off | `/senior-qa-specialist` |

When a task spans several areas, start with `/senior-team-lead`. It splits the work and sends each part to the right skill.

## Stack (default)
- **Next.js (App Router, latest stable) + TypeScript + Tailwind CSS v4**
- **Supabase**: Postgres, Auth (email + password), Row Level Security, Storage for reward images
- **Vercel** for the public demo link. Free tier, and data stays saved across refreshes and logouts.
- `@supabase/ssr` for server-side auth; `zod` for input validation

## Non-negotiable rules
1. **The database is the source of truth.** Every change to points or stock happens inside a single Postgres function (`award_points`, `redeem_cart`, `cancel_order`, `fulfill_order`) running in one transaction. The client never computes a price, a total, or a balance that gets saved.
2. **Idempotent checkout.** Each checkout attempt carries an `idempotency_key` (uuid). The DB has `unique(user_id, idempotency_key)`, so a replayed key returns the existing order. The UI also disables the button while a request is in flight. Both layers are required.
3. **RLS on every table.** Employees can read only their own rows. Every write goes through `SECURITY DEFINER` functions that check `auth.uid()` and the user's role *inside the function*.
4. **No hard deletes for rewards.** Deactivate them instead, so past orders keep their references.
5. **Balances can't go negative.** A `CHECK (points_balance >= 0)` constraint backs up the application logic.
6. The service-role key is used only by server-side scripts (seeding). It never goes in `NEXT_PUBLIC_*` variables or client bundles.

## Functional scope (from the brief)
**Employee**: login · points balance + history · rewards catalog (image, description, price in points) · cart checkout · redemption history + order status
**Admin**: award points with a short message · add, edit, and deactivate rewards · set price and stock · view all redemptions · mark orders fulfilled or cancelled · cancelling an order automatically refunds the points and restores the stock
**Rules**: employees see only their own data · only admins award points or manage rewards · checkout is blocked when points are insufficient or an item is out of stock · checkout deducts the exact points and stock · double-clicks create no duplicate orders or deductions · all data persists

## Demo data
- `admin@example.com`, `maria@example.com`, `juan@example.com`. Shared demo password set in `.env` / seed script.
- At least 6 rewards: one out of stock and one inactive, so the edge cases can be shown.
- Pre-seeded award history so the dashboards aren't empty.

## Brand (Talent Bridging style)
Poppins · primary orange `#E86B32` · navy `#1C234B` · surface `#F4F6FC` · text `#333333` · muted `#69727D` · border `#C4C4C4` · pill buttons (45px radius) · 12px card radius · flat, no shadows. The full spec is in the `senior-uiux-designer` skill.

## Definition of done
Every requirement in the brief passes the QA test plan on desktop and on a 375px mobile viewport, against the **deployed** URL, followed by a README covering the demo, the AI tools used, and known limitations.
