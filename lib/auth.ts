import { redirect } from "next/navigation";
import { supabase } from "./supabase";

/** Current user + their profile from the DB (never from editable JWT metadata). Wrong role → their own home. */
export async function getMe(role: "admin" | "employee") {
  const sb = await supabase();
  const { data } = await sb.auth.getClaims();
  if (!data) redirect("/login");
  const { data: me } = await sb.from("profiles").select("id, full_name, role, points_balance").eq("id", data.claims.sub).single();
  if (!me) redirect("/login");
  if (me.role !== role) redirect(me.role === "admin" ? "/admin" : "/dashboard");
  return { sb, me };
}
