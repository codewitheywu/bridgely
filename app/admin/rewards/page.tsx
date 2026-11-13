import { getMe } from "@/lib/auth";
import { pts, RewardImage, Title } from "../../ui";
import { type Reward, RewardForm } from "./form";

export default async function AdminRewards() {
  const { sb } = await getMe("admin");
  const { data } = await sb.from("rewards").select("id, name, description, image_url, category, price_points, stock, is_active").order("is_active", { ascending: false }).order("name");
  return (
    <>
      <Title>Rewards</Title>
      <details className="card">
        <summary className="btn-primary w-fit list-none [&::-webkit-details-marker]:hidden">+ Add reward</summary>
        <RewardForm />
      </details>
      <ul className="flex flex-col gap-4">
        {data?.map((r: Reward & { image_url: string | null }) => (
          <li key={r.id} className={`card p-4! md:p-6! ${r.is_active ? "" : "opacity-70"}`}>
            <div className="flex items-center gap-4">
              <div className="w-20 shrink-0 md:w-28"><RewardImage src={r.image_url} alt={r.name} /></div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy">{r.name} {!r.is_active && <span className="ml-1 rounded-pill bg-edge px-2 py-0.5 text-[12px] font-medium text-ink">Inactive</span>}</p>
                <p className="text-sm text-muted">{pts(r.price_points)} · <span className={r.stock < 1 ? "text-danger" : ""}>{r.stock} in stock</span></p>
              </div>
            </div>
            <details className="mt-2">
              <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-primary-700">Edit</summary>
              <RewardForm r={r} />
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
