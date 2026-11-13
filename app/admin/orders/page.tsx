import Link from "next/link";
import { getMe } from "@/lib/auth";
import { updateOrder } from "../../actions";
import { Submit } from "../../fields";
import { date, Empty, orderNo, pts, Status, Title } from "../../ui";

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
  let q = sb.from("orders")
    .select("id, order_number, status, total_points, created_at, cancel_reason, profiles!orders_user_id_fkey(full_name, email), order_items(id, reward_name, quantity)")
    .order("created_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q.overrideTypes<Order[], { merge: false }>();
  return (
    <>
      <Title>Redemptions</Title>
      <nav aria-label="Filter orders" className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link key={t} href={`/admin/orders?status=${t}`} aria-current={t === status ? "page" : undefined}
            className={`grid min-h-11 place-items-center rounded-pill px-4 text-sm font-medium capitalize no-underline! ${t === status ? "text-primary-700! shadow-inset" : "text-ink! shadow-raised"}`}>{t}</Link>
        ))}
      </nav>
      {data?.length ? data.map((o) => (
        <article key={o.id} className="card flex flex-col gap-3 p-5!">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-navy">Order {orderNo(o.order_number)} · {o.profiles?.full_name}</h2>
            <Status s={o.status} />
          </div>
          <p className="text-muted">{o.order_items.map((i) => `${i.quantity} × ${i.reward_name}`).join(", ")}</p>
          <p className="text-[13px] text-muted">{o.profiles?.email} · {date(o.created_at)} · {pts(o.total_points)}</p>
          {o.cancel_reason && <p className="text-sm text-danger">Reason: {o.cancel_reason}</p>}
          {o.status === "pending" && (
            <div className="flex flex-wrap items-end gap-3">
              <form action={updateOrder}>
                <input type="hidden" name="id" value={o.id} />
                <Submit busy="Saving…">Mark fulfilled</Submit>
              </form>
              <form action={updateOrder} className="flex flex-1 flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={o.id} /><input type="hidden" name="op" value="cancel" />
                <input name="reason" maxLength={280} placeholder="Cancel reason (optional)" aria-label="Cancel reason" className="field min-w-0 flex-1 py-2.5!" />
                <Submit busy="Cancelling…" className="btn-soft text-danger!" ask={`Cancel order ${orderNo(o.order_number)}? ${pts(o.total_points)} go back to ${o.profiles?.full_name} and stock is restored.`}>Cancel order</Submit>
              </form>
            </div>
          )}
        </article>
      )) : <Empty>No {status === "all" ? "" : status} orders.</Empty>}
    </>
  );
}
