import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { logout } from "../auth-actions";
import { Logo, PointsCard } from "../ui";

export const metadata: Metadata = { title: "Dashboard · TB Rewards" };

export default function Dashboard() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-16">
      <header className="flex items-center justify-between">
        <Logo />
        <form action={logout}><button className="btn-soft">Log out</button></form>
      </header>
      <Suspense fallback={<div className="h-40 w-full max-w-[340px] animate-pulse rounded-[22px] bg-edge" />}>
        <Welcome />
      </Suspense>
    </main>
  );
}

async function Welcome() {
  const sb = await supabase();
  const { data } = await sb.auth.getClaims();
  if (!data) redirect("/login");
  // RLS limits this to the caller's own row.
  const { data: me } = await sb.from("profiles").select("full_name, points_balance").eq("id", data.claims.sub).single();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-[28px] font-semibold text-navy">Hi, {me?.full_name ?? "there"}</h1>
      <PointsCard points={me?.points_balance ?? 0} />
    </section>
  );
}
