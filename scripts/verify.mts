// Production-readiness check against our own Supabase project. Usage: npm run verify   (reads .env.local)
// Runs DB integrity checks, concurrency tests and the T1–T17 threat model.
// Uses a temporary employee + reward and deletes them at the end, so demo data is untouched.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: service, DEMO_PASSWORD: password } = process.env;
if (!url || !anonKey || !service || !password) throw new Error("Set the Supabase keys and DEMO_PASSWORD in .env.local");

const opts = { auth: { persistSession: false } };
const svc = createClient(url, service, opts);
const anon = createClient(url, anonKey, opts);
const uuid = () => crypto.randomUUID();
let failed = 0;
const check = (id: string, title: string, ok: boolean, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${id.padEnd(4)} ${title}${detail ? `  (${detail})` : ""}`);
};
const signIn = async (email: string, pw = password) => {
  const c = createClient(url, anonKey, opts);
  const { error } = await c.auth.signInWithPassword({ email, password: pw });
  if (error) throw error;
  return c;
};
const balance = async (id: string) => (await svc.from("profiles").select("points_balance").eq("id", id).single()).data!.points_balance as number;
const stock = async (id: string) => (await svc.from("rewards").select("stock").eq("id", id).single()).data!.stock as number;
const redeem = (c: SupabaseClient, reward: string, quantity: unknown, key = uuid()) =>
  c.rpc("redeem_cart", { p_items: [{ reward_id: reward, quantity }], p_idempotency_key: key });

// ---------- Setup: temporary employee + reward ----------
const qaEmail = `qa-${Date.now()}@example.com`, qaPw = `Qa-${uuid()}`;
const created = await svc.auth.admin.createUser({ email: qaEmail, password: qaPw, email_confirm: true, user_metadata: { full_name: "QA Temp", role: "admin" } });
if (created.error) throw created.error;
const qaId = created.data.user.id;
const reward = (await svc.from("rewards").insert({ name: "QA temp reward", price_points: 500, stock: 100 }).select("id").single()).data!.id as string;
const inactive = (await svc.from("rewards").select("id").eq("is_active", false).limit(1).single()).data?.id as string;
const admin = await signIn("admin@example.com");
const maria = await signIn("maria@example.com");
const qa = await signIn(qaEmail, qaPw);
const mariaId = (await maria.auth.getUser()).data.user!.id;

try {
  console.log("\n— Security (threat model) —");
  check("T3", "Signup metadata can't grant admin", (await svc.from("profiles").select("role").eq("id", qaId).single()).data?.role === "employee");
  check("T1", "Employee can't read another employee's orders/ledger/profile",
    !(await qa.from("orders").select("id").eq("user_id", mariaId)).data?.length &&
    !(await qa.from("points_ledger").select("id").eq("user_id", mariaId)).data?.length &&
    !(await qa.from("profiles").select("id").eq("id", mariaId)).data?.length);
  for (const [fn, args] of [["award_points", { p_recipient: qaId, p_points: 9999, p_message: "x" }], ["fulfill_order", { p_order_id: uuid() }], ["cancel_order", { p_order_id: uuid(), p_reason: null }]] as const) {
    const r = await qa.rpc(fn, args);
    check("T2", `Employee calling ${fn} is refused`, r.error?.message === "FORBIDDEN", r.error?.message);
  }
  const promote = await qa.from("profiles").update({ role: "admin", points_balance: 99999 }).eq("id", qaId).select();
  check("T3/4", "Employee can't change own role or balance", !!promote.error || !promote.data?.length, promote.error?.code);

  await admin.rpc("award_points", { p_recipient: qaId, p_points: 1200, p_message: "QA starting balance" });
  const tamper = await qa.rpc("redeem_cart", { p_items: [{ reward_id: reward, quantity: 1, price: 1, unit_price_points: 1 }], p_idempotency_key: uuid(), });
  check("T5", "Client-sent price is ignored (charged real price)", tamper.data?.total_points === 500, `charged ${tamper.data?.total_points}`);
  await admin.rpc("cancel_order", { p_order_id: tamper.data?.id, p_reason: "QA cleanup" });
  for (const q of [-5, 0, 1e9, "abc", 11]) {
    const r = await redeem(qa, reward, q);
    check("T6", `Quantity ${JSON.stringify(q)} rejected`, r.error?.message === "INVALID_QUANTITY", r.error?.message);
  }
  check("T9", "Inactive reward can't be redeemed by id", (await redeem(qa, inactive, 1)).error?.message === "REWARD_INACTIVE");

  console.log("\n— Concurrency —");
  const b0 = await balance(qaId), s0 = await stock(reward); // 1200 (after the refunded T5 order)
  const many = await Promise.all(Array.from({ length: 10 }, () => redeem(qa, reward, 1)));
  const okCount = many.filter((r) => !r.error).length;
  check("T8", "10 parallel checkouts (different keys) never overspend", okCount === Math.floor(b0 / 500) && (await balance(qaId)) === b0 % 500,
    `${okCount} succeeded, balance ${b0} → ${await balance(qaId)}, ${many.filter((r) => r.error?.message.startsWith("INSUFFICIENT_POINTS")).length}× INSUFFICIENT_POINTS`);
  check("    ", "Stock decremented once per successful order", (await stock(reward)) === s0 - okCount);
  await admin.rpc("award_points", { p_recipient: qaId, p_points: 500, p_message: "QA top-up" });
  const b1 = await balance(qaId), key = uuid();
  const same = await Promise.all(Array.from({ length: 10 }, () => redeem(qa, reward, 1, key)));
  const ids = new Set(same.map((r) => r.data?.id));
  check("T7", "10 parallel checkouts (same key) → 1 order, 1 deduction", ids.size === 1 && !same.some((r) => r.error) && (await balance(qaId)) === b1 - 500, `${ids.size} order(s)`);
  const orderId = [...ids][0];
  const b2 = await balance(qaId);
  await Promise.all([admin.rpc("cancel_order", { p_order_id: orderId, p_reason: "QA" }), admin.rpc("cancel_order", { p_order_id: orderId, p_reason: "QA again" })]);
  const refunds = (await svc.from("points_ledger").select("id").eq("order_id", orderId).eq("reason", "refund")).data!.length;
  check("T10", "Cancelling twice (in parallel) refunds once", refunds === 1 && (await balance(qaId)) === b2 + 500, `${refunds} refund row(s)`);

  console.log("\n— Direct writes, uploads, anon access —");
  const ins = await qa.from("points_ledger").insert({ user_id: qaId, delta: 5000, reason: "adjustment", balance_after: 5000 }).select();
  const insO = await qa.from("orders").insert({ user_id: qaId, total_points: 1, idempotency_key: uuid() }).select();
  check("T11", "Direct inserts into ledger/orders are denied", (!!ins.error || !ins.data?.length) && (!!insO.error || !insO.data?.length));
  const rw = await qa.from("rewards").update({ price_points: 1 }).eq("id", reward).select();
  check("T11", "Employee can't edit rewards", !!rw.error || !rw.data?.length);
  const del = await admin.from("rewards").delete().eq("id", reward).select();
  check("T11", "Even admins can't hard-delete rewards", !!del.error || !del.data?.length);
  const svg = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'], { type: "image/svg+xml" });
  const upE = await qa.storage.from("reward-images").upload(`qa-${uuid()}.png`, new Blob([new Uint8Array(10)], { type: "image/png" }));
  const upA = await admin.storage.from("reward-images").upload(`qa-${uuid()}.svg`, svg, { contentType: "image/svg+xml" });
  const big = await admin.storage.from("reward-images").upload(`qa-${uuid()}.png`, new Blob([new Uint8Array(2_200_000)], { type: "image/png" }), { contentType: "image/png" });
  check("T13", "Uploads: employee denied, SVG denied, >2MB denied", !!upE.error && !!upA.error && !!big.error);
  for (const fn of ["award_points", "redeem_cart"]) check("T17", `Anonymous call to ${fn} refused`, !!(await anon.rpc(fn, {})).error);
  check("T17", "Anonymous table reads return nothing", !(await anon.from("profiles").select("id")).data?.length && !(await anon.from("orders").select("id")).data?.length);

  console.log("\n— Book a demo —");
  const demoEmail = `qa-demo-${Date.now()}@example.com`;
  const demo = (email: string, extra: Record<string, unknown> = {}) =>
    anon.rpc("request_demo", { p_name: "QA Demo", p_email: email, p_company: "QA Co", p_size: "11-50", p_message: "test", ...extra });
  const first = await demo(demoEmail);
  check("DEMO", "Anyone can submit a valid demo request", !first.error, first.error?.message);
  const bad = await demo("not-an-email", { p_name: "Q", p_size: "huge" });
  check("DEMO", "Invalid fields are rejected", bad.error?.message === "INVALID_REQUEST", bad.error?.message);
  await demo(demoEmail); await demo(demoEmail);
  const spam = await demo(demoEmail);
  check("DEMO", "4th request from one email in a day is refused", spam.error?.message === "TOO_MANY_REQUESTS", spam.error?.message);
  check("DEMO", "Visitors and employees can't read requests", !(await anon.from("demo_requests").select("id")).data?.length && !(await qa.from("demo_requests").select("id")).data?.length);
  check("DEMO", "Admins can read requests", !!(await admin.from("demo_requests").select("id").eq("work_email", demoEmail)).data?.length);
  const direct = await anon.from("demo_requests").insert({ name: "Spam", work_email: "s@x.io", company: "Spam", company_size: "1-10" }).select();
  check("DEMO", "Direct inserts are denied", !!direct.error || !direct.data?.length);
  const signup = await anon.auth.signUp({ email: `qa-signup-${Date.now()}@example.com`, password: uuid() });
  check("AUTH", "Public self sign-up is disabled in Supabase", !!signup.error, signup.error?.message ?? "sign-up still enabled: turn it off in Supabase Auth settings");
  if (signup.data?.user) await svc.auth.admin.deleteUser(signup.data.user.id);

  console.log("\n— Code & build —");
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const src = walk("app").map((f) => readFileSync(f, "utf8")).join("\n");
  check("T12", "No dangerouslySetInnerHTML anywhere", !src.includes("dangerouslySetInnerHTML"));
  let leaked = false;
  try { leaked = walk(".next/static").some((f) => readFileSync(f, "utf8").includes(service)); } catch { leaked = false; }
  check("T14", "Service-role key not in client bundles", !leaked && !src.includes("SERVICE_ROLE"));
  const sql = readFileSync("supabase/migrations/0001_init.sql", "utf8");
  const definers = sql.split("create or replace function").slice(1);
  check("T16", "Every function pins search_path", definers.every((f) => f.slice(0, 400).includes("set search_path = ''")), `${definers.length} functions`);
} finally {
  // ---------- Cleanup: remove every trace of the temp user + reward ----------
  const orders = (await svc.from("orders").select("id").eq("user_id", qaId)).data!.map((o) => o.id);
  for (const id of orders) await svc.rpc("cancel_order", { p_order_id: id }).then(() => undefined, () => undefined);
  await svc.from("points_ledger").delete().eq("user_id", qaId);
  if (orders.length) await svc.from("order_items").delete().in("order_id", orders);
  await svc.from("orders").delete().eq("user_id", qaId);
  await svc.from("recognitions").delete().eq("recipient_id", qaId);
  await svc.from("rewards").delete().eq("id", reward);
  await svc.auth.admin.deleteUser(qaId);
  await svc.from("demo_requests").delete().like("work_email", "qa-demo-%");
}

console.log("\n— Database integrity —");
const [{ data: profiles }, { data: ledger }, { data: orders }, { data: items }, { data: rewards }] = await Promise.all([
  svc.from("profiles").select("id, points_balance"), svc.from("points_ledger").select("user_id, delta"),
  svc.from("orders").select("id, total_points"), svc.from("order_items").select("order_id, unit_price_points, quantity"),
  svc.from("rewards").select("id, stock"),
]);
const drift = profiles!.filter((p) => p.points_balance !== ledger!.filter((l) => l.user_id === p.id).reduce((s, l) => s + l.delta, 0));
check("DB1", "Every balance equals its ledger sum", !drift.length, `${profiles!.length} accounts`);
const bad = orders!.filter((o) => o.total_points !== items!.filter((i) => i.order_id === o.id).reduce((s, i) => s + i.unit_price_points * i.quantity, 0));
check("DB2", "Every order total equals its items", !bad.length, `${orders!.length} orders`);
check("DB4", "No negative stock or balances", !rewards!.some((r) => r.stock < 0) && !profiles!.some((p) => p.points_balance < 0));
check("DB5", "Temp QA data fully removed", !(await svc.from("profiles").select("id").eq("id", qaId)).data?.length);

console.log(`\n${failed ? `${failed} FAILED` : "ALL CHECKS PASSED"}`);
process.exit(failed ? 1 : 0);
