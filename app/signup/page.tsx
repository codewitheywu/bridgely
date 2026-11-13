"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "../auth-actions";
import { Field, PasswordField } from "../fields";
import { AuthShell } from "../ui";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);
  return (
    <AuthShell title={state?.message ? "Almost there" : "Create your account"}>
      {state?.message ? (
        <p role="status" className="text-muted">{state.message}</p>
      ) : (
        <form action={action} className="flex flex-col gap-5">
          <Field label="Full name" name="fullName" autoComplete="name" minLength={2} maxLength={80} defaultValue={state?.values?.fullName} />
          <Field label="Work email" name="email" type="email" autoComplete="email" maxLength={254} defaultValue={state?.values?.email} />
          <PasswordField autoComplete="new-password" hint />
          {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
          <button className="btn-primary" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>
        </form>
      )}
      <p className="text-center text-sm text-muted">Already have an account? <Link href="/login">Log in</Link></p>
    </AuthShell>
  );
}
