import Link from "next/link";
import { getMe } from "@/lib/auth";
import { updateOrder } from "../../actions";
import { Submit } from "../../fields";
import { Avatar, date, Empty, orderNo, PageHeader, pts, Status } from "../../ui";

const tabs = ["all", "pending", "fulfilled", "cancelled"];
type Order = {
  id: string; order_number: number; status: string; total_points: number; created_at: string; cancel_reason: string | null;
  profiles: { full_name: string; email: string } | null;
  order_items: { id: string; reward_name: string; quantity: number }[];
};

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const wanted = (await searchParams).status;
  const status = tabs.find((t) => t === wanted) ?? "all";
  const { sb } = await getMe("admin");
  const { data: all } = await sb.from("orders")
    .select("id, order_number, status, total_points, created_at, cancel_reason, profiles!orders_user_id_fkey(full_name, email), order_items(id, reward_name, quantity)")
    .order("created_at", { ascending: false }).overrideTypes<Order[], { merge: false }>();
  const count = (t: string) => (all ?? []).filter((o) => t === "all" || o.status === t).length;
  const data = (all ?? []).filter((o) => status === "all" || o.status === status);
  return (
    <>
      <PageHeader title="Redemptions" description="Fulfil orders, or cancel them to refund points and restore stock automatically." />
      <nav aria-label="Filter orders" className="-m-4 flex gap-3 overflow-x-auto p-4">
        {tabs.map((t) => (
          <Link key={t} href={`/admin/orders?status=${t}`} aria-current={t === status ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-pill px-5 text-sm font-medium capitalize no-underline! ${t === status ? "text-primary-700! shadow-inset" : "text-ink! shadow-raised"}`}>
            {t}<span className="rounded-pill bg-edge px-2 text-[12px] text-ink">{count(t)}</span>
          </Link>
        ))}
      </nav>
      {data.length ? (
        <ul className="flex flex-col gap-4">
          {data.map((o) => (
            <li key={o.id} className="card flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={o.profiles?.full_name ?? "?"} />
                  <div className="min-w-0"><p className="font-semibold text-navy">{o.profiles?.full_name} · Order {orderNo(o.order_number)}</p><p className="truncate text-[13px] text-muted">{o.profiles?.email} · {date(o.created_at)}</p></div>
                </div>
                <Status s={o.status} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge pt-4">
                <p className="text-ink">{o.order_items.map((i) => `${i.quantity} × ${i.reward_name}`).join(", ")}</p>
                <p className="font-semibold text-navy">{pts(o.total_points)}</p>
              </div>
              {o.cancel_reason && <p className="text-sm text-danger">Cancel reason: {o.cancel_reason}</p>}
              {o.status === "pending" && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <form action={updateOrder}>
                    <input type="hidden" name="id" value={o.id} />
                    <Submit busy="Saving…" className="btn-primary w-full sm:w-auto">Mark fulfilled</Submit>
                  </form>
                  <form action={updateOrder} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    <input type="hidden" name="id" value={o.id} /><input type="hidden" name="op" value="cancel" />
                    <input name="reason" maxLength={280} placeholder="Cancel reason (optional)" aria-label="Cancel reason" className="field min-w-0 flex-1 py-3!" />
                    <Submit busy="Cancelling…" className="btn-soft text-danger!" ask={`Cancel order ${orderNo(o.order_number)}? ${pts(o.total_points)} go back to ${o.profiles?.full_name} and stock is restored.`}>Cancel order</Submit>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : <Empty>No {status === "all" ? "" : status} orders.</Empty>}
    </>
  );
}
