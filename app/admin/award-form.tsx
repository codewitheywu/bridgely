"use client";

import { useActionState, useEffect, useState } from "react";
import { awardPoints } from "../actions";
import { Spinner } from "../icons";
import { toast } from "../toast";

export function AwardForm({ people, defaultRecipient = "" }: { people: { id: string; full_name: string }[]; defaultRecipient?: string }) {
  const [state, action, pending] = useActionState(awardPoints, undefined);
  const [len, setLen] = useState(0);
  useEffect(() => { if (state?.ok) { toast("Recognition sent. Points added to their balance."); setLen(0); } }, [state]);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium">Employee
        <select name="recipient" required defaultValue={defaultRecipient} key={defaultRecipient} className="field">
          <option value="" disabled>Choose an employee</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">Points
        <input name="points" type="number" min={1} max={10000} required inputMode="numeric" placeholder="e.g. 100" className="field" />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        <span className="flex justify-between">Message <span className={`font-normal ${len > 260 ? "text-[#8A5A00]" : "text-muted"}`}>{len}/280</span></span>
        <textarea name="message" required maxLength={280} rows={3} placeholder="What did they do great?" onChange={(e) => setLen(e.target.value.length)} className="field resize-none" />
      </label>
      {state?.ok === false && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? <><Spinner />Sending…</> : "Send recognition"}</button>
    </form>
  );
}
