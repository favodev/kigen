import Link from "next/link";

import { updatePasswordAfterRecoveryWithNext } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ResetPasswordAuthError = "password_too_short" | "password_update_failed";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    next?: string;
    authError?: string;
  }>;
};

function sanitizeNextPath(nextPath: string | undefined): string {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/";
  }

  return nextPath;
}

function parseAuthError(value: string | undefined): ResetPasswordAuthError | null {
  if (value === "password_too_short" || value === "password_update_failed") {
    return value;
  }

  return null;
}

function authErrorMessage(authError: ResetPasswordAuthError): string {
  if (authError === "password_too_short") {
    return "La contrasena debe tener al menos 6 caracteres.";
  }

  return "No pudimos actualizar la contrasena en este momento. Reintenta en unos segundos.";
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = sanitizeNextPath(params.next);
  const authError = parseAuthError(params.authError);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <section className="obsidian-card w-full max-w-md rounded-sm p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300">Password Recovery</p>
          <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-white">
            Restablecer contrasena
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Para cambiar tu contrasena, abre el enlace de recuperacion desde tu email.
          </p>

          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="mt-5 inline-flex rounded-sm border border-cyan-300/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
          >
            Volver al login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="obsidian-card w-full max-w-md rounded-sm p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Password Recovery</p>
        <h1 className="mt-2 font-headline text-4xl font-black tracking-tight text-white">
          Definir nueva contrasena
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Cuenta activa: {user.email ?? "tu cuenta"}. Ingresa una nueva contrasena para continuar.
        </p>

        {authError ? (
          <div className="mt-4 rounded-sm border border-amber-300/40 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            {authErrorMessage(authError)}
          </div>
        ) : null}

        <form action={updatePasswordAfterRecoveryWithNext} className="mt-6 space-y-3">
          <input type="hidden" name="next" value={nextPath} />
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Nueva contrasena
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            placeholder="Minimo 6 caracteres"
            className="w-full rounded-sm border border-white/20 bg-black/20 px-3 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-300/60"
          />
          <button
            type="submit"
            className="w-full rounded-sm border border-cyan-300/40 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
          >
            Guardar nueva contrasena
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-4">
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="text-xs font-semibold uppercase tracking-widest text-slate-400 transition-colors hover:text-cyan-300"
          >
            Volver al login
          </Link>
        </div>
      </section>
    </main>
  );
}
