"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

export type AuthState = { error?: string; message?: string } | undefined;

const email = z.email("Enter a valid email.").max(254);
const Login = z.object({ email, password: z.string().min(1).max(72) });
const Signup = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(80),
  email,
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const input = Login.safeParse(Object.fromEntries(form));
  // One generic message: never reveal which field was wrong or whether the email exists.
  if (!input.success) return { error: "Invalid email or password." };
  const { error } = await (await supabase()).auth.signInWithPassword(input.data);
  if (error) return { error: "Invalid email or password." };
  redirect("/dashboard");
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const input = Signup.safeParse(Object.fromEntries(form));
  if (!input.success) return { error: input.error.issues[0].message };
  const { fullName, ...creds } = input.data;
  const origin = (await headers()).get("origin"); // Supabase only accepts allow-listed redirect URLs
  // Role is never taken from the client: the DB trigger always creates an employee.
  const { data, error } = await (await supabase()).auth.signUp({
    ...creds,
    options: { data: { full_name: fullName }, emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) {
    console.error("signup", error.message);
    return { error: "Couldn't create that account. Try another email." };
  }
  if (!data.session) return { message: "Check your email to confirm your account." };
  redirect("/dashboard");
}

export async function logout() {
  await (await supabase()).auth.signOut();
  redirect("/");
}
