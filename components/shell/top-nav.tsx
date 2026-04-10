import Link from "next/link";

import { signInWithDiscord, signInWithGoogle, signOut } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function TopNav() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Guest";

  return (
    <header className="obsidian-glass sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 px-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">
          Transmission Timeline
        </p>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-white">
          Weekly Releases
        </h1>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        {user ? (
          <>
            <span className="rounded-sm border border-cyan-300/30 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-300">
              {displayName}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:border-rose-300/50 hover:text-rose-300"
              >
                Logout
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:border-cyan-300/50 hover:text-cyan-300"
            >
              Login
            </Link>
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:border-cyan-300/50 hover:text-cyan-300"
              >
                Login Google
              </button>
            </form>
            <form action={signInWithDiscord}>
              <button
                type="submit"
                className="rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:border-indigo-300/50 hover:text-indigo-300"
              >
                Login Discord
              </button>
            </form>
          </>
        )}
      </div>

      <div className="md:hidden">
        {user ? (
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-sm border border-white/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-300"
            >
              Logout
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="rounded-sm border border-white/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-300"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
