"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestDemo } from "../actions";
import { Field } from "../fields";
import { Icon, Spinner } from "../icons";

const sizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

export function DemoForm() {
  const [state, action, pending] = useActionState(requestDemo, undefined);
  if (state?.ok) return (
    <div role="status" className="flex flex-col items-center gap-4 py-8 text-center">
      <span className="grid size-16 place-items-center rounded-full text-success shadow-inset"><Icon name="check" className="size-7" /></span>
      <h2 className="text-2xl font-semibold text-navy">Thanks, we’ve got it!</h2>
      <p className="text-muted">Our team will email you within one business day to pick a time for your demo.</p>
      <Link href="/" className="btn-soft">Back to home</Link>
    </div>
  );
  const v = state?.values;
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Name *" name="name" autoComplete="name" minLength={2} maxLength={80} defaultValue={v?.name} />
      <Field label="Work email *" name="email" type="email" autoComplete="email" maxLength={254} defaultValue={v?.email} />
      <Field label="Company name *" name="company" autoComplete="organization" minLength={2} maxLength={120} defaultValue={v?.company} />
      <label className="flex flex-col gap-2 text-sm font-medium">Company size *
        <select name="size" required defaultValue={v?.size ?? ""} key={v?.size} className="field">
          <option value="" disabled>Select company size</option>
          {sizes.map((s) => <option key={s} value={s}>{s} employees</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">Tell us more about what you’re looking for
        <textarea name="message" maxLength={1000} rows={4} defaultValue={v?.message} className="field resize-y" />
      </label>
      {/* Honeypot: hidden from people, bots fill it in. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] size-px opacity-0" />
      {state?.ok === false && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button className="btn-primary sm:w-fit" disabled={pending}>{pending ? <><Spinner />Sending…</> : "Get a demo"}</button>
      <p className="text-[13px] text-muted">Already a customer? <Link href="/login">Log in</Link></p>
    </form>
  );
}
