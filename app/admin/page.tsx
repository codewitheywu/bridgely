import Link from "next/link";
import { getMe } from "@/lib/auth";
import { pts, Title } from "../ui";
import { AwardForm } from "./award-form";

export default async function AdminHome() {
  const { sb } = await getMe("admin");
  const [{ data: people }, { count: pending }, { count: lowStock }] = await Promise.all([
    sb.from("profiles").select("id, full_name, email, points_balance").eq("role", "employee").order("full_name"),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("rewards").select("id", { count: "exact", head: true }).eq("is_active", true).lte("stock", 3),
  ]);
  return (
    <>
      <Title>Admin overview</Title>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Pending orders", pending, "/admin/orders?status=pending"], ["Low-stock rewards", lowStock, "/admin/rewards"], ["Employees", people?.length, null]].map(([label, n, href]) => (
          <div key={label as string} className="card flex flex-col gap-1 p-5!">
            <span className="text-sm text-muted">{label}</span>
            <span className="text-3xl font-semibold text-navy">{n ?? 0}</span>
            {href && <Link href={href as string} className="text-sm">View</Link>}
          </div>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="card flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-navy">Award points</h2>
          <AwardForm people={people ?? []} />
        </section>
        <section className="card flex flex-col gap-3 p-0! py-4!">
          <h2 className="px-6 text-xl font-semibold text-navy">Employee balances</h2>
          <ul className="divide-y divide-edge">
            {people?.map((p) => (
              <li key={p.id} className="flex justify-between gap-3 px-6 py-3">
                <span className="min-w-0"><b className="block font-medium">{p.full_name}</b><span className="text-[13px] break-all text-muted">{p.email}</span></span>
                <span className="shrink-0 font-semibold text-primary-700">{pts(p.points_balance)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
