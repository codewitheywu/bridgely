// End-to-end QA through the real UI (Playwright + your installed Chrome).
// Usage: npm run build && npx next start -p 3125, then: npm run e2e   (BASE_URL overrides the target)
// Uses a temporary employee + rewards and deletes them at the end; demo data is untouched.
import { chromium, type Page } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE_URL ?? "http://localhost:3125";
const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: service, DEMO_PASSWORD: password } = process.env;
if (!url || !anonKey || !service || !password) throw new Error("Set the Supabase keys and DEMO_PASSWORD in .env.local");
const svc = createClient(url, service, { auth: { persistSession: false } });

let failed = 0;
const check = (id: string, title: string, ok: boolean, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${id.padEnd(8)} ${title}${detail ? `  (${detail})` : ""}`);
};
const balance = async (id: string) => (await svc.from("profiles").select("points_balance").eq("id", id).single()).data!.points_balance as number;
const stockOf = async (id: string) => (await svc.from("rewards").select("stock").eq("id", id).single()).data!.stock as number;

// ---------- Temp data ----------
const qaEmail = `qa-ui-${Date.now()}@example.com`, qaPw = `Qa-${crypto.randomUUID()}`;
const user = await svc.auth.admin.createUser({ email: qaEmail, password: qaPw, email_confirm: true, user_metadata: { full_name: "Quinn Tester" } });
if (user.error) throw user.error;
const qaId = user.data.user.id;
const temp = (await svc.from("rewards").insert({ name: "QA Desk plant", description: "Temporary QA reward", category: "Merch", price_points: 500, stock: 100 }).select("id").single()).data!.id as string;

const browser = await chromium.launch({ channel: "chrome" });
const consoleErrors: string[] = [];
async function newPage(viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  // The /signup 404 is expected (DEMO-03), so it isn't a console error worth failing on.
  page.on("console", (m) => { if (m.type() === "error" && !page.url().endsWith("/signup")) consoleErrors.push(`${page.url()}: ${m.text()}`); });
  page.on("dialog", (d) => d.accept());
  return page;
}
async function loginForm(page: Page, email: string, pw: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(pw);
  await page.getByRole("button", { name: "Log in" }).click();
}
// Waits for an element to appear (isVisible() alone never waits).
const seen = (l: ReturnType<Page["locator"]>, timeout = 10000) => l.first().waitFor({ timeout }).then(() => true, () => false);
const waitPath = (page: Page, path: string) => page.waitForURL((u) => u.pathname === path, { timeout: 15000 }).then(() => true, () => false);

try {
  // ---------- Auth ----------
  const emp = await newPage();
  await loginForm(emp, qaEmail, "wrong-password");
  check("AUTH-02", "Wrong password shows a generic error", await seen(emp.getByText("Invalid email or password.")));
  await loginForm(emp, qaEmail, qaPw);
  check("AUTH-01", "Employee login lands on /dashboard", await waitPath(emp, "/dashboard"));

  const adm = await newPage();
  await adm.goto(`${BASE}/login`);
  await adm.getByRole("button", { name: "admin" }).click();
  check("AUTH-01", "Admin sample-account button lands on /admin", await waitPath(adm, "/admin"));

  // ---------- Admin awards points ----------
  await adm.goto(`${BASE}/admin?to=${qaId}#award`);
  await adm.getByLabel("Points").fill("1200");
  await adm.getByLabel("Message").fill("Outstanding work on the launch!");
  await adm.getByRole("button", { name: "Send recognition" }).click();
  check("ADM-01", "Award shows a success toast", await seen(adm.getByText("Recognition sent")));
  check("ADM-01", "Balance increased by exactly 1,200", (await balance(qaId)) === 1200);

  await emp.goto(`${BASE}/dashboard`);
  check("EMP-01", "Dashboard shows balance and the recognition message",
    await seen(emp.getByText("1,200")) && await seen(emp.getByText("Outstanding work on the launch!")));

  // ---------- Catalog ----------
  await emp.goto(`${BASE}/rewards`);
  check("EMP-03", "Inactive reward is not listed", !(await emp.getByText("Lunch with the CEO").count()));
  const card = (name: string) => emp.locator("li.card", { hasText: name });
  check("EMP-06", "Unaffordable reward shows 'Need … more'", await card("Wireless earbuds").getByRole("button", { name: /Need 300 pts more/ }).isDisabled());
  check("EMP-07", "Out-of-stock reward is disabled", await card("Company hoodie").getByRole("button", { name: "Out of stock" }).isDisabled());
  await emp.getByPlaceholder("Search rewards").fill("desk plant");
  check("UX", "Search filters the catalog", (await emp.locator("li.card").count()) === 1);
  await card("QA Desk plant").getByRole("button", { name: "Add to cart" }).click();
  check("UX-03", "Add to cart gives a toast + cart badge", await seen(emp.getByText("QA Desk plant added to cart")) && await seen(emp.getByLabel("1 in cart")));
  await card("QA Desk plant").getByRole("button", { name: /Add another/ }).click();

  // ---------- Checkout: rapid triple-click ----------
  const s0 = await stockOf(temp);
  await emp.goto(`${BASE}/cart`);
  const redeemBtn = emp.getByRole("button", { name: /Redeem 1,000 pts/ });
  await redeemBtn.waitFor();
  await redeemBtn.evaluate((b: HTMLButtonElement) => { b.click(); b.click(); b.click(); }); // 3 clicks in one tick
  const placed = await emp.waitForURL(/\/orders\?placed=\d+/, { timeout: 15000 }).then(() => true, () => false);
  const orders = (await svc.from("orders").select("id, total_points").eq("user_id", qaId)).data!;
  check("EMP-08", "Triple-click Redeem creates exactly 1 order", placed && orders.length === 1, `${orders.length} order(s)`);
  check("EMP-05", "Exact deduction (2 × 500) and stock −2", (await balance(qaId)) === 200 && (await stockOf(temp)) === s0 - 2);
  check("EMP-04", "Order page confirms and shows Pending", await seen(emp.getByText(/placed! Your points have been deducted/)) && await seen(emp.getByText("pending")));

  // ---------- Persistence ----------
  await emp.reload();
  await emp.goto(`${BASE}/dashboard`);
  await emp.getByRole("button", { name: /Log out/ }).first().click();
  await waitPath(emp, "/");
  await emp.goto(`${BASE}/dashboard`);
  check("AUTH-03", "After logout, /dashboard redirects to /login", await waitPath(emp, "/login"));
  await loginForm(emp, qaEmail, qaPw);
  await waitPath(emp, "/dashboard");
  check("AUTH-04", "Balance persists after refresh + logout + login", await seen(emp.getByText("200")) && (await balance(qaId)) === 200);

  // ---------- Permissions ----------
  await emp.goto(`${BASE}/admin/orders`);
  check("PERM-01", "Employee opening /admin/orders is sent to /dashboard", await waitPath(emp, "/dashboard"));
  await adm.goto(`${BASE}/cart`);
  check("PERM-04", "Admin opening /cart is sent to /admin", await waitPath(adm, "/admin"));

  // ---------- Admin: cancel → refund ----------
  await adm.goto(`${BASE}/admin/orders?status=pending`);
  const orderCard = adm.locator("li.card", { hasText: "Quinn Tester" });
  await orderCard.getByLabel("Cancel reason").fill("Out of plants this week");
  await orderCard.getByRole("button", { name: "Cancel order" }).click();
  check("ADM-08", "Cancel shows a toast", await seen(adm.getByText(/cancelled\. Points refunded/)));
  check("ADM-08", "Points refunded exactly and stock restored", (await balance(qaId)) === 1200 && (await stockOf(temp)) === s0);

  // ---------- Admin: fulfil ----------
  const qaApi = createClient(url, anonKey, { auth: { persistSession: false } });
  await qaApi.auth.signInWithPassword({ email: qaEmail, password: qaPw });
  await qaApi.rpc("redeem_cart", { p_items: [{ reward_id: temp, quantity: 1 }], p_idempotency_key: crypto.randomUUID() });
  await adm.goto(`${BASE}/admin/orders?status=pending`);
  await adm.locator("li.card", { hasText: "Quinn Tester" }).getByRole("button", { name: "Mark fulfilled" }).click();
  check("ADM-07", "Fulfil shows a toast; balance unchanged", await seen(adm.getByText(/marked fulfilled/)) && (await balance(qaId)) === 700);
  const tryCancel = await (await import("@supabase/supabase-js")).createClient(url, anonKey, { auth: { persistSession: false } });
  await tryCancel.auth.signInWithPassword({ email: "admin@example.com", password });
  const done = (await svc.from("orders").select("id").eq("user_id", qaId).eq("status", "fulfilled").single()).data!.id;
  check("ADM-10", "A fulfilled order can't be cancelled", (await tryCancel.rpc("cancel_order", { p_order_id: done })).error?.message === "ORDER_NOT_PENDING");

  // ---------- Admin: add / edit / deactivate a reward ----------
  await adm.goto(`${BASE}/admin/rewards`);
  await adm.getByText("+ Add reward").click();
  const addForm = adm.locator("details[open] form").first();
  await addForm.getByLabel("Name").fill("QA Notebook set");
  await addForm.getByLabel("Description").fill("Temporary QA reward");
  await addForm.getByLabel("Price (pts)").fill("300");
  await addForm.getByLabel("Stock").fill("5");
  await addForm.getByLabel("Category").fill("Merch");
  await addForm.getByRole("button", { name: "Add reward" }).click();
  check("ADM-03", "New reward saved with a toast", await seen(adm.getByText("Reward added to the catalog")));
  await emp.goto(`${BASE}/rewards`);
  check("ADM-03", "New reward appears in the employee catalog", await seen(emp.getByText("QA Notebook set")));
  await adm.goto(`${BASE}/admin/rewards`);
  const row = adm.locator("li.card", { hasText: "QA Notebook set" });
  await row.locator("summary").click();
  await row.getByLabel("Price (pts)").fill("350");
  await row.getByRole("button", { name: "Save changes" }).click();
  await adm.getByText("QA Notebook set saved").waitFor({ timeout: 10000 }).catch(() => {});
  await emp.goto(`${BASE}/rewards`);
  check("ADM-04", "Price edit shows in the catalog", await seen(emp.locator("li.card", { hasText: "QA Notebook set" }).getByText("350 pts")));
  await adm.goto(`${BASE}/admin/rewards`);
  await row.locator("summary").click();
  await row.getByLabel(/Active/).uncheck();
  await row.getByRole("button", { name: "Save changes" }).click();
  await adm.getByText("QA Notebook set saved").waitFor({ timeout: 10000 }).catch(() => {});
  await emp.goto(`${BASE}/rewards`);
  check("ADM-05", "Deactivated reward disappears from the catalog", !(await emp.getByText("QA Notebook set").count()));

  // ---------- Click feel: instant feedback on navigation ----------
  await emp.goto(`${BASE}/dashboard`);
  await emp.waitForTimeout(1500); // let prefetching finish, like a real visit
  const t0 = Date.now();
  await emp.locator("aside").getByRole("link", { name: "Orders" }).click();
  await emp.waitForFunction(() => location.pathname === "/orders" || !!document.querySelector("[aria-busy=true]"));
  const feedback = Date.now() - t0;
  check("UX-03", "Navigation responds instantly (skeleton/URL change)", feedback < 300, `${feedback} ms`);

  // ---------- Book a demo (replaces public sign-up) ----------
  const demoEmail = `qa-ui-demo-${Date.now()}@example.com`;
  const pub = await newPage();
  await pub.goto(`${BASE}/book-a-demo`);
  await pub.getByLabel("Name *", { exact: true }).fill("Quinn Tester");
  await pub.getByLabel("Work email *").fill(demoEmail);
  await pub.getByLabel("Company name *").fill("QA Testing Co");
  await pub.getByLabel("Company size *").selectOption("11-50");
  await pub.getByLabel(/Tell us more/).fill("Looking for a recognition tool for 40 people.");
  await pub.getByRole("button", { name: "Get a demo" }).click();
  check("DEMO-01", "Book a demo form submits and confirms", await seen(pub.getByText("Thanks, we’ve got it!")));
  await adm.goto(`${BASE}/admin/requests`);
  check("DEMO-02", "Admin sees the new request", await seen(adm.getByText(demoEmail)));
  await pub.goto(`${BASE}/signup`);
  check("DEMO-03", "Old /signup page is gone (404)", await seen(pub.getByText("Page not found")));

  // ---------- How-to guide ----------
  await pub.goto(`${BASE}/guide`);
  for (let i = 0; i < 5; i++) await pub.getByRole("button", { name: /^Next/ }).click();
  check("GUIDE-01", "Next walks the steps and focuses each heading", new URL(pub.url()).hash === "#cart" && await pub.evaluate(() => document.activeElement?.id === "step-title"));
  await pub.goto(`${BASE}/guide#rules`);
  check("GUIDE-02", "A step link opens that step; the last step offers the demo", await seen(pub.getByRole("heading", { name: "Try to break it" })) && await seen(pub.getByRole("link", { name: "Start the demo" })));
  await emp.goto(`${BASE}/dashboard`);
  await emp.locator("aside").getByRole("link", { name: "How to use" }).click();
  check("GUIDE-03", "Signed-in users reach the guide from the sidebar", await waitPath(emp, "/guide"));

  // ---------- Mobile: no horizontal scroll ----------
  const m = await newPage({ width: 375, height: 812 });
  await loginForm(m, qaEmail, qaPw);
  await waitPath(m, "/dashboard");
  const wide: string[] = [];
  for (const p of ["/", "/login", "/book-a-demo", "/guide", "/dashboard", "/rewards", "/cart", "/orders", "/points"]) {
    await m.goto(BASE + p, { waitUntil: "networkidle" });
    if (await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)) wide.push(p);
  }
  check("UX-01", "No horizontal scroll at 375px", !wide.length, wide.join(", "));
  check("UX-04", "No console errors (incl. CSP violations)", !consoleErrors.length, consoleErrors.slice(0, 3).join(" | "));
} finally {
  await browser.close();
  const ids = (await svc.from("orders").select("id").eq("user_id", qaId)).data!.map((o) => o.id);
  await svc.from("points_ledger").delete().eq("user_id", qaId);
  if (ids.length) await svc.from("order_items").delete().in("order_id", ids);
  await svc.from("orders").delete().eq("user_id", qaId);
  await svc.from("recognitions").delete().eq("recipient_id", qaId);
  await svc.from("rewards").delete().in("name", ["QA Desk plant", "QA Notebook set"]);
  await svc.auth.admin.deleteUser(qaId);
  await svc.from("demo_requests").delete().like("work_email", "qa-ui-demo-%");
}
console.log(`\n${failed ? `${failed} FAILED` : "ALL UI CHECKS PASSED"}`);
process.exit(failed ? 1 : 0);
