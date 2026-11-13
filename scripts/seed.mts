// Demo data. Safe to re-run. Usage: npm run seed   (reads .env.local)
// Uses the service-role key: local only, never in the app or Vercel.
import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anon, SUPABASE_SERVICE_ROLE_KEY: service, DEMO_PASSWORD: password } = process.env;
if (!url || !anon || !service || !password) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DEMO_PASSWORD in .env.local");
if (password.length < 8) throw new Error("DEMO_PASSWORD must be at least 8 characters");

const opts = { auth: { persistSession: false } };
const admin = createClient(url, service, opts);
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped client in a one-off script
const ok = ({ data, error }: { data: any; error: unknown }) => { if (error) throw error; return data; };

// 1. Users (the signup trigger creates their profiles)
const people = [["admin@example.com", "Ana Admin"], ["maria@example.com", "Maria Santos"], ["juan@example.com", "Juan Dela Cruz"]];
const id: Record<string, string> = {};
for (const [email, full_name] of people) {
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
  if (error && !["email_exists", "user_already_exists"].includes(error.code ?? "")) throw error;
  id[email] = ok(await admin.from("profiles").select("id").eq("email", email).single()).id;
}
ok(await admin.from("profiles").update({ role: "admin" }).eq("email", "admin@example.com"));

// 2. Rewards (only into an empty catalog): one out of stock, one inactive
if (!ok(await admin.from("rewards").select("id").limit(1)).length) {
  ok(await admin.from("rewards").insert([
    { name: "Coffee voucher", description: "A free drink at the office café.", category: "Food", price_points: 150, stock: 50 },
    { name: "Movie tickets (2)", description: "Two standard cinema tickets.", category: "Experiences", price_points: 400, stock: 20 },
    { name: "Wireless earbuds", description: "Bluetooth earbuds with charging case.", category: "Tech", price_points: 1500, stock: 5 },
    { name: "Extra day off", description: "One additional paid leave day.", category: "Time off", price_points: 2000, stock: 10 },
    { name: "Company hoodie", description: "Soft navy hoodie with the TB logo.", category: "Merch", price_points: 600, stock: 0 },
    { name: "Lunch with the CEO", description: "Retired reward kept for order history.", category: "Experiences", price_points: 800, stock: 3, is_active: false },
  ], { defaultToNull: false })); // missing keys use DB defaults, not null
}

// 3. Awards + sample orders through the real DB functions, signed in as each user
const signIn = async (email: string) => {
  const c = createClient(url, anon, opts);
  ok(await c.auth.signInWithPassword({ email, password }));
  return c;
};
const sa = await signIn("admin@example.com");
const awards: [string, number, string][] = [
  ["maria@example.com", 500, "Welcome to the team!"],
  ["maria@example.com", 400, "Shipped the onboarding revamp ahead of schedule."],
  ["maria@example.com", 300, "Great demo to the client."],
  ["juan@example.com", 200, "Welcome to the team!"],
  ["juan@example.com", 100, "Thanks for covering the support queue."],
];
for (const [email, points, message] of awards) {
  const done = ok(await admin.from("recognitions").select("id").eq("recipient_id", id[email]).eq("message", message).limit(1)).length;
  if (!done) ok(await sa.rpc("award_points", { p_recipient: id[email], p_points: points, p_message: message }));
}

// Fixed idempotency keys: re-running returns the same orders instead of creating new ones.
const rewardId = async (name: string) => ok(await admin.from("rewards").select("id").eq("name", name).single()).id;
const maria = await signIn("maria@example.com");
const fulfilled = ok(await maria.rpc("redeem_cart", { p_items: [{ reward_id: await rewardId("Coffee voucher"), quantity: 1 }], p_idempotency_key: "00000000-0000-4000-8000-000000000001" }));
ok(await sa.rpc("fulfill_order", { p_order_id: fulfilled.id }));
ok(await maria.rpc("redeem_cart", { p_items: [{ reward_id: await rewardId("Movie tickets (2)"), quantity: 1 }], p_idempotency_key: "00000000-0000-4000-8000-000000000002" }));

// 4. Sample demo requests (needs migration 0002; skipped if it hasn't been run yet)
const reqs = await admin.from("demo_requests").select("id").limit(1);
if (reqs.error) console.warn("Skipped demo requests: run supabase/migrations/0002_demo_requests.sql first.");
else if (!reqs.data.length) ok(await admin.from("demo_requests").insert([
  { name: "Jordan Lee", work_email: "jordan.lee@northwind.example", company: "Northwind Traders", company_size: "51-200", message: "We want to replace our spreadsheet-based shout-outs before Q1." },
  { name: "Priya Nair", work_email: "priya@brightpath.example", company: "BrightPath Clinics", company_size: "201-1000", message: "Interested in rewards for staff across 12 clinics." },
]));

console.log("Seeded: admin / maria / juan, 6 rewards, awards, 2 orders for Maria, sample demo requests.");
