import Link from "next/link";
import { Logo, PointsCard, Star } from "./ui";

const Icon = ({ d }: { d: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const steps = [
  { title: "Get recognized", text: "Your admin sends points with a short thank-you when you do great work.", icon: <Icon d="M7 11v9H4v-9zM7 11l4-8a2 2 0 012 2v4h6a2 2 0 012 2.3l-1.4 7A2 2 0 0117.6 20H7" /> },
  { title: "Earn points", text: "Every award lands in your balance with its message, so you always know why.", icon: <Star className="size-6" /> },
  { title: "Redeem rewards", text: "Pick rewards from the catalog, check out, and track every order's status.", icon: <Icon d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7S11 2 7.5 2a2.5 2.5 0 000 5M12 7s1-5 4.5-5a2.5 2.5 0 010 5" /> },
];

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 md:px-16">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn px-4 text-navy!">Log in</Link>
          <Link href="/signup" className="btn-primary hidden sm:inline-flex">Sign up</Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-4 pt-8 pb-20 md:px-16">
        <section className="flex flex-col items-start gap-12 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-xl flex-col gap-6">
            <h1 className="text-4xl leading-tight font-semibold text-navy md:text-[52px]">
              Recognize great work.<br />Reward it instantly.
            </h1>
            <p className="text-lg text-muted">
              TB Rewards turns thank-yous into points your team can spend on rewards they actually want.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-primary">Get started</Link>
              <Link href="/login" className="btn-soft">Log in</Link>
            </div>
          </div>
          <PointsCard points={1200} note='+150 from Admin · "Great demo!"' />
        </section>

        <section aria-labelledby="how" className="flex flex-col gap-8">
          <h2 id="how" className="text-2xl font-semibold text-navy">How it works</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="card flex flex-col gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-base text-primary-600 shadow-inset">
                  {s.icon}
                </span>
                <h3 className="text-xl font-semibold text-navy">{i + 1}. {s.title}</h3>
                <p className="text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="card flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-navy">Ready to see your points?</h2>
            <p className="text-muted">Create an account in under a minute.</p>
          </div>
          <Link href="/signup" className="btn-primary">Create account</Link>
        </section>
      </main>

      <footer className="pb-8 text-center text-[13px] text-muted">TB Rewards · Employee recognition</footer>
    </>
  );
}
