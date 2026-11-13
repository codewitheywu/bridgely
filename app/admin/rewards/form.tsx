"use client";

import { useActionState, useEffect } from "react";
import { saveReward } from "../../actions";
import { Field } from "../../fields";
import { Spinner } from "../../icons";
import { toast } from "../../toast";

export type Reward = { id: string; name: string; description: string; category: string | null; price_points: number; stock: number; is_active: boolean };

export function RewardForm({ r }: { r?: Reward }) {
  const [state, action, pending] = useActionState(saveReward, undefined);
  useEffect(() => { if (state?.ok) toast(r ? `${r.name} saved` : "Reward added to the catalog"); }, [state, r]);
  return (
    <form action={action} className="flex flex-col gap-4 pt-5">
      <input type="hidden" name="id" value={r?.id ?? ""} />
      <Field label="Name" name="name" minLength={2} maxLength={80} defaultValue={r?.name} />
      <label className="flex flex-col gap-2 text-sm font-medium">Description
        <textarea name="description" maxLength={600} rows={2} defaultValue={r?.description} className="field resize-none" />
      </label>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Price (pts)" name="price_points" type="number" min={1} max={1000000} defaultValue={r?.price_points} />
        <Field label="Stock" name="stock" type="number" min={0} max={100000} defaultValue={r?.stock ?? 0} />
        <Field label="Category" name="category" required={false} maxLength={40} list="reward-categories" defaultValue={r?.category ?? ""} />
      </div>
      <datalist id="reward-categories">{["Food", "Experiences", "Tech", "Time off", "Merch"].map((c) => <option key={c} value={c} />)}</datalist>
      <label className="flex flex-col gap-2 text-sm font-medium">Image (PNG, JPG or WEBP, 2MB max)
        <input name="image" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-pill file:border-0 file:bg-base file:px-4 file:shadow-raised" />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
        <input name="is_active" type="checkbox" defaultChecked={r?.is_active ?? true} className="size-5 accent-[#C2501C]" /> Active (visible in catalog)
      </label>
      {state?.ok === false && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button className="btn-primary sm:w-fit" disabled={pending}>{pending ? <><Spinner />Saving…</> : r ? "Save changes" : "Add reward"}</button>
    </form>
  );
}
