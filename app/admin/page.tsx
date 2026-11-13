import Link from "next/link";
import { getMe } from "@/lib/auth";
import { Avatar, date, Empty, PageHeader, pts, Section, Stat } from "../ui";
import { AwardForm } from "./award-form";

type Recog = { id: string; points: number; message: string; created_at: string; giver_name: string; profiles: { full_name: string } | null };

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  const { sb } = await getMe("admin");
  const [{ data: people }, { count: pending }, { count: lowStock }, { count: active }, { data: awards }, { data: recent }] = await Promise.all([
    sb.from("profiles").select("id, full_name").eq("role", "employee").order("full_name"),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("rewards").select("id", { count: "exact", head: true }).eq("is_active", true).lte("stock", 3),
    sb.from("rewards").select("id", { count: "exact", head: true }).eq("is_active", true),
    sb.from("points_ledger").select("delta").eq("reason", "award"),
    sb.from("recognitions").select("id, points, message, created_at, giver_name, profiles!recognitions_recipient_id_fkey(full_name)")
      .order("created_at", { ascending: false }).limit(5).overrideTypes<Recog[], { merge: false }>(),
  ]);
  return (
    <>
      <PageHeader title="Admin overview" description="Recognize your team and keep rewards flowing."
        action={<Link href="/admin/orders?status=pending" className="btn-primary">Review pending orders</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat highlight label="Pending orders" value={pending ?? 0} hint="Waiting for fulfilment" />
        <Stat label="Points awarded" value={(awards ?? []).reduce((s, a) => s + a.delta, 0).toLocaleString()} hint="All time" />
        <Stat label="Active rewards" value={active ?? 0} />
        <Stat label="Low stock" value={lowStock ?? 0} hint="3 or fewer left" />
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-5">
        <Section title="Award points" className="lg:col-span-2">
          <div id="award" className="card"><AwardForm people={people ?? []} defaultRecipient={people?.some((p) => p.id === to) ? to : ""} /></div>
        </Section>
        <Section title="Recent recognition" className="lg:col-span-3" action={<Link href="/admin/employees" className="text-sm">All employees</Link>}>
          {recent?.length ? (
            <ul className="card flex flex-col divide-y divide-edge p-0!">
              {recent.map((r) => (
                <li key={r.id} className="flex gap-4 px-5 py-4 sm:px-6">
                  <Avatar name={r.profiles?.full_name ?? "?"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p><b className="font-semibold text-navy">{r.profiles?.full_name}</b> <span className="text-muted">received</span> <b className="text-success">+{pts(r.points)}</b></p>
                      <span className="text-[13px] text-muted">{date(r.created_at)}</span>
                    </div>
                    <p className="text-muted">“{r.message}” · {r.giver_name}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <Empty>No recognitions yet. Send the first one!</Empty>}
        </Section>
      </div>
    </>
  );
}
