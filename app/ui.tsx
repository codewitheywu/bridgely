import Link from "next/link";
import { Icon, type IconName } from "./icons";

export const Star = ({ className }: { className?: string }) => <Icon name="star" className={className} />;

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-navy! no-underline!">
      <span className="grid size-10 place-items-center rounded-2xl bg-base shadow-raised">
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
      <section className="mx-auto flex w-full max-w-[420px] flex-col gap-6">
        <div className="md:hidden"><Logo /></div>
        <Link href="/" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-pill pr-3 text-sm font-medium text-muted! no-underline! hover:text-primary-700!">
          <Icon name="back" className="size-4" />Back to home
        </Link>
        <div className="card flex flex-col gap-5 sm:p-8!">
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
export const Status = ({ s }: { s: string }) => <span className={`inline-flex shrink-0 rounded-pill px-3 py-1 text-[13px] font-medium capitalize ${tones[s]}`}>{s}</span>;

export const Empty = ({ children }: { children: React.ReactNode }) => <div className="card py-10! text-center text-muted">{children}</div>;
const sk = "animate-pulse bg-edge/70";
/** Skeleton in the shape of a typical page: header, stat row, two content columns. */
export const Loading = () => (
  <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-8">
    <div className="flex flex-col gap-2"><div className={`${sk} h-8 w-60 rounded-xl`} /><div className={`${sk} h-5 w-80 max-w-full rounded-lg`} /></div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className={`${sk} h-28 rounded-3xl`} />)}</div>
    <div className="grid gap-6 lg:grid-cols-3"><div className={`${sk} h-72 rounded-3xl lg:col-span-2`} /><div className={`${sk} h-72 rounded-3xl`} /></div>
  </div>
);

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-navy md:text-3xl">{title}</h1>
        {description && <p className="text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({ title, action, children, className = "", tour }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string; tour?: string }) {
  return (
    <section data-tour={tour} className={`flex flex-col gap-4 ${className}`}>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-navy">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, highlight }: { label: string; value: React.ReactNode; hint?: string; highlight?: boolean }) {
  return (
    <div className={`card flex flex-col gap-1 ${highlight ? "border-navy! bg-navy!" : ""}`}>
      <span className={`text-sm ${highlight ? "text-white/80" : "text-muted"}`}>{label}</span>
      <span className={`text-2xl font-semibold md:text-3xl ${highlight ? "text-[#F4A47E]" : "text-navy"}`}>{value}</span>
      {hint && <span className={`text-[13px] ${highlight ? "text-white/80" : "text-muted"}`}>{hint}</span>}
    </div>
  );
}

export const Avatar = ({ name }: { name: string }) => (
  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-navy text-sm font-semibold text-white">
    {name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
  </span>
);

const art: Record<string, [IconName, string]> = {
  Food: ["coffee", "from-[#FDE3D3] to-[#F6C3A5]"],
  Experiences: ["ticket", "from-[#E4E7F8] to-[#C7CDEE]"],
  Tech: ["headphones", "from-[#DCE8F6] to-[#BBD1EC]"],
  "Time off": ["sun", "from-[#FFF2CF] to-[#FBDD8C]"],
  Merch: ["shirt", "from-[#E3F2E7] to-[#C3E2CB]"],
};

/** Uploaded photo, or category artwork until an admin uploads one. */
export function RewardImage({ src, alt, category }: { src: string | null; alt: string; category?: string | null }) {
  // eslint-disable-next-line @next/next/no-img-element -- Supabase public URLs, no optimizer config needed
  if (src) return <img src={src} alt={alt} className="aspect-[4/3] w-full rounded-2xl object-cover" />;
  const [icon, tint] = art[category ?? ""] ?? ["gift", "from-[#FDE3D3] to-[#E4E7F8]"];
  return (
    <div role="img" aria-label={alt || undefined} aria-hidden={!alt || undefined} className={`grid aspect-[4/3] w-full place-items-center rounded-2xl bg-linear-to-br ${tint}`}>
      <span className="grid aspect-square w-[38%] max-w-24 place-items-center rounded-full bg-white/70 shadow-[0_8px_20px_rgb(28_35_75/0.12)]">
        <Icon name={icon} className="size-1/2 text-navy" />
      </span>
    </div>
  );
}
