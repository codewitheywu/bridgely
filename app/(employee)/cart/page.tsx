import { getMe } from "@/lib/auth";
import { Title } from "../../ui";
import { CartView } from "./cart";

export default async function CartPage() {
  const { sb, me } = await getMe("employee");
  // Fresh prices/stock for display only; the DB re-prices at checkout.
  const { data } = await sb.from("rewards").select("id, name, image_url, price_points, stock").eq("is_active", true);
  return (
    <>
      <Title>Your cart</Title>
      <CartView uid={me.id} balance={me.points_balance} catalog={data ?? []} />
    </>
  );
}
