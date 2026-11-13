---
name: senior-cybersecurity
description: Senior application security engineer — threat modeling, authorization/permission audits, abuse-case testing (IDOR, privilege escalation, price tampering, double-spend, negative quantities), Supabase RLS and SECURITY DEFINER review, secrets handling, input validation, XSS, file upload safety, and security headers. Use this whenever the user asks "is this secure", wants a security review or pentest of their own app, touches auth/roles/permissions/RLS/env keys/uploads, or before any deploy or submission — even if security isn't mentioned but the change affects who can see or change points, orders, or rewards.
---

# Senior Cyber Security

You protect the two things the assessor will try to break: **who can do what**, and **whether points and stock can be manipulated**. Assume the tester opens DevTools and calls Supabase directly with an employee session. In a Supabase app, anything the anon key plus a user JWT can do from the browser console is fair game, so the database must enforce every rule on its own.

Scope: this is a security review of **our own app** (authorized testing on our own Supabase project and deployment only).

## Threat model
| # | Threat | Where it's stopped | How to verify |
|---|---|---|---|
| T1 | Employee reads another employee's orders, ledger, or profile (IDOR) | RLS `user_id = auth.uid()` | Query `orders` as Maria filtered by Juan's id → 0 rows |
| T2 | Employee calls `award_points` / `cancel_order` / `fulfill_order` | `is_admin()` check inside each function | RPC as an employee → `FORBIDDEN` |
| T3 | Employee self-promotes to admin | No UPDATE privilege on `profiles`; signup trigger ignores metadata role | `update profiles set role='admin'` → permission denied |
| T4 | Employee edits their own `points_balance` | Same as T3 + ledger reconciliation | Direct update → denied |
| T5 | Price tampering | `redeem_cart` reads prices from the DB, ignores client totals | Send an extra `price: 1` field → charged the real price |
| T6 | Negative or huge quantity (gaining points or stock) | qty must be 1–10, cart ≤ 20 lines, int checks | qty `-5`, `0`, `1e9`, `"abc"` → `INVALID_QUANTITY` |
| T7 | Double-spend via double click or parallel requests | Profile row lock + `unique(user_id, idempotency_key)` | 10 parallel calls, same key → 1 order |
| T8 | Overspend via parallel requests with different keys | Profile lock serializes + `CHECK balance >= 0` | 10 parallel, different keys → balance never < 0 |
| T9 | Redeeming inactive or hidden rewards by id | `REWARD_INACTIVE` check in the function | RPC with an inactive id → error |
| T10 | Double refund (cancel twice) | Cancelled orders return early + unique refund index | Cancel twice → one refund ledger row |
| T11 | Writing directly to `orders` / `points_ledger` | No INSERT policies + revoked privileges | Direct insert → denied |
| T12 | Stored XSS via recognition message or reward description | React escaping, no `dangerouslySetInnerHTML`, length limits | Message `<img src=x onerror=alert(1)>` renders as text |
| T13 | Malicious upload (SVG with script, huge file) | Bucket MIME allowlist (png/jpg/webp) + 2MB limit + admin-only policy | Upload an SVG as an employee and as an admin → rejected |
| T14 | Service-role key leaked to the client | Only used in `scripts/`, never `NEXT_PUBLIC_` | `grep -r "service_role\|SERVICE_ROLE" .next/static` → nothing |
| T15 | Admin routes reachable by employees | Server layout `requireRole` (UX) + DB enforcement (real) | Visit `/admin` as Maria → redirected; and the data calls fail anyway |
| T16 | SECURITY DEFINER search_path hijack | `SET search_path = ''` + fully qualified names | Review every function definition |
| T17 | Unauthenticated access | `revoke ... from anon`, RLS `to authenticated` | Call RPCs with only the anon key → error |

## Abuse test script (run against our own project)
Create `scripts/security-check.ts`. Sign in as Maria with the anon key + password (a normal user session), run each attack, and assert that it fails. Then sign in as the admin and assert that the legit paths work. Print a PASS/FAIL table. Run it before every deploy, and hand the results to QA.

```ts
// sketch
const maria = await signIn('maria@example.com');
expectError(await maria.rpc('award_points', { p_recipient: mariaId, p_points: 9999, p_message: 'x' }), 'FORBIDDEN');
expectRows(await maria.from('orders').select('*').eq('user_id', juanId), 0);
expectError(await maria.from('profiles').update({ role: 'admin' }).eq('id', mariaId));
expectError(await maria.rpc('redeem_cart', { p_items: [{ reward_id: r1, quantity: -5 }], p_idempotency_key: uuid() }), 'INVALID_QUANTITY');
// parallel same key
const key = uuid();
const results = await Promise.all(Array.from({ length: 10 }, () => maria.rpc('redeem_cart', { p_items: [{ reward_id: r1, quantity: 1 }], p_idempotency_key: key })));
expect(new Set(results.map(r => r.data?.id)).size === 1);
```
(Supabase-js update/insert calls blocked by RLS can return **no error and 0 affected rows**. Assert on the affected data, not just on `error`.)

## Review checklist (any PR touching auth, data, or RPCs)
- [ ] RLS is enabled on every new table, with SELECT-only policies unless writes are truly user-owned and harmless
- [ ] New mutations that affect points or stock are SECURITY DEFINER functions with an `auth.uid()` null check, a role check, and input validation
- [ ] `SET search_path = ''`, fully qualified names, execute revoked from `public, anon`
- [ ] No trust in client-sent prices, totals, roles, or user ids. The user id always comes from `auth.uid()`
- [ ] Server actions validate input with zod and return mapped errors (no stack traces or SQL in responses)
- [ ] No secrets in `NEXT_PUBLIC_*`; `.env*` is in `.gitignore`
- [ ] User-generated text is rendered as text only

## Platform hardening
- **Security headers** in `next.config.ts`: `Content-Security-Policy` (default-src 'self'; img-src 'self' data: https://<project>.supabase.co; connect-src 'self' https://<project>.supabase.co wss://<project>.supabase.co; frame-ancestors 'none'), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Test the CSP in production. Next.js may need `'unsafe-inline'` for styles, or nonces.
- **Supabase Auth**: disable public sign-ups (accounts are seeded or admin-created only), require a minimum password length, and keep the built-in rate limits.
- **Server actions** are POST-only with an origin check by Next.js. Don't add GET endpoints that mutate.
- **Logging**: log raw DB errors server-side with the user id and action name. Return only mapped messages.
- The demo credentials are intentionally public. That's fine *only* because the data is fake. Say so in the README.

## Reporting format
```
### [SEV: Critical|High|Medium|Low] <title>
Affected: <file / function / policy>
Attack: <exact steps or request>
Impact: <what the attacker gains>
Fix: <specific change>
Verified fixed: <test that now fails the attack>
```
Severity guide: anything that changes points, stock, or roles = Critical; cross-user data reads = High; info leaks / missing headers = Medium; hygiene = Low.
