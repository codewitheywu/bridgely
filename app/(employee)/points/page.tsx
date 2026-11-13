import { getMe } from "@/lib/auth";
import { date, Empty, orderNo, PageHeader, pts, Stat } from "../../ui";

type Entry = { id: number; delta: number; reason: string; balance_after: number; note: string | null; created_at: string; recognitions: { giver_name: string; message: string } | null; orders: { order_number: number } | null };

const label = (e: Entry) =>
  e.reason === "award" ? `Recognition from ${e.recognitions?.giver_name}`
  : e.reason === "redemption" ? `Redeemed order ${orderNo(e.orders?.order_number ?? 0)}`
  : e.reason === "refund" ? `Refund for order ${orderNo(e.orders?.order_number ?? 0)}` : "Adjustment";

export default async function Points() {
  const { sb, me } = await getMe("employee");
  const { data } = await sb.from("points_ledger")
    .select("id, delta, reason, balance_after, note, created_at, recognitions(giver_name, message), orders(order_number)")
    .order("id", { ascending: false }).overrideTypes<Entry[], { merge: false }>();
  const sum = (r: string) => (data ?? []).filter((e) => e.reason === r).reduce((s, e) => s + e.delta, 0);
  return (
    <>
      <PageHeader title="Points history" description="Every point you’ve earned, spent and had refunded." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat highlight label="Available" value={me.points_balance.toLocaleString()} />
        <Stat label="Earned" value={`+${sum("award").toLocaleString()}`} />
        <Stat label="Spent" value={`−${(-sum("redemption")).toLocaleString()}`} />
        <Stat label="Refunded" value={`+${sum("refund").toLocaleString()}`} />
      </div>
      {data?.length ? (
        <div className="card p-0!">
          <div className="hidden grid-cols-[1fr_8rem_8rem] gap-4 border-b border-edge px-6 py-3 text-[13px] font-medium text-muted md:grid">
            <span>Activity</span><span className="text-right">Change</span><span className="text-right">Balance</span>
          </div>
          <ol className="divide-y divide-edge">
            {data.map((e) => (
              <li key={e.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-5 py-4 md:grid-cols-[1fr_8rem_8rem] md:px-6">
                <div className="min-w-0">
                  <p className="font-medium text-navy">{label(e)}</p>
                  {e.recognitions?.message && <p className="text-muted">“{e.recognitions.message}”</p>}
                  {e.note && <p className="text-muted">{e.note}</p>}
                  <p className="text-[13px] text-muted">{date(e.created_at)}</p>
                </div>
                <p className={`text-right font-semibold ${e.delta > 0 ? "text-success" : "text-ink"}`}>{e.delta > 0 ? "+" : "−"}{pts(Math.abs(e.delta))}</p>
                <p className="col-start-2 text-right text-[13px] text-muted md:col-start-auto md:text-base md:text-ink">{pts(e.balance_after)}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : <Empty>No points activity yet.</Empty>}
    </>
  );
}
