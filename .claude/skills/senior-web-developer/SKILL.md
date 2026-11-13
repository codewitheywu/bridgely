---
name: senior-web-developer
description: Senior full-stack web developer for the Next.js App Router + TypeScript + Tailwind v4 + Supabase stack — routes, layouts, server actions, auth/session handling, calling Postgres RPCs, form validation, error mapping, cart state, and Vercel deployment. Use this whenever the user wants to build or fix a page, component, form, API/server action, login/logout, route protection, checkout flow, admin screen, environment variables, or deploy — even for small "make this button work" requests.
---

# Senior Web Developer

You build the app on top of the database contract owned by `senior-database-developer` (`.claude/skills/senior-database-developer/schema.sql`). Read `CLAUDE.md` for scope and rules. The frontend is a *client* of the money logic and never re-implements it.

## Project structure
```
src/
  app/
    (auth)/login/page.tsx
    (employee)/layout.tsx          # requires role=employee
      dashboard/page.tsx           # balance, recent recognitions, recent orders
      rewards/page.tsx             # catalog grid + search/category chips
      rewards/[id]/page.tsx        # detail + add to cart
      cart/page.tsx                # review + checkout
      orders/page.tsx              # redemption history + status
      points/page.tsx              # ledger history
    (admin)/admin/layout.tsx       # requires role=admin
      admin/page.tsx               # overview: pending orders, quick award
      admin/award/page.tsx
      admin/rewards/page.tsx       # list + activate/deactivate
      admin/rewards/new/page.tsx
      admin/rewards/[id]/page.tsx  # edit
      admin/orders/page.tsx        # filter by status, fulfill/cancel
      admin/employees/page.tsx     # balances + ledger link
    layout.tsx                     # Poppins via next/font, tokens
  components/ui/                   # Button, Card, Input, Chip, Badge, Dialog, EmptyState, Skeleton
  lib/
    supabase/server.ts             # createServerClient (@supabase/ssr) with cookies
    supabase/client.ts             # createBrowserClient
    auth.ts                        # getSessionProfile(), requireRole()
    errors.ts                      # DB error code → user message
    cart.ts                        # cart store (localStorage, per-user key)
  actions/                         # 'use server' actions, one file per domain
middleware.ts                      # refresh session + redirect unauthenticated
scripts/seed.ts
```

## Auth and route protection
- `middleware.ts` refreshes the Supabase session cookie and redirects unauthenticated users to `/login`.
- **Role checks run in the server layouts** (`requireRole('admin')`) using the profile from the DB, never a client flag or JWT metadata the user can edit. A wrong role redirects to that role's home.
- This is UX only. The real enforcement is RLS + RPC checks in the DB. Never rely on hidden buttons for security.
- After login, route by role: admin → `/admin`, employee → `/dashboard`. Logout is a server action that calls `signOut()` and clears the cart key.

## Data access patterns
- Reads happen in **Server Components** with the cookie-bound server client, so RLS applies as the logged-in user.
- Writes go through **server actions** that (1) validate with `zod`, (2) call the RPC with the user's session client, (3) map errors, (4) `revalidatePath` the affected pages, and (5) return `{ ok: true, data } | { ok: false, error }`. Don't throw raw errors to the client.
- Never use the service-role key in the app. It's for `scripts/seed.ts` only.
- Rewards CRUD writes go directly to the `rewards` table (RLS restricts them to admins). Image upload goes to the `reward-images` bucket. Validate type (png/jpg/webp) and size (≤ 2MB) client-side too, for fast feedback.

## Checkout: the critical path
```ts
// cart page (client)
const [idemKey, setIdemKey] = useState(() => crypto.randomUUID());
const [pending, startTransition] = useTransition();

function onConfirm() {
  if (pending) return;                       // guard against double click
  startTransition(async () => {
    const res = await redeemCart({ items, idempotencyKey: idemKey });
    if (res.ok) { clearCart(); router.push(`/orders?placed=${res.data.order_number}`); }
    else showError(res.error);               // keep the SAME key → a retry stays idempotent
  });
}
// Generate a new key only when the cart contents change.
```
- The button is `disabled={pending}` and shows "Redeeming…". Also disable it when the cart total exceeds the balance or any line is out of stock.
- Send only `{ reward_id, quantity }`. The DB computes prices. Show the client-side total only as a preview.
- After success, re-fetch the balance (revalidate the layout that shows it), so the header updates instantly.
- Cart stock can be stale. On `OUT_OF_STOCK:<name>` or `REWARD_INACTIVE`, highlight that line and let the user remove it.

## Error mapping (`lib/errors.ts`)
Parse `error.message` from the RPC:
| Code | User message |
|---|---|
| `INSUFFICIENT_POINTS:need:have` | "You need {need-have} more points for this redemption." |
| `OUT_OF_STOCK:name` | "{name} just went out of stock. Remove it to continue." |
| `REWARD_INACTIVE` | "One item is no longer available." |
| `INVALID_QUANTITY` / `CART_TOO_LARGE` | "Please check your cart quantities." |
| `FORBIDDEN` | "You don't have permission to do that." |
| `ORDER_NOT_PENDING` | "This order was already processed." |
| `INVALID_POINTS` / `INVALID_MESSAGE` | Field-level messages on the award form |
| anything else | "Something went wrong. Please try again." (log the raw error server-side) |

## Admin actions
- **Award points**: employee select (searchable), points (1–10,000), message (1–280 characters, with a live counter). Call `award_points`. On success, show a toast and reset the form.
- **Orders**: filter tabs All / Pending / Fulfilled / Cancelled. Fulfill and Cancel are allowed only on pending orders. Cancel opens a confirm dialog with an optional reason and says "Points will be refunded and stock restored." Disable both buttons while a request is in flight.
- **Rewards**: show inactive rewards greyed out with an "Inactive" badge. The toggle calls an update. There is no delete button.

## Mobile
Build mobile-first. Below `md` (768px): employees get a bottom tab bar (Home, Rewards, Cart, Orders, Points), admins get a top bar with a menu sheet, and tables turn into stacked cards. Touch targets are at least 44px. Test at 375px.

## Deployment (Vercel)
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_DEMO_MODE=true` (shows the demo login buttons). `SUPABASE_SERVICE_ROLE_KEY` is only needed locally for seeding. Don't add it to Vercel unless a server-only reset-demo route needs it.
- Supabase Auth → URL config: set the Site URL to the Vercel domain.
- Before calling it done: `npm run build` passes, `tsc --noEmit` is clean, and the deployed URL is smoke-tested (log in as each role).

## Code standards
- Strict TypeScript. Generate DB types with `supabase gen types typescript` → `src/lib/database.types.ts`.
- Small components, no premature abstraction. Server Components by default, `'use client'` only where state or events need it.
- Every list has loading (skeleton), empty, and error states. Ask `senior-uiux-designer` for the specs.
- Never render user text with `dangerouslySetInnerHTML`.
