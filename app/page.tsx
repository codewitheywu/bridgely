import Link from "next/link";
import { Reveal } from "./reveal";
import { Blobs, Logo, PointsCard, Star } from "./ui";

const Icon = ({ d }: { d: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const check = "M20 6L9 17l-5-5";
const nav = [["Features", "#features"], ["How it works", "#how"], ["FAQ", "#faq"]];

const features = [
  { tag: "Recognition", title: "Say thank you with points", text: "Admins send points with a short message, so every award explains itself. Employees see each one in their history.", points: ["Personal messages up to 280 characters", "Instant balance updates", "Complete points history"] },
  { tag: "Rewards", title: "A catalog people actually want", text: "Gift cards, merch, experiences or time off. Every reward shows its image, description, price in points and stock.", points: ["Cart checkout in one click", "Blocks orders you can't afford", "Live stock, so no overselling"] },
  { tag: "Control", title: "Admins stay in charge", text: "Add, edit and deactivate rewards, track every redemption, and fulfil or cancel orders. Cancelling refunds the points automatically.", points: ["Fulfil or cancel in one tap", "Automatic refunds and restocks", "Duplicate-click protection"] },
];
const steps = [
  { title: "Get recognized", text: "Your admin sends points with a thank-you when you do great work.", icon: <Icon d="M7 11v9H4v-9zM7 11l4-8a2 2 0 012 2v4h6a2 2 0 012 2.3l-1.4 7A2 2 0 0117.6 20H7" /> },
  { title: "Earn points", text: "Every award lands in your balance with its message, so you always know why.", icon: <Star className="size-6" /> },
  { title: "Redeem rewards", text: "Pick rewards, check out, and track each order until it's fulfilled.", icon: <Icon d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7S11 2 7.5 2a2.5 2.5 0 000 5M12 7s1-5 4.5-5a2.5 2.5 0 010 5" /> },
];
const faqs = [
  ["Do points expire?", "No. Points stay in your balance until you redeem them."],
  ["What happens if an order is cancelled?", "Your points are refunded and the item goes back into stock automatically."],
  ["Can I redeem more than my balance?", "No. Checkout is blocked if your cart costs more than your points or an item is out of stock."],
  ["Who can award points?", "Only admins. Employees can see their own balance, history and orders, never anyone else's."],
];

function Placeholder({ label }: { label: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] shadow-inset">
      <div aria-hidden="true" className="absolute top-6 right-6 size-40 rounded-full bg-primary opacity-80 blur-md" />
      <div aria-hidden="true" className="absolute bottom-6 left-8 size-24 rounded-full bg-navy opacity-70 blur-sm" />
      <div className="glass absolute inset-8 grid place-items-center text-sm font-medium text-muted">{label}</div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/60 bg-base/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {nav.map(([t, h]) => <a key={h} href={h} className="rounded-pill px-4 py-2 text-ink! no-underline! hover:text-primary-700!">{t}</a>)}
            <Link href="/login" className="btn px-5 text-navy!">Log in</Link>
            <Link href="/signup" className="btn-primary">Sign up</Link>
          </nav>
          <details className="group relative md:hidden">
            <summary aria-label="Menu" className="btn-soft size-12 list-none p-0 [&::-webkit-details-marker]:hidden">
              <Icon d="M4 7h16M4 12h16M4 17h16" />
            </summary>
            <div className="card absolute right-0 mt-3 flex w-64 flex-col gap-2 p-4!">
              {nav.map(([t, h]) => <a key={h} href={h} className="rounded-xl px-3 py-3 text-ink! no-underline!">{t}</a>)}
              <Link href="/login" className="btn-soft">Log in</Link>
              <Link href="/signup" className="btn-primary">Sign up</Link>
            </div>
          </details>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 pt-10 pb-20 md:gap-32 md:px-8 md:pt-16">
        <section className="grid items-center gap-12 md:grid-cols-2">
          <Reveal className="flex flex-col gap-6">
            <span className="w-fit rounded-pill px-4 py-2 text-[13px] font-medium text-primary-700 shadow-inset">Employee recognition & rewards</span>
            <h1 className="text-4xl leading-tight font-semibold text-navy md:text-[56px]">Recognize great work. Reward it instantly.</h1>
            <p className="text-lg text-muted">TB Rewards turns thank-yous into points your team can spend on rewards they actually want.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-primary">Get started free</Link>
              <a href="#how" className="btn-soft">See how it works</a>
            </div>
          </Reveal>
          <Reveal delay={150} className="card flex flex-col gap-5">
            <PointsCard points={1200} note='+150 from Admin · "Great demo!"' />
            {["Coffee voucher · 150 pts", "Extra day off · 2,000 pts"].map((r) => (
              <div key={r} className="flex items-center gap-4 rounded-2xl p-3 shadow-inset">
                <span className="size-12 shrink-0 rounded-xl bg-primary/80" aria-hidden="true" />
                <span className="font-medium text-navy">{r}</span>
              </div>
            ))}
          </Reveal>
        </section>

        <Reveal className="flex flex-col items-center gap-6 text-center">
          <p className="text-sm font-medium text-muted">Built for teams of every size</p>
          <ul className="flex flex-wrap justify-center gap-4">
            {[1, 2, 3, 4, 5].map((n) => <li key={n} className="rounded-pill px-6 py-3 text-sm font-semibold text-muted/70 shadow-raised">Logo {n}</li>)}
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
                      <span className="grid size-8 shrink-0 place-items-center rounded-full text-success shadow-inset"><Icon d={check} /></span>{p}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={150}><Placeholder label={`${f.tag} screenshot`} /></Reveal>
            </div>
          ))}
        </section>

        <section id="how" aria-labelledby="how-h" className="flex flex-col gap-10">
          <Reveal><h2 id="how-h" className="text-3xl font-semibold text-navy md:text-4xl">How it works</h2></Reveal>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={i * 150} className="card flex h-full flex-col gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl text-primary-600 shadow-inset">{s.icon}</span>
                  <h3 className="text-xl font-semibold text-navy">{i + 1}. {s.title}</h3>
                  <p className="text-muted">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {[["For employees", ["See your balance and every award", "Browse rewards and check out", "Track each order's status"]], ["For admins", ["Award points with a message", "Manage rewards, prices and stock", "Fulfil or cancel redemptions"]]].map(([t, items], i) => (
            <Reveal key={t as string} delay={i * 150} className="card relative flex h-full flex-col gap-4 overflow-hidden">
              <h3 className="text-2xl font-semibold text-navy">{t}</h3>
              <ul className="flex flex-col gap-3">{(items as string[]).map((x) => <li key={x} className="flex gap-3"><span className="text-success"><Icon d={check} /></span>{x}</li>)}</ul>
            </Reveal>
          ))}
        </section>

        <section id="faq" aria-labelledby="faq-h" className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          <Reveal><h2 id="faq-h" className="text-center text-3xl font-semibold text-navy md:text-4xl">Questions, answered</h2></Reveal>
          {faqs.map(([q, a], i) => (
            <Reveal key={q} delay={i * 80}>
              <details className="group rounded-3xl px-6 py-5 shadow-raised open:shadow-inset">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium text-navy [&::-webkit-details-marker]:hidden">
                  {q}<span aria-hidden="true" className="text-2xl text-primary-600 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pt-3 text-muted">{a}</p>
              </details>
            </Reveal>
          ))}
        </section>

        <Reveal className="card relative flex flex-col items-start gap-5 overflow-hidden md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <h2 className="text-2xl font-semibold text-navy md:text-3xl">Ready to celebrate your team?</h2>
            <p className="text-muted">Create an account in under a minute.</p>
          </div>
          <div className="relative h-20 w-40 max-md:hidden"><Blobs /></div>
          <Link href="/signup" className="btn-primary relative">Create account</Link>
        </Reveal>
      </main>

      <footer className="pb-8 text-center text-[13px] text-muted">TB Rewards · Employee recognition demo</footer>
    </>
  );
}
