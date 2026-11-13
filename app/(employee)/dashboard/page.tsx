import Link from "next/link";
import { getMe } from "@/lib/auth";
import { date, Empty, orderNo, PointsCard, pts, Status, Title } from "../../ui";

export default async function Dashboard() {
  const { sb, me } = await getMe("employee");
  const [{ data: recog }, { data: orders }] = await Promise.all([
    sb.from("recognitions").select("id, giver_name, points, message, created_at").order("created_at", { ascending: false }).limit(3),
    sb.from("orders").select("id, order_number, status, total_points, created_at").order("created_at", { ascending: false }).limit(3),
  ]);
  return (
    <>
      <Title>Hi, {me.full_name}</Title>
      <div className="flex flex-wrap items-center gap-6">
        <PointsCard points={me.points_balance} />
        <Link href="/rewards" className="btn-primary">Browse rewards</Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-navy">Recent recognition</h2>
          {recog?.length ? recog.map((r) => (
            <div key={r.id} className="card flex flex-col gap-1 p-5!">
              <div className="flex justify-between gap-3"><b className="font-medium">{r.giver_name}</b><span className="font-semibold text-success">+{pts(r.points)}</span></div>
              <p className="text-ink">“{r.message}”</p>
              <span className="text-[13px] text-muted">{date(r.created_at)}</span>
            </div>
          )) : <Empty>No recognitions yet. They’ll show up here when your team celebrates you.</Empty>}
          <Link href="/points">View points history</Link>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-navy">Your orders</h2>
          {orders?.length ? orders.map((o) => (
            <div key={o.id} className="card flex items-center justify-between gap-3 p-5!">
              <div><b className="font-medium">Order {orderNo(o.order_number)}</b><p className="text-[13px] text-muted">{date(o.created_at)} · {pts(o.total_points)}</p></div>
              <Status s={o.status} />
            </div>
          )) : <Empty>No orders yet. <Link href="/rewards">Find something you like</Link></Empty>}
          <Link href="/orders">View all orders</Link>
        </section>
      </div>
    </>
  );
}
