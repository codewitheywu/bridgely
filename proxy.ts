import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PRIVATE = ["/dashboard", "/rewards", "/cart", "/orders", "/points", "/admin"];
const GUEST_ONLY = ["/login"];

// Refreshes the session cookie and does optimistic redirects. Real enforcement is RLS + DB functions.
export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => res.headers.set(k, v));
      },
    },
  });

  const { data } = await sb.auth.getClaims(); // verifies the JWT, unlike getSession()
  const path = req.nextUrl.pathname;
  const target =
    !data?.claims && PRIVATE.some((p) => path.startsWith(p)) ? "/login"
    : data?.claims && GUEST_ONLY.includes(path) ? "/dashboard"
    : null;
  if (!target) return res;

  const redirect = NextResponse.redirect(new URL(target, req.url));
  res.cookies.getAll().forEach((c) => redirect.cookies.set(c)); // keep refreshed tokens
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
