import Link from "next/link";
import { Icon } from "./icons";
import { Logo, Star } from "./ui";

const nav = [["Features", "/#features"], ["How it works", "/#how"], ["Guide", "/guide"], ["FAQ", "/#faq"]];

/** Public marketing header: links + Log in + Book a demo; collapses to a menu on mobile. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-base/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {nav.map(([t, h]) => <Link key={h} href={h} className="rounded-pill px-4 py-2 text-ink! no-underline! hover:text-primary-700!">{t}</Link>)}
          <Link href="/login" className="btn px-5 text-primary-700!">Log in</Link>
          <Link href="/book-a-demo" className="btn-primary">Book a demo</Link>
        </nav>
        <details className="relative md:hidden">
          <summary aria-label="Menu" className="btn-soft size-12 list-none p-0 [&::-webkit-details-marker]:hidden"><Icon name="menu" /></summary>
          <div className="card absolute right-0 mt-3 flex w-64 flex-col gap-2 p-4!">
            {nav.map(([t, h]) => <Link key={h} href={h} className="rounded-xl px-3 py-3 text-ink! no-underline!">{t}</Link>)}
            <Link href="/login" className="btn-soft">Log in</Link>
            <Link href="/book-a-demo" className="btn-primary">Book a demo</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6 lg:px-8">
        <span className="flex items-center gap-2"><Star className="size-4 text-primary" /> TB Rewards · Employee recognition & rewards</span>
        <nav aria-label="Footer" className="flex gap-6">
          <Link href="/#features">Features</Link><Link href="/guide">Guide</Link><Link href="/book-a-demo">Book a demo</Link><Link href="/login">Log in</Link>
        </nav>
      </div>
    </footer>
  );
}
