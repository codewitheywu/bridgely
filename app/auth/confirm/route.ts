import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// Email-confirmation landing: swaps the one-time code for a session.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (code && !(await (await supabase()).auth.exchangeCodeForSession(code)).error) redirect("/dashboard");
  redirect("/login?error=confirm");
}
