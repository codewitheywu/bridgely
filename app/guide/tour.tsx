"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "../icons";

type Part = "start" | "employee" | "admin" | "rules";
type Step = { id: string; part: Part; title: string; icon: IconName; lead: string; href?: string; todo: string[]; see: string; tip?: string; why?: string };

const PARTS: Record<Part, string> = { start: "Getting started", employee: "Employee · Maria", admin: "Admin", rules: "Check the rules" };

const STEPS: Step[] = [
  { id: "welcome", part: "start", title: "How TB Rewards works", icon: "star",
    lead: "Admins thank employees with points. Employees spend those points on rewards. This guide walks through both sides, from logging in to logging out, in about 10 minutes.",
    todo: ["Open the app in a second tab, so you can follow along.", "Do the Employee steps as Maria first, then the Admin steps.", "Each step says where to go, what to do, and what you should see."],
    see: "Two roles: employees (Maria, Juan) earn and redeem points. The admin awards points and manages rewards and orders.",
    tip: "The login page has one-click Admin / Maria / Juan buttons. The emails and password are also in the README.",
    why: "Points are treated like money: the database checks and records every change, so totals are always exact." },
  { id: "employee-login", part: "employee", title: "Log in as Maria", icon: "login", href: "/login",
    lead: "Employees sign in with the account their company created for them. There's no public sign-up.",
    todo: ["Open Log in.", "Click the Maria button, or type maria@example.com and the demo password."],
    see: "You land on Home, with Maria's name and points in the sidebar.",
    tip: "Try a wrong password first: you get one general message that doesn't reveal which part was wrong." },
  { id: "home", part: "employee", title: "See your points", icon: "home", href: "/dashboard",
    lead: "Home is the employee's summary: what they can spend, what they've earned, and who thanked them.",
    todo: ["Read the three totals: Available points, Earned all time and Redeemed.", "Scroll the Recognition feed to see who awarded points and why.", "Check Rewards within reach for what Maria can afford right now."],
    see: "Available = Earned − Redeemed. With the seeded data: 1,200 − 550 = 650.",
    tip: "Click Show me around at the top for a quick tour that highlights each part of the page." },
  { id: "points", part: "employee", title: "Check the points history", icon: "star", href: "/points",
    lead: "Every point that moves is listed, so employees can always see where their balance comes from.",
    todo: ["Open Points.", "Each row shows the reason (award, redemption or refund), the + or − amount, and the balance after it."],
    see: "The newest Balance matches Available points on Home.",
    why: "This list is a ledger. A balance is never edited by hand. It changes only through these entries." },
  { id: "rewards", part: "employee", title: "Browse rewards", icon: "gift", href: "/rewards",
    lead: "The catalog shows each reward's picture, description, price in points and stock.",
    todo: ["Search by name, or filter by category.", "Click Add to cart on the Coffee voucher."],
    see: "A confirmation pops up and the cart count goes up. Wireless earbuds show “Need … more”, the Company hoodie shows Out of stock, and inactive rewards aren't listed at all.",
    tip: "Try adding the hoodie or the earbuds: the button is disabled." },
  { id: "cart", part: "employee", title: "Check out", icon: "cart", href: "/cart",
    lead: "Before anything is charged, the cart shows the total and what the balance will be afterwards.",
    todo: ["Open Cart and change the quantity if you like.", "Check the Balance after line.", "Click Redeem two or three times quickly."],
    see: "Exactly one order is created, and the balance drops by exactly the total.",
    tip: "If the cart costs more than the balance, it says “You need … more” and Redeem is blocked.",
    why: "The database works out the price, checks stock and balance, and saves the order in one step. Each checkout has a unique key, so repeated clicks can't create a second order." },
  { id: "orders", part: "employee", title: "Track your orders", icon: "orders", href: "/orders",
    lead: "Employees follow each redemption from Pending to Fulfilled, or to Cancelled with a refund.",
    todo: ["Open Orders.", "Find the order you just placed."],
    see: "It's at the top, with status Pending, its items, and the points spent." },
  { id: "employee-logout", part: "employee", title: "Log out", icon: "logout",
    lead: "Logging out ends the session on this device.",
    todo: ["Desktop: click Log out at the bottom of the sidebar.", "Phone: tap the log-out icon at the top right."],
    see: "You're back on the home page. Opening /dashboard now sends you to Log in.",
    tip: "Log back in: the balance and orders are all still there, because they're saved in the database." },
  { id: "admin-login", part: "admin", title: "Log in as the admin", icon: "login", href: "/login",
    lead: "The admin manages points, rewards and orders, and has its own pages, separate from the employee ones.",
    todo: ["Open Log in.", "Click the Admin button, or type admin@example.com and the demo password."],
    see: "You land on Overview: pending orders, points awarded, active rewards and low stock.",
    tip: "Click Show me around for a quick tour of the admin overview." },
  { id: "award", part: "admin", title: "Award points", icon: "zap", href: "/admin",
    lead: "Recognition is the heart of the app: the admin thanks someone and gives them points.",
    todo: ["In Award points, choose an employee, for example Juan.", "Enter the points (1 to 10,000) and a short message, like “Great job on the client demo!”", "Click Send recognition."],
    see: "“Recognition sent” appears. Juan's balance goes up by exactly that amount, and the message shows in his Recognition feed.",
    why: "Only the admin can award points. The database checks the role itself, so hiding a button isn't the only protection." },
  { id: "employees", part: "admin", title: "See your team", icon: "users", href: "/admin/employees",
    lead: "Every employee's points on one page.",
    todo: ["Open Employees.", "Compare each person's balance, points earned and redeemed, and order count.", "Click Award to recognize someone straight from the list."],
    see: "Juan's balance includes the points you just awarded." },
  { id: "manage-rewards", part: "admin", title: "Manage rewards", icon: "gift", href: "/admin/rewards",
    lead: "The admin decides what's in the catalog, what it costs, and how many are left.",
    todo: ["Click + Add reward and fill in the name, description, category, price (pts), stock and an optional image.", "Click Edit on a reward to change its price, stock or image, then click Save changes.", "To retire a reward, untick Active (visible in catalog) and save."],
    see: "Changes show in the employee catalog straight away, and a deactivated reward disappears from it.",
    why: "Rewards are never deleted, so past orders keep their history." },
  { id: "admin-orders", part: "admin", title: "Fulfil or cancel orders", icon: "orders", href: "/admin/orders",
    lead: "Each redemption waits here until the admin hands over the reward or cancels the order.",
    todo: ["Filter by Pending.", "Click Mark fulfilled once the reward has been handed over.", "Or click Cancel order, with an optional reason."],
    see: "Cancelling gives back the exact points and puts the stock back. Maria's Points page shows the refund.",
    tip: "Only pending orders can be changed, so an order can never be refunded twice." },
  { id: "requests", part: "admin", title: "Reply to demo requests", icon: "inbox", href: "/admin/requests",
    lead: "New companies use Book a demo on the public site instead of signing up.",
    todo: ["Open Requests.", "Use the email link to reply to someone."],
    see: "Every request sent from the Book a demo page, newest first." },
  { id: "admin-logout", part: "admin", title: "Log out", icon: "logout",
    lead: "The same as for employees.",
    todo: ["Desktop: click Log out at the bottom of the sidebar.", "Phone: tap the log-out icon at the top right."],
    see: "You're back on the home page. Admin pages now ask you to log in." },
  { id: "rules", part: "rules", title: "Try to break it", icon: "shield",
    lead: "The rules are enforced by the database, not just by hiding buttons. Try these:",
    todo: ["As Maria, open /admin: you're sent back to her Home.", "Double-click Redeem: only one order is created.", "Try to buy the out-of-stock hoodie, or a cart worth more than the balance: checkout is blocked.", "Cancel an order: the points and stock come back once, and only once.", "Log out, then open /orders: you're asked to log in."],
    see: "Maria only ever sees her own points and orders, and no balance can go below zero.",
    why: "Every points or stock change runs as one database transaction that checks who you are and what you're allowed to do." },
];

