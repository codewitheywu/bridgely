import Link from "next/link";
import { getMe } from "@/lib/auth";
import { date, Empty, orderNo, PageHeader, pts, RewardImage, Status } from "../../ui";

export const metadata = { title: "My orders" };

type Order = {
  id: string; order_number: number; status: string; total_points: number; created_at: string; cancel_reason: string | null;
  order_items: { id: string; reward_name: string; reward_image_url: string | null; quantity: number; unit_price_points: number }[];
};
const note: Record<string, string> = {
  pending: "We’re preparing your reward. You’ll see it marked fulfilled here.",
  fulfilled: "Delivered. Enjoy your reward!",
  cancelled: "Cancelled. Your points were refunded.",
};

export default async function Orders({ searchParams }: { searchParams: Promise<{ placed?: string }> }) {
  const { placed } = await searchParams;
  const { sb } = await getMe("employee");
  const { data } = await sb.from("orders")
    .select("id, order_number, status, total_points, created_at, cancel_reason, order_items(id, reward_name, reward_image_url, quantity, unit_price_points)")
    .order("created_at", { ascending: false }).overrideTypes<Order[], { merge: false }>();
  return (
    <>
      <PageHeader title="Your orders" description="Track every redemption from pending to fulfilled." />
      {placed && /^\d+$/.test(placed) && (
        <p role="status" className="glass px-6 py-4 font-medium text-success">Order {orderNo(+placed)} placed! Your points have been deducted.</p>
      )}
      {data?.length ? (
        <ul className="flex flex-col gap-4">
          {data.map((o) => (
            <li key={o.id} className="card flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-semibold text-navy">Order {orderNo(o.order_number)}</h2><p className="text-[13px] text-muted">{date(o.created_at)}</p></div>
                <Status s={o.status} />
              </div>
              <ul className="flex flex-col gap-3 border-y border-edge py-4">
                {o.order_items.map((i) => (
                  <li key={i.id} className="flex items-center gap-4">
                    <div className="w-14 shrink-0"><RewardImage src={i.reward_image_url} alt="" /></div>
                    <span className="min-w-0 flex-1">{i.quantity} × {i.reward_name}</span>
                    <span className="shrink-0 text-muted">{pts(i.unit_price_points * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted">{note[o.status]}{o.cancel_reason ? ` Reason: ${o.cancel_reason}` : ""}</p>
                <p className="font-semibold text-navy">Total {pts(o.total_points)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : <Empty>No orders yet. <Link href="/rewards">Browse rewards</Link></Empty>}
    </>
  );
}
