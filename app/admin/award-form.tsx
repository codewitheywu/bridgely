"use client";

import { useActionState, useState } from "react";
import { awardPoints } from "../actions";

export function AwardForm({ people }: { people: { id: string; full_name: string }[] }) {
  const [state, action, pending] = useActionState(awardPoints, undefined);
  const [len, setLen] = useState(0);
  return (
    <form action={action} onSubmit={() => setLen(0)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium">Employee
        <select name="recipient" required defaultValue="" className="field">
          <option value="" disabled>Choose an employee</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">Points
        <input name="points" type="number" min={1} max={10000} required inputMode="numeric" className="field" />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        <span className="flex justify-between">Message <span className="font-normal text-muted">{len}/280</span></span>
        <textarea name="message" required maxLength={280} rows={3} onChange={(e) => setLen(e.target.value.length)} className="field resize-none" />
      </label>
      {state?.ok === false && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm text-success">Points sent!</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Sending…" : "Send recognition"}</button>
    </form>
  );
}
