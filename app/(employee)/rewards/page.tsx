import { getMe } from "@/lib/auth";
import { PageHeader, pts } from "../../ui";
import { Catalog } from "./catalog";

export default async function Rewards() {
  const { sb, me } = await getMe("employee");
  const { data } = await sb.from("rewards").select("id, name, description, image_url, category, price_points, stock").eq("is_active", true).order("price_points");
  return (
    <>
      <PageHeader title="Rewards catalog" description="Spend your points on something you’ll love."
        action={<p className="w-fit rounded-pill px-5 py-2.5 font-semibold text-primary-700 shadow-inset">{pts(me.points_balance)} available</p>} />
      <Catalog uid={me.id} balance={me.points_balance} rewards={data ?? []} />
    </>
  );
}
