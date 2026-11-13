import { getMe } from "@/lib/auth";
import { date, Empty, orderNo, PointsCard, pts, Title } from "../../ui";

type Entry = { id: number; delta: number; reason: string; balance_after: number; note: string | null; created_at: string; recognitions: { giver_name: string; message: string } | null; orders: { order_number: number } | null };

export default async function Points() {
  const { sb, me } = await getMe("employee");
  const { data } = await sb.from("points_ledger")
    .select("id, delta, reason, balance_after, note, created_at, recognitions(giver_name, message), orders(order_number)")
    .order("id", { ascending: false }).overrideTypes<Entry[], { merge: false }>();
  const label = (e: Entry) =>
    e.reason === "award" ? `Recognition from ${e.recognitions?.giver_name}`
    : e.reason === "redemption" ? `Redeemed order ${orderNo(e.orders?.order_number ?? 0)}`
    : e.reason === "refund" ? `Refund for order ${orderNo(e.orders?.order_number ?? 0)}` : "Adjustment";
  return (
    <>
      <Title>Points history</Title>
      <PointsCard points={me.points_balance} />
      {data?.length ? (
        <ol className="card flex flex-col divide-y divide-edge p-0!">
          {data.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-4 px-5 py-4 md:px-8">
              <div className="min-w-0">
                <p className="font-medium">{label(e)}</p>
                {e.recognitions?.message && <p className="text-muted">“{e.recognitions.message}”</p>}
                {e.note && <p className="text-muted">{e.note}</p>}
                <p className="text-[13px] text-muted">{date(e.created_at)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`font-semibold ${e.delta > 0 ? "text-success" : "text-ink"}`}>{e.delta > 0 ? "+" : "−"}{pts(Math.abs(e.delta))}</p>
                <p className="text-[13px] text-muted">Balance {pts(e.balance_after)}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : <Empty>No points activity yet.</Empty>}
    </>
  );
}
