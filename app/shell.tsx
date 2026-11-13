import { connection } from "next/server";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { logout } from "./auth-actions";
import { Icon } from "./icons";
import { NavLinks, type NavItem } from "./nav";
import { Avatar, Loading, Logo, pts } from "./ui";

async function UserChip() {
  await connection();
  const sb = await supabase();
  const { data } = await sb.auth.getClaims();
  if (!data) return null;
  const { data: me } = await sb.from("profiles").select("full_name, role, points_balance").eq("id", data.claims.sub).single();
  if (!me) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3 shadow-inset">
      <Avatar name={me.full_name} />
      <div className="min-w-0">
        <p className="truncate font-medium text-navy">{me.full_name}</p>
        <p className="text-[13px] text-muted">{me.role === "admin" ? "Administrator" : pts(me.points_balance)}</p>
      </div>
    </div>
  );
}

const LogoutButton = ({ compact }: { compact?: boolean }) => (
  <form action={logout}>
    <button aria-label="Log out" className={`btn-soft min-h-11 ${compact ? "size-11 p-0" : "w-full"}`}>
      <Icon name="logout" />{!compact && "Log out"}
    </button>
  </form>
);

/** Signed-in layout: sidebar on desktop, top bar + bottom tabs on mobile. Pages read the session inside Suspense. */
export function AppShell({ links, children }: { links: NavItem[]; children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-10 border-r border-white/70 px-5 py-7 lg:flex">
        <Logo />
        <NavLinks links={links} />
        <div className="mt-auto flex flex-col gap-3">
          <Suspense fallback={<div className="h-16 animate-pulse rounded-2xl bg-edge/60" />}><UserChip /></Suspense>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/70 bg-base/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:hidden">
          <Logo />
          <LogoutButton compact />
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:py-10">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </main>
      </div>
      <NavLinks links={links} mobile />
    </div>
  );
}
