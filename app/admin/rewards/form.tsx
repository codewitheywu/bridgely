"use client";

import { useActionState } from "react";
import { saveReward } from "../../actions";
import { Field } from "../../fields";

export type Reward = { id: string; name: string; description: string; category: string | null; price_points: number; stock: number; is_active: boolean };

export function RewardForm({ r }: { r?: Reward }) {
  const [state, action, pending] = useActionState(saveReward, undefined);
  return (
    <form action={action} className="flex flex-col gap-4 pt-4">
      <input type="hidden" name="id" value={r?.id ?? ""} />
      <Field label="Name" name="name" minLength={2} maxLength={80} defaultValue={r?.name} />
      <label className="flex flex-col gap-2 text-sm font-medium">Description
        <textarea name="description" maxLength={600} rows={2} defaultValue={r?.description} className="field resize-none" />
      </label>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Price (pts)" name="price_points" type="number" min={1} max={1000000} defaultValue={r?.price_points} />
        <Field label="Stock" name="stock" type="number" min={0} max={100000} defaultValue={r?.stock ?? 0} />
        <Field label="Category" name="category" required={false} maxLength={40} defaultValue={r?.category ?? ""} />
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium">Image (PNG, JPG or WEBP, 2MB max)
        <input name="image" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm file:mr-3 file:rounded-pill file:border-0 file:bg-base file:px-4 file:py-2 file:shadow-raised" />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
        <input name="is_active" type="checkbox" defaultChecked={r?.is_active ?? true} className="size-5 accent-[#C2501C]" /> Active (visible in catalog)
      </label>
      {state?.ok === false && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm text-success">Saved.</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : r ? "Save changes" : "Add reward"}</button>
    </form>
  );
}
