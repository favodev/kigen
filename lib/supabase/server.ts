import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

type SupabaseServerClient = ReturnType<typeof createServerClient>;

export async function createSupabaseServerClient(): Promise<SupabaseServerClient> {
  if (process.env.KIGEN_SMOKE_MODE === "true") {
    return {
      auth: {
        async getUser() {
          return {
            data: { user: null },
            error: null,
          };
        },
      },
    } as unknown as SupabaseServerClient;
  }

  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignored in Server Components where cookies are read-only.
          }
        },
      },
    },
  );
}
