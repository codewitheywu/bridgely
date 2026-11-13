import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie-bound client: every query runs as the logged-in user, so RLS applies.
export async function supabase() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {} // Server Components can't set cookies; proxy.ts refreshes them.
      },
    },
  });
}
