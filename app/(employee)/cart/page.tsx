import { getMe } from "@/lib/auth";
import { PageHeader } from "../../ui";
import { CartView } from "./cart";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const { sb, me } = await getMe("employee");
  // Fresh prices/stock for display only; the DB re-prices at checkout.
  const { data } = await sb.from("rewards").select("id, name, image_url, category, price_points, stock").eq("is_active", true);
  return (
    <>
      <PageHeader title="Your cart" description="Review your rewards, then redeem them with your points." />
      <CartView uid={me.id} balance={me.points_balance} catalog={data ?? []} />
    </>
  );
}