const LAST = STEPS.length - 1;
const at = (hash: string) => Math.max(0, STEPS.findIndex((s) => `#${s.id}` === hash));
const subscribe = (cb: () => void) => { addEventListener("hashchange", cb); return () => removeEventListener("hashchange", cb); };

/** The step list: grouped by part, every step can be opened, done ones get a tick. */
function Steps({ step, reached, go }: { step: number; reached: number; go: (i: number) => void }) {
  return (
    <ol className="flex flex-col gap-1">
      {STEPS.map((s, i) => {
        const on = i === step, done = i < reached && !on;
        return (
          <li key={s.id}>
            {STEPS[i - 1]?.part !== s.part && <p className="px-3 pt-4 pb-1 text-[12px] font-semibold tracking-[0.12em] text-muted uppercase">{PARTS[s.part]}</p>}
            <button type="button" onClick={() => go(i)} aria-current={on ? "step" : undefined}
              className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-1.5 text-left transition-shadow ${on ? "shadow-inset" : "hover:shadow-raised"}`}>
              <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${on ? "bg-primary-600 text-white" : done ? "bg-[#E6F4EA] text-success" : "bg-edge/70 text-muted"}`}>
                {done ? <Icon name="check" className="size-4" /> : i + 1}
              </span>
              <span className={`font-medium ${on ? "text-primary-700" : "text-navy"}`}>{s.title}</span>
              {done && <span className="sr-only">(done)</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

const Note = ({ icon, title, tone, children }: { icon: IconName; title: string; tone: string; children: React.ReactNode }) => (
  <div className={`flex gap-3 rounded-2xl px-4 py-3.5 ${tone}`}>
    <Icon name={icon} className="mt-0.5 size-5 shrink-0" />
    <p><span className="font-semibold">{title} </span><span className="text-ink">{children}</span></p>
  </div>
);

/** Patients-workspace layout: steps on the left, the current step on the right, Back / Next at the foot; phones get a progress bar. */
export function Tour() {
  const step = useSyncExternalStore(subscribe, () => at(location.hash), () => 0);
  const [reached, setReached] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const s = STEPS[step];
  const top = Math.max(reached, step);

  useEffect(() => { if (moved.current) heading.current?.focus(); }, [step]);

  const go = (i: number) => {
    moved.current = true;
    setReached(Math.max(top, i));
    history.replaceState(null, "", `#${STEPS[i].id}`);
    dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return (
    <div className="card overflow-clip p-0! lg:grid lg:h-[calc(100dvh-9rem)] lg:min-h-136 lg:grid-cols-[20rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <aside aria-label="Guide steps" className="flex flex-col gap-4 border-b border-white/70 p-5 lg:overflow-y-auto lg:overscroll-contain lg:border-r lg:border-b-0 lg:bg-white/25">
        <div>
          <h1 className="text-2xl font-semibold text-navy">How to use TB Rewards</h1>
          <p className="mt-1 text-sm text-muted">From logging in as an employee, to logging out, to running it as the admin.</p>
        </div>
        <div className="lg:hidden">
          <p className="text-sm font-semibold text-navy">Step {step + 1} of {STEPS.length} · <span className="text-primary-700">{s.title}</span></p>
          <div role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} className="mt-2 h-2.5 overflow-hidden rounded-full shadow-inset">
            <div className="h-full rounded-full bg-primary-600 transition-[width] duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <details className="smooth mt-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-medium text-primary-700 [&::-webkit-details-marker]:hidden">All steps</summary>
            <Steps step={step} reached={top} go={go} />
          </details>
        </div>
        <div className="hidden lg:block"><Steps step={step} reached={top} go={go} /></div>
      </aside>

      <section aria-labelledby="step-title" className="flex min-h-0 min-w-0 flex-col">
        <div key={s.id} className="page-in flex flex-1 flex-col gap-5 p-5 sm:p-8 lg:overflow-y-auto lg:overscroll-contain">
          <header className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-primary-600 shadow-inset"><Icon name={s.icon} className="size-6" /></span>
            <div>
              <p className="text-[12px] font-semibold tracking-[0.12em] text-muted uppercase">{PARTS[s.part]} · Step {step + 1} of {STEPS.length}</p>
              <h2 id="step-title" ref={heading} tabIndex={-1} className="mt-1 text-2xl font-semibold text-navy outline-none">{s.title}</h2>
            </div>
          </header>
          <p className="max-w-2xl text-muted sm:text-lg">{s.lead}</p>

          <div className="rounded-3xl p-5 shadow-inset sm:p-6">
            <h3 className="font-semibold text-navy">Do this</h3>
            <ol className="mt-3 flex flex-col gap-3">
              {s.todo.map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-navy text-[13px] font-semibold text-white">{i + 1}</span>
                  <span className="pt-0.5">{t}</span>
                </li>
              ))}
            </ol>
            {s.href && (
              <Link href={s.href} target="_blank" rel="noopener" className="btn-soft mt-5 min-h-11 w-full sm:w-auto">
                Open {s.href} <span className="sr-only">(new tab)</span><Icon name="external" className="size-4" />
              </Link>
            )}
          </div>

          <Note icon="check" title="You should see:" tone="bg-[#E6F4EA] text-success">{s.see}</Note>
          {s.tip && <Note icon="zap" title="Try this:" tone="bg-[#FFF4D6] text-[#8A5A00]">{s.tip}</Note>}
          {s.why && <Note icon="shield" title="Why it stays accurate:" tone="bg-[#E4E7F8] text-navy">{s.why}</Note>}
        </div>

        <nav aria-label="Guide" className="sticky bottom-0 flex items-center gap-3 border-t border-white/70 bg-base/90 p-4 backdrop-blur-md sm:px-8 lg:static">
          {step > 0 && <button type="button" onClick={() => go(step - 1)} className="btn-soft max-sm:px-5"><Icon name="back" /><span className="max-sm:sr-only">Back</span></button>}
          {step < LAST
            ? <button type="button" onClick={() => go(step + 1)} className="btn-primary ml-auto flex-1 sm:flex-none"><span>Next<span className="max-sm:hidden">: {STEPS[step + 1].title}</span></span><Icon name="next" /></button>
            : <Link href="/login" className="btn-primary ml-auto flex-1 sm:flex-none">Start the demo<Icon name="next" /></Link>}
        </nav>
      </section>
    </div>
  );
}
