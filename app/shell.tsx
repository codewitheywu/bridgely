import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { logout } from "./auth-actions";
import { Submit } from "./fields";
import { Icon } from "./icons";
import { CartUser, NavLinks, type NavItem } from "./nav";
import { Avatar, Loading, Logo, pts } from "./ui";

async function UserChip() {
  await connection();
  const sb = await supabase();
  const { data } = await sb.auth.getClaims();
  if (!data) return null;
  const { data: me } = await sb.from("profiles").select("id, full_name, role, points_balance").eq("id", data.claims.sub).single();
  if (!me) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3 shadow-inset">
      {me.role === "employee" && <CartUser uid={me.id} />}
      <Avatar name={me.full_name} />
      <div className="min-w-0">
        <p className="truncate font-medium text-navy">{me.full_name}</p>
        <p className="text-[13px] text-muted">{me.role === "admin" ? "Administrator" : `${pts(me.points_balance)} available`}</p>
      </div>
    </div>
  );
}

const LogoutButton = ({ compact }: { compact?: boolean }) => (
  <form action={logout}>
    <Submit label={compact ? "Log out" : undefined} className={`btn-soft min-h-11 ${compact ? "size-11 p-0" : "w-full"}`} busy={compact ? undefined : "Logging out…"}>
      <Icon name="logout" />{!compact && "Log out"}
    </Submit>
  </form>
);

/** Signed-in layout: sidebar on desktop, top bar + bottom tabs on mobile. Pages read the session inside Suspense. */
export function AppShell({ links, children }: { links: NavItem[]; children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-10 border-r border-white/70 px-5 py-7 lg:flex">
        <Logo />
        <NavLinks links={links} />
        <div data-tour="account" className="mt-auto flex flex-col gap-3">
          <Link href="/guide" className="flex min-h-11 items-center gap-3 rounded-2xl px-4 font-medium text-ink! no-underline! hover:shadow-raised"><Icon name="help" />How to use</Link>
          <Suspense fallback={<div className="h-16 animate-pulse rounded-2xl bg-edge/60" />}><UserChip /></Suspense>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/70 bg-base/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:hidden">
          <Logo />
          <div data-tour="account" className="flex gap-2">
            <Link href="/guide" aria-label="How to use" className="btn-soft min-h-11 size-11 p-0"><Icon name="help" /></Link>
            <LogoutButton compact />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:py-10">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </main>
      </div>
      <NavLinks links={links} mobile />
    </div>
  );
}
