import Link from "next/link";
import { getMe } from "@/lib/auth";
import { Avatar, Empty, PageHeader, pts } from "../../ui";

export default async function Employees() {
  const { sb } = await getMe("admin");
  const [{ data: people }, { data: ledger }, { data: orders }] = await Promise.all([
    sb.from("profiles").select("id, full_name, email, points_balance").eq("role", "employee").order("full_name"),
    sb.from("points_ledger").select("user_id, delta, reason"),
    sb.from("orders").select("user_id, status"),
  ]);
  const total = (id: string, reason: string) => (ledger ?? []).filter((e) => e.user_id === id && e.reason === reason).reduce((s, e) => s + e.delta, 0);
  const cols = "md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]";
  return (
    <>
      <PageHeader title="Employees" description="Balances, activity and quick awards for everyone on the team." />
      {people?.length ? (
        <div className="card p-0!">
          <div className={`hidden gap-4 border-b border-edge px-6 py-3 text-[13px] font-medium text-muted md:grid ${cols}`}>
            <span>Employee</span><span>Balance</span><span>Earned</span><span>Redeemed</span><span>Orders</span><span className="w-32" />
          </div>
          <ul className="divide-y divide-edge">
            {people.map((p) => {
              const mine = (orders ?? []).filter((o) => o.user_id === p.id);
              const stats = [
                ["Balance", <b key="b" className="text-primary-700">{pts(p.points_balance)}</b>],
                ["Earned", pts(total(p.id, "award"))],
                ["Redeemed", pts(-total(p.id, "redemption") - total(p.id, "refund"))],
                ["Orders", `${mine.length} (${mine.filter((o) => o.status === "pending").length} pending)`],
              ] as const;
              return (
                <li key={p.id} className={`grid grid-cols-2 items-center gap-4 px-5 py-4 md:px-6 ${cols}`}>
                  <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                    <Avatar name={p.full_name} />
                    <div className="min-w-0"><p className="truncate font-medium text-navy">{p.full_name}</p><p className="truncate text-[13px] text-muted">{p.email}</p></div>
                  </div>
                  {stats.map(([k, v]) => <p key={k} className="text-sm"><span className="block text-[12px] text-muted md:hidden">{k}</span>{v}</p>)}
                  <Link href={`/admin?to=${p.id}#award`} className="btn-soft col-span-2 min-h-11 w-full md:col-span-1 md:w-32">Award</Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : <Empty>No employees yet. They appear here after signing up.</Empty>}
    </>
  );
}
