"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

export type AuthState = { error?: string; values?: { email: string } } | undefined;

const email = z.email("Enter a valid email.").max(254);
const Login = z.object({ email, password: z.string().min(1).max(72) });
// Send each role straight to its home (no bounce through /dashboard).
async function home(sb: Awaited<ReturnType<typeof supabase>>, uid: string) {
  const { data } = await sb.from("profiles").select("role").eq("id", uid).single();
  return data?.role === "admin" ? "/admin" : "/dashboard";
}
// Echo back what the user typed (never the password) so a failed submit doesn't wipe the form.
const keep = (f: FormData) => ({ email: String(f.get("email") ?? "").slice(0, 254) });

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const input = Login.safeParse(Object.fromEntries(form));
  // One generic message: never reveal which field was wrong or whether the email exists.
  const fail = { error: "Invalid email or password.", values: keep(form) };
  if (!input.success) return fail;
  const sb = await supabase();
  const { data, error } = await sb.auth.signInWithPassword(input.data);
  if (error) return fail;
  redirect(await home(sb, data.user.id));
}

// Demo accounts for the assessor. Password lives only in server env; off unless DEMO_MODE=true.
const DEMO = { admin: "admin@example.com", maria: "maria@example.com", juan: "juan@example.com" };

export async function demoLogin(form: FormData) {
  const who = z.enum(["admin", "maria", "juan"]).safeParse(form.get("who"));
  if (process.env.DEMO_MODE !== "true" || !process.env.DEMO_PASSWORD || !who.success) redirect("/login?error=demo");
  const sb = await supabase();
  const { data, error } = await sb.auth.signInWithPassword({ email: DEMO[who.data], password: process.env.DEMO_PASSWORD });
  redirect(error ? "/login?error=demo" : await home(sb, data.user.id));
}

export async function logout() {
  await (await supabase()).auth.signOut();
  redirect("/");
}
