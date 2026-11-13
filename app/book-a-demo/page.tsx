import { Icon } from "../icons";
import { SiteFooter, SiteHeader } from "../site";
import { DemoForm } from "./form";

export const metadata = { title: "Book a demo" };

const uses = [
  "Recognize great work with points and a personal message, so every thank-you counts.",
  "Give employees a rewards catalog they actually want, with checkout in one click.",
  "Keep points and stock accurate automatically, including refunds when orders are cancelled.",
  "Track every award and redemption in one place, from desktop or phone.",
];

export default function BookDemo() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-12 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1fr_minmax(0,32rem)] lg:gap-16 lg:px-8">
        <section className="flex flex-col gap-6">
          <span className="text-sm font-semibold tracking-wider text-muted uppercase">Book a demo</span>
          <h1 className="text-4xl leading-tight font-semibold text-navy md:text-5xl">
            Ready to <span className="text-primary">boost</span> employee recognition?
          </h1>
          <p className="text-lg text-muted">Book a short introductory call to talk through your recognition goals and see TB Rewards in action.</p>
          <h2 className="mt-4 text-xl font-semibold text-navy">Discover how teams use TB Rewards to:</h2>
          <ul className="flex flex-col gap-4">
            {uses.map((u) => (
              <li key={u} className="flex gap-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-success shadow-inset"><Icon name="check" className="size-4" /></span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Demo request form" className="card sm:p-8!">
          <DemoForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
