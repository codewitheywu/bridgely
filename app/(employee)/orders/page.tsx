import Link from "next/link";
import { getMe } from "@/lib/auth";
import { date, Empty, orderNo, pts, Status, Title } from "../../ui";

export default async function Orders({ searchParams }: { searchParams: Promise<{ placed?: string }> }) {
  const { placed } = await searchParams;
  const { sb } = await getMe("employee");
  const { data } = await sb.from("orders")
    .select("id, order_number, status, total_points, created_at, cancel_reason, order_items(id, reward_name, quantity, unit_price_points)")
    .order("created_at", { ascending: false });
  return (
    <>
      <Title>Your orders</Title>
      {placed && /^\d+$/.test(placed) && (
        <p role="status" className="glass px-5 py-4 font-medium text-success">Order {orderNo(+placed)} placed! Your points have been deducted.</p>
      )}
      {data?.length ? data.map((o) => (
        <article key={o.id} className="card flex flex-col gap-3 p-5!">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-navy">Order {orderNo(o.order_number)}</h2>
            <Status s={o.status} />
          </div>
          <ul className="text-muted">
            {o.order_items.map((i: { id: string; reward_name: string; quantity: number; unit_price_points: number }) =>
              <li key={i.id}>{i.quantity} × {i.reward_name} · {pts(i.unit_price_points * i.quantity)}</li>)}
          </ul>
          <p className="text-[13px] text-muted">{date(o.created_at)} · Total {pts(o.total_points)}</p>
          {o.status === "cancelled" && <p className="text-sm text-danger">Cancelled{o.cancel_reason ? `: ${o.cancel_reason}` : ""}. Points were refunded.</p>}
        </article>
      )) : <Empty>No orders yet. <Link href="/rewards">Browse rewards</Link></Empty>}
    </>
  );
}
