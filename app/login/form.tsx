"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { login } from "../auth-actions";
import { Field, PasswordField } from "../fields";
import { Spinner } from "../icons";

const notices: Record<string, string> = {
  demo: "Demo login isn't available right now.",
};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const notice = notices[useSearchParams().get("error") ?? ""];
  const error = state?.error ?? notice;
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Email" name="email" type="email" autoComplete="email" maxLength={254} defaultValue={state?.values?.email} />
      <PasswordField autoComplete="current-password" />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? <><Spinner />Logging in…</> : "Log in"}</button>
      <p className="text-center text-sm text-muted">New to TB Rewards? <Link href="/book-a-demo">Book a demo</Link> · <Link href="/guide">How to use it</Link></p>
    </form>
  );
}
