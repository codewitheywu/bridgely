import { getMe } from "@/lib/auth";
import { Empty, pts, RewardImage, Title } from "../../ui";
import { AddToCart } from "./add-to-cart";

export default async function Rewards() {
  const { sb, me } = await getMe("employee");
  const { data } = await sb.from("rewards").select("id, name, description, image_url, category, price_points, stock").eq("is_active", true).order("price_points");
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Title>Rewards</Title>
        <p className="rounded-pill px-4 py-2 font-medium text-primary-700 shadow-inset">You have {pts(me.points_balance)}</p>
      </div>
      {data?.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => (
            <li key={r.id} className={`card flex flex-col gap-3 p-5! ${r.stock < 1 ? "grayscale-[0.7]" : ""}`}>
              <RewardImage src={r.image_url} alt={r.name} />
              {r.category && <span className="text-[13px] font-medium text-muted">{r.category}</span>}
              <h2 className="text-lg font-semibold text-navy">{r.name}</h2>
              <p className="line-clamp-2 text-muted">{r.description}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <span className="font-semibold text-primary-700">{pts(r.price_points)}</span>
                <span className={`text-[13px] font-medium ${r.stock < 1 ? "text-danger" : r.stock <= 3 ? "text-[#8A5A00]" : "text-muted"}`}>
                  {r.stock < 1 ? "Out of stock" : r.stock <= 3 ? `Only ${r.stock} left` : `${r.stock} in stock`}
                </span>
              </div>
              <AddToCart uid={me.id} id={r.id} stock={r.stock} />
            </li>
          ))}
        </ul>
      ) : <Empty>No rewards available yet.</Empty>}
    </>
  );
}
