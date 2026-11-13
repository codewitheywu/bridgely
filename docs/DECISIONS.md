# Decision log

One line per non-obvious call: date — decision — why — alternative rejected.

- 2026-11-14 — Postgres functions own all point/stock changes (one transaction each) — accuracy can't depend on client code — computing totals in Next.js server actions
- 2026-11-14 — Ledger table + cached `points_balance` with `CHECK >= 0` — full audit trail and fast reads; the constraint is the last line of defense — balance computed on every read
- 2026-11-14 — Idempotency key + per-user row lock + disabled button — double clicks and parallel tabs can't double-spend — button disabling alone
- 2026-11-14 — Cart with checkout (not single-item redeem) — closer to Qarrot and the brief's "check out" wording — one-click redeem per reward
- 2026-11-14 — Cart stores only ids + quantities in localStorage — prices and stock always read fresh, so nothing stale is trusted — a DB cart table (more code, no accuracy gain)
- 2026-11-14 — Soft delete for rewards (`is_active`) — past orders keep their references — hard delete
- 2026-11-14 — Explicit table grants (anon gets nothing) — works with Supabase "auto-expose tables" off — relying on default grants
- 2026-11-14 — Demo login buttons with a server-only password — assessors test all roles in one click without exposing credentials to the browser — passwords only in the README
- 2026-11-14 — "Soft Cloud" UI (soft UI + glass accents) with AA-checked text colors — user's pick from three mockups; colors adjusted for contrast — flat brand style
- 2026-11-14 — Parked peer recognition, campaigns, leaderboards, budgets — outside the brief; README lists them as next steps — building Qarrot's full feature set
