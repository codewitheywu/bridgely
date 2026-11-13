import type { Metadata } from "next";
import { Suspense } from "react";
import { demoLogin } from "../auth-actions";
import { Submit } from "../fields";
import { AuthShell } from "../ui";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back">
      <Suspense>
        <LoginForm />
      </Suspense>
      {process.env.DEMO_MODE === "true" && (
        <form action={demoLogin} className="flex flex-col gap-3 border-t border-edge pt-5">
          <p className="text-center text-[13px] text-muted">Or sign in instantly with a sample account</p>
          <div className="grid grid-cols-3 gap-3">
            {["admin", "maria", "juan"].map((who) => (
              <Submit key={who} name="who" value={who} busy={who} className="btn-soft px-2 capitalize">{who}</Submit>
            ))}
          </div>
        </form>
      )}
    </AuthShell>
  );
}
