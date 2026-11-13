"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

export function Field({ label, ...input }: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      <input className="field" required {...input} />
    </label>
  );
}

/** Password input with show/hide; `hint` adds the live "8+ characters" check for sign-up. */
export function PasswordField({ autoComplete, hint }: { autoComplete: string; hint?: boolean }) {
  const [show, setShow] = useState(false);
  const [ok, setOk] = useState(false);
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      Password
      <span className="relative">
        <input
          name="password" type={show ? "text" : "password"} autoComplete={autoComplete}
          required minLength={hint ? 8 : undefined} maxLength={72} className="field pr-20"
          aria-describedby={hint ? "pw-hint" : undefined}
          onChange={hint ? (e) => setOk(e.target.value.length >= 8) : undefined}
        />
        <button
          type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-1.5 my-auto h-11 cursor-pointer rounded-pill px-4 text-[13px] text-primary-700"
        >
          {show ? "Hide" : "Show"}
        </button>
      </span>
      {hint && (
        <span id="pw-hint" className={`text-[13px] font-normal ${ok ? "text-success" : "text-muted"}`}>
          {ok ? "✓ " : ""}At least 8 characters
        </span>
      )}
    </label>
  );
}

/** Disables itself while its form is submitting (no double submits); optional confirm dialog. */
export function Submit({ children, busy, ask, className = "btn-primary" }: { children: React.ReactNode; busy: string; ask?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} onClick={ask ? (e) => { if (!confirm(ask)) e.preventDefault(); } : undefined}>
      {pending ? busy : children}
    </button>
  );
}
