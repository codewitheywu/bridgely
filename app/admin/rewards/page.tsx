import { getMe } from "@/lib/auth";
import { Empty, PageHeader, pts, RewardImage } from "../../ui";
import { type Reward, RewardForm } from "./form";

export default async function AdminRewards() {
  const { sb } = await getMe("admin");
  const { data } = await sb.from("rewards").select("id, name, description, image_url, category, price_points, stock, is_active").order("is_active", { ascending: false }).order("name");
  return (
    <>
      <PageHeader title="Rewards" description="Add rewards, set prices and stock, and deactivate what’s retired. Rewards are never deleted, so order history stays intact." />
      <details className="card group">
        <summary className="btn-primary w-fit list-none [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">+ Add reward</span><span className="hidden group-open:inline">Close</span>
        </summary>
        <RewardForm />
      </details>
      {data?.length ? (
        <ul className="flex flex-col gap-4">
          {data.map((r: Reward & { image_url: string | null }) => (
            <li key={r.id} className="card p-4! sm:p-5!">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-4 [&::-webkit-details-marker]:hidden">
                  <div className={`w-20 shrink-0 md:w-24 ${r.is_active ? "" : "opacity-50 grayscale"}`}><RewardImage src={r.image_url} alt="" /></div>
                  <div className="grid min-w-0 flex-1 gap-1 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] md:items-center md:gap-4">
                    <div className="min-w-0"><p className="truncate font-semibold text-navy">{r.name}</p><p className="text-[13px] text-muted">{r.category ?? "Uncategorized"}</p></div>
                    <p className="text-sm font-semibold text-primary-700">{pts(r.price_points)}</p>
                    <p className={`text-sm ${r.stock < 1 ? "text-danger" : r.stock <= 3 ? "text-[#8A5A00]" : "text-muted"}`}>{r.stock} in stock</p>
                    <span className={`w-fit rounded-pill px-3 py-1 text-[13px] font-medium ${r.is_active ? "bg-[#E6F4EA] text-success" : "bg-edge text-ink"}`}>{r.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <span className="hidden text-sm font-medium text-primary-700 sm:inline group-open:hidden">Edit</span>
                  <span className="hidden text-sm font-medium text-primary-700 sm:group-open:inline">Close</span>
                </summary>
                <div className="mt-4 border-t border-edge"><RewardForm r={r} /></div>
              </details>
            </li>
          ))}
        </ul>
      ) : <Empty>No rewards yet. Add your first one above.</Empty>}
    </>
  );
}
