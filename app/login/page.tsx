import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithDiscordWithNext, signInWithGoogleWithNext } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

function sanitizeNextPath(nextPath: string | undefined): string {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/";
  }

  return nextPath;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = sanitizeNextPath(params.next);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="obsidian-card w-full max-w-md rounded-sm p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Auth Access</p>
        <h1 className="mt-2 font-headline text-4xl font-black tracking-tight text-white">
          Iniciar sesion
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Usa Google o Discord para entrar a KIGEN y sincronizar tu biblioteca personal.
        </p>

        <div className="mt-6 space-y-3">
          <form action={signInWithGoogleWithNext}>
            <input type="hidden" name="next" value={nextPath} />
            <button
              type="submit"
              className="w-full rounded-sm border border-cyan-300/40 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
            >
              Continuar con Google
            </button>
          </form>

          <form action={signInWithDiscordWithNext}>
            <input type="hidden" name="next" value={nextPath} />
            <button
              type="submit"
              className="w-full rounded-sm border border-indigo-300/40 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-indigo-300 transition-colors hover:bg-indigo-300/10"
            >
              Continuar con Discord
            </button>
          </form>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-slate-400 transition-colors hover:text-cyan-300"
          >
            Volver al dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
