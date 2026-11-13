"use client";

import { updateOrder } from "../../actions";
import { Submit } from "../../fields";
import { toast } from "../../toast";

/** Calls the server, then toasts the result. The toast survives the card re-rendering as fulfilled/cancelled. */
export function OrderActions({ id, label, ask }: { id: string; label: string; ask: string }) {
  const run = async (form: FormData) => {
    const res = await updateOrder(undefined, form);
    if (res?.ok) toast(`Order ${label} ${res.done}`);
    else toast(res?.error ?? "Something went wrong.", "error");
  };
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form action={run}>
        <input type="hidden" name="id" value={id} />
        <Submit busy="Saving…" className="btn-primary w-full sm:w-auto">Mark fulfilled</Submit>
      </form>
      <form action={run} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value="cancel" />
        <input name="reason" maxLength={280} placeholder="Cancel reason (optional)" aria-label="Cancel reason" className="field min-w-0 flex-1 py-3!" />
        <Submit busy="Cancelling…" className="btn-soft text-danger!" ask={ask}>Cancel order</Submit>
      </form>
    </div>
  );
}
