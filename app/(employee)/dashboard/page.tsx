import Link from "next/link";
import { getMe } from "@/lib/auth";
import { Avatar, date, Empty, orderNo, PageHeader, pts, RewardImage, Section, Stat, Status } from "../../ui";

export const metadata = { title: "Home" };

export default async function Dashboard() {
  const { sb, me } = await getMe("employee");
  const [{ data: recog }, { data: orders }, { data: ledger }, { data: within }, { count: inProgress }] = await Promise.all([
    sb.from("recognitions").select("id, giver_name, points, message, created_at").order("created_at", { ascending: false }).limit(5),
    sb.from("orders").select("id, order_number, status, total_points, created_at").order("created_at", { ascending: false }).limit(3),
    sb.from("points_ledger").select("delta, reason"),
    sb.from("rewards").select("id, name, image_url, category, price_points").eq("is_active", true).gt("stock", 0).lte("price_points", me.points_balance).order("price_points", { ascending: false }).limit(3),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const sum = (reason: string) => (ledger ?? []).filter((e) => e.reason === reason).reduce((s, e) => s + e.delta, 0);
  return (
    <>
      <PageHeader title={`Welcome back, ${me.full_name.split(" ")[0]}`} description="Your recognition and rewards at a glance."
        action={<Link href="/rewards" className="btn-primary">Browse rewards</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat highlight label="Available points" value={me.points_balance.toLocaleString()} hint="Ready to redeem" />
        <Stat label="Earned all time" value={sum("award").toLocaleString()} />
        <Stat label="Redeemed" value={(-sum("redemption") - sum("refund")).toLocaleString()} />
        <Stat label="Orders in progress" value={inProgress ?? 0} />
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-3">
        <Section title="Recognition feed" className="lg:col-span-2" action={<Link href="/points" className="text-sm">Points history</Link>}>
          {recog?.length ? (
            <ul className="flex flex-col gap-4">
              {recog.map((r) => (
                <li key={r.id} className="card flex gap-4">
                  <Avatar name={r.giver_name} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p><b className="font-semibold text-navy">{r.giver_name}</b> <span className="text-muted">recognized you</span></p>
                      <span className="rounded-pill bg-[#E6F4EA] px-3 py-1 text-[13px] font-semibold text-success">+{pts(r.points)}</span>
                    </div>
                    <p>“{r.message}”</p>
                    <span className="text-[13px] text-muted">{date(r.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : <Empty>No recognitions yet. They’ll show up here when your team celebrates you.</Empty>}
        </Section>
        <div className="flex flex-col gap-8">
          <Section title="Rewards within reach" action={<Link href="/rewards" className="text-sm">See all</Link>}>
            {within?.length ? within.map((r) => (
              <Link key={r.id} href="/rewards" className="card flex items-center gap-4 p-4! no-underline!">
                <div className="w-16 shrink-0"><RewardImage src={r.image_url} alt="" category={r.category} /></div>
                <div className="min-w-0"><p className="truncate font-medium text-navy">{r.name}</p><p className="text-sm font-semibold text-primary-700">{pts(r.price_points)}</p></div>
              </Link>
            )) : <Empty>Keep earning: rewards you can afford appear here.</Empty>}
          </Section>
          <Section title="Recent orders" action={<Link href="/orders" className="text-sm">View all</Link>}>
            {orders?.length ? orders.map((o) => (
              <div key={o.id} className="card flex items-center justify-between gap-3 p-4!">
                <div><p className="font-medium text-navy">Order {orderNo(o.order_number)}</p><p className="text-[13px] text-muted">{date(o.created_at)} · {pts(o.total_points)}</p></div>
                <Status s={o.status} />
              </div>
            )) : <Empty>No orders yet.</Empty>}
          </Section>
        </div>
      </div>
    </>
  );
}
