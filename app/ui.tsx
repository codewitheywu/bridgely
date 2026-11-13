import { Suspense } from "react";
import { logout } from "./auth-actions";
import { NavLinks } from "./nav";
import Link from "next/link";

const icon = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
export const Star = (p: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" {...icon} {...p}><path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.6L6 22l1.5-7.2L2 10l7.1-1.1z" /></svg>
);

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-xl font-semibold text-navy! no-underline!">
      <span className="grid size-11 place-items-center rounded-2xl bg-base shadow-raised">
        <Star className="size-5 text-primary" />
      </span>
      TB Rewards
    </Link>
  );
}

/** Brand shapes behind a glass card. Decorative. */
export function Blobs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-5 right-0 size-40 rounded-full bg-primary opacity-90 blur-sm" />
      <div className="absolute bottom-0 left-4 size-24 rounded-full bg-navy opacity-85 blur-[4px]" />
    </div>
  );
}

export function PointsCard({ points, note }: { points: number; note?: string }) {
  return (
    <div className="relative h-40 w-full max-w-[340px]">
      <Blobs />
      <div className="glass absolute inset-0 flex flex-col justify-center gap-1.5 px-6">
        <span className="text-[13px] font-medium text-muted">Your points</span>
        <span className="text-4xl leading-none font-semibold text-navy">{points.toLocaleString()}</span>
        {note && <span className="text-[13px] font-medium text-success">{note}</span>}
      </div>
    </div>
  );
}

/** Two-column auth layout: brand on the left (desktop), form card on the right. */
export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center gap-16 px-4 py-10 md:px-16">
      <section className="hidden flex-1 flex-col gap-7 md:flex">
        <Logo />
        <p className="text-5xl leading-tight font-semibold text-navy">Your work,<br />recognized.</p>
        <p className="max-w-md text-lg text-muted">Earn points when your team celebrates you. Redeem them for rewards you actually want.</p>
        <PointsCard points={1200} note='+150 from Admin · "Great demo!"' />
      </section>
      <section className="mx-auto flex w-full max-w-[420px] flex-col gap-8">
        <div className="md:hidden"><Logo /></div>
        <div className="card flex flex-col gap-5">
          <h1 className="text-[28px] font-semibold text-navy">{title}</h1>
          {children}
        </div>
      </section>
    </main>
  );
}

export const date = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const orderNo = (n: number) => `#${1000 + n}`;
export const pts = (n: number) => `${n.toLocaleString()} pts`;

const tones: Record<string, string> = { pending: "bg-[#FFF4D6] text-[#8A5A00]", fulfilled: "bg-[#E6F4EA] text-success", cancelled: "bg-[#FDECEA] text-danger" };
export const Status = ({ s }: { s: string }) => <span className={`rounded-pill px-3 py-1 text-[13px] font-medium capitalize ${tones[s]}`}>{s}</span>;

export const Empty = ({ children }: { children: React.ReactNode }) => <div className="card text-center text-muted">{children}</div>;
export const Loading = () => <div aria-label="Loading" className="h-64 animate-pulse rounded-[28px] bg-edge/60" />;
export const Title = ({ children }: { children: React.ReactNode }) => <h1 className="text-[28px] font-semibold text-navy">{children}</h1>;

export function RewardImage({ src, alt }: { src: string | null; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- Supabase public URLs, no optimizer config needed
  if (src) return <img src={src} alt={alt} className="aspect-[4/3] w-full rounded-2xl object-cover" />;
  return (
    <div role="img" aria-label={alt} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-inset">
      <div className="absolute top-4 right-4 size-20 rounded-full bg-primary opacity-80 blur-md" />
      <div className="absolute bottom-4 left-6 size-12 rounded-full bg-navy opacity-60 blur-sm" />
      <Star className="absolute inset-0 m-auto size-10 text-white" />
    </div>
  );
}

/** Signed-in shell. Pages read the session inside the Suspense boundary. */
export function AppShell({ links, children }: { links: string[][]; children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/60 bg-base/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Logo />
          <NavLinks links={links} />
          <form action={logout}><button className="btn-soft min-h-11 px-5">Log out</button></form>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-6 pb-28 md:px-8 md:pb-12">
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </main>
      <NavLinks links={links} mobile />
    </>
  );
}
