import type { Metadata } from "next";
import { Suspense } from "react";
import { demoLogin } from "../auth-actions";
import { AuthShell } from "../ui";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Log in · TB Rewards" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back">
      <Suspense>
        <LoginForm />
      </Suspense>
      {process.env.DEMO_MODE === "true" && (
        <form action={demoLogin} className="flex flex-col gap-3 border-t border-edge pt-5">
          <p className="text-center text-[13px] text-muted">Or continue with a demo account</p>
          <div className="grid grid-cols-3 gap-3">
            {["admin", "maria", "juan"].map((who) => (
              <button key={who} name="who" value={who} className="btn-soft px-2 capitalize">{who}</button>
            ))}
          </div>
        </form>
      )}
    </AuthShell>
  );
}
