import Link from "next/link";
import { Icon, type IconName } from "./icons";
import { Reveal } from "./reveal";
import { SiteFooter, SiteHeader } from "./site";
import { Avatar, PointsCard, pts, RewardImage, Status } from "./ui";

const trust: [IconName, string, string][] = [
  ["shield", "Secure by design", "Every balance change is checked by the database"],
  ["phone", "Works everywhere", "Desktop, tablet and phone"],
  ["refresh", "Instant refunds", "Cancelled orders return points automatically"],
  ["zap", "Quick to roll out", "No spreadsheets or IT projects"],
];

/* ---------- Product previews (real components, sample data) ---------- */
function RecognitionPreview() {
  const items = [["Ana Lopez", 300, "Great demo to the client."], ["Sam Reyes", 150, "Thanks for covering the support queue!"]] as const;
  return (
    <div className="card flex flex-col gap-4">
      {items.map(([name, p, msg]) => (
        <div key={name} className="flex gap-4 rounded-2xl p-4 shadow-inset">
          <Avatar name={name} />
          <div className="flex min-w-0 flex-col gap-1">
            <p><b className="font-semibold text-navy">{name}</b> <span className="text-muted">recognized you</span></p>
            <p className="text-ink">“{msg}”</p>
            <span className="w-fit rounded-pill bg-[#E6F4EA] px-3 py-0.5 text-[13px] font-semibold text-success">+{pts(p)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
function RewardsPreview() {
  const items = [["Coffee voucher", "Food", 150], ["Movie tickets", "Experiences", 400], ["Wireless earbuds", "Tech", 1500], ["Extra day off", "Time off", 2000]] as const;
  return (
    <div className="card grid grid-cols-2 gap-4">
      {items.map(([name, cat, p]) => (
        <div key={name} className="flex flex-col gap-2 rounded-2xl p-3 shadow-inset">
          <RewardImage src={null} alt="" category={cat} />
          <p className="truncate text-sm font-medium text-navy">{name}</p>
          <p className="text-sm font-semibold text-primary-700">{pts(p)}</p>
        </div>
      ))}
    </div>
  );
}
function OrdersPreview() {
  const items = [["#1004", "Sam Reyes", "pending"], ["#1003", "Ana Lopez", "fulfilled"], ["#1002", "Lee Tan", "cancelled"]] as const;
  return (
    <div className="card flex flex-col gap-3">
      {items.map(([no, who, s]) => (
        <div key={no} className="flex items-center justify-between gap-3 rounded-2xl p-4 shadow-inset">
          <div className="flex min-w-0 items-center gap-3"><Avatar name={who} /><div className="min-w-0"><p className="truncate font-medium text-navy">Order {no}</p><p className="text-[13px] text-muted">{who}</p></div></div>
          <Status s={s} />
        </div>
      ))}
    </div>
  );
}

const features = [
  { tag: "Recognition", title: "Say thank you with points", text: "Admins send points with a short message, so every award explains itself. Employees see each one in their feed and history.", points: ["Personal messages up to 280 characters", "Balances update instantly", "Complete points history"], preview: <RecognitionPreview /> },
  { tag: "Rewards", title: "A catalog people actually want", text: "Gift cards, merch, experiences or time off. Search, filter by category, and see exactly what you can afford.", points: ["Cart checkout in one click", "Blocks orders you can’t afford", "Live stock, so nothing is oversold"], preview: <RewardsPreview /> },
  { tag: "Control", title: "Admins stay in charge", text: "Add, edit and deactivate rewards, track every redemption, and fulfil or cancel orders. Cancelling refunds points automatically.", points: ["Fulfil or cancel in one tap", "Automatic refunds and restocks", "Protected against double clicks"], preview: <OrdersPreview /> },
];
const steps = [
  { title: "Get recognized", text: "Your admin sends points with a thank-you when you do great work.", icon: "users" as const },
  { title: "Earn points", text: "Every award lands in your balance with its message, so you always know why.", icon: "star" as const },
  { title: "Redeem rewards", text: "Pick rewards, check out, and track each order until it’s fulfilled.", icon: "gift" as const },
];
const faqs = [
  ["Do points expire?", "No. Points stay in your balance until you redeem them."],
  ["What happens if an order is cancelled?", "Your points are refunded and the item goes back into stock automatically."],
  ["Can I redeem more than my balance?", "No. Checkout is blocked if your cart costs more than your points or an item is out of stock."],
  ["Who can award points?", "Only admins. Employees can see their own balance, history and orders, never anyone else’s."],
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 pt-10 pb-20 sm:px-6 md:gap-32 md:pt-16 lg:px-8">
        <section className="grid items-center gap-12 md:grid-cols-2">
          <Reveal className="flex flex-col gap-6">
            <span className="w-fit rounded-pill px-4 py-2 text-[13px] font-medium text-primary-700 shadow-inset">Employee recognition & rewards</span>
            <h1 className="text-4xl leading-tight font-semibold text-navy md:text-[56px]">Recognize great work. Reward it instantly.</h1>
            <p className="text-lg text-muted">TB Rewards turns thank-yous into points your team can spend on rewards they actually want.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/book-a-demo" className="btn-primary">Book a demo</Link>
              <a href="#how" className="btn-soft">See how it works</a>
            </div>
          </Reveal>
          <Reveal delay={150} className="card flex flex-col gap-5">
            <PointsCard points={1200} note='+150 from Ana · "Great demo!"' />
            {([["Coffee voucher", "Food", 150], ["Extra day off", "Time off", 2000]] as const).map(([n, c, p]) => (
              <div key={n} className="flex items-center gap-4 rounded-2xl p-3 shadow-inset">
                <div className="w-14 shrink-0"><RewardImage src={null} alt="" category={c} /></div>
                <span className="flex-1 font-medium text-navy">{n}</span>
                <span className="font-semibold text-primary-700">{pts(p)}</span>
              </div>
            ))}
          </Reveal>
        </section>

        <Reveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map(([icon, t, d]) => (
              <li key={t} className="flex items-start gap-4 rounded-3xl p-5 shadow-raised">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-primary-600 shadow-inset"><Icon name={icon} /></span>
                <div><p className="font-semibold text-navy">{t}</p><p className="text-sm text-muted">{d}</p></div>
              </li>
            ))}
          </ul>
        </Reveal>

        <section id="features" aria-label="Features" className="flex flex-col gap-24">
          {features.map((f, i) => (
            <div key={f.tag} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
              <Reveal className={`flex flex-col gap-5 ${i % 2 ? "md:order-2" : ""}`}>
                <span className="text-sm font-semibold tracking-wide text-primary-700 uppercase">{f.tag}</span>
                <h2 className="text-3xl font-semibold text-navy md:text-4xl">{f.title}</h2>
                <p className="text-lg text-muted">{f.text}</p>
                <ul className="flex flex-col gap-3">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full text-success shadow-inset"><Icon name="check" className="size-4" /></span>{p}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={150}>{f.preview}</Reveal>
            </div>
          ))}
        </section>

        <section id="how" aria-labelledby="how-h" className="flex flex-col gap-10">
          <Reveal><h2 id="how-h" className="text-3xl font-semibold text-navy md:text-4xl">How it works</h2></Reveal>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={i * 150} className="card flex h-full flex-col gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl text-primary-600 shadow-inset"><Icon name={s.icon} className="size-6" /></span>
                  <h3 className="text-xl font-semibold text-navy">{i + 1}. {s.title}</h3>
                  <p className="text-muted">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {([["For employees", ["See your balance and every award", "Browse rewards and check out", "Track each order’s status"]], ["For admins", ["Award points with a message", "Manage rewards, prices and stock", "Fulfil or cancel redemptions"]]] as const).map(([t, items], i) => (
            <Reveal key={t} delay={i * 150} className="card flex h-full flex-col gap-4">
              <h3 className="text-2xl font-semibold text-navy">{t}</h3>
              <ul className="flex flex-col gap-3">{items.map((x) => <li key={x} className="flex items-center gap-3"><span className="text-success"><Icon name="check" /></span>{x}</li>)}</ul>
            </Reveal>
          ))}
        </section>

        <section id="faq" aria-labelledby="faq-h" className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <Reveal><h2 id="faq-h" className="mb-2 text-center text-3xl font-semibold text-navy md:text-4xl">Questions, answered</h2></Reveal>
          {faqs.map(([q, a], i) => (
            <Reveal key={q} delay={i * 80}>
              <details className="smooth group rounded-3xl px-6 py-5 shadow-raised transition-shadow open:shadow-inset">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium text-navy [&::-webkit-details-marker]:hidden">
                  {q}<span aria-hidden="true" className="text-2xl text-primary-600 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="pt-3 text-muted">{a}</p>
              </details>
            </Reveal>
          ))}
        </section>

        <Reveal className="card flex flex-col items-start gap-5 bg-navy! p-8! md:flex-row md:items-center md:justify-between md:p-12!">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Ready to celebrate your team?</h2>
            <p className="text-white/80">See TB Rewards in action in a short introductory call.</p>
          </div>
          <Link href="/book-a-demo" className="btn-primary">Book a demo</Link>
        </Reveal>
      </main>

      <SiteFooter />
    </>
  );
}
