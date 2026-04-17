import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithEmailWithNext } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginAuthError = "email_invalid" | "email_provider_not_enabled" | "email_signin_failed";
type LoginAuthStatus = "magic_link_sent";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    authError?: string;
    authStatus?: string;
    email?: string;
  }>;
};

function sanitizeNextPath(nextPath: string | undefined): string {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/";
  }

  return nextPath;
}

function parseAuthError(value: string | undefined): LoginAuthError | null {
  if (
    value === "email_invalid" ||
    value === "email_provider_not_enabled" ||
    value === "email_signin_failed"
  ) {
    return value;
  }

  return null;
}

function parseAuthStatus(value: string | undefined): LoginAuthStatus | null {
  if (value === "magic_link_sent") {
    return value;
  }

  return null;
}

function authErrorMessage(authError: LoginAuthError): string {
  if (authError === "email_provider_not_enabled") {
    return "El login por email no esta habilitado en Supabase. Activalo en Auth > Providers > Email.";
  }

  if (authError === "email_invalid") {
    return "El email ingresado no es valido.";
  }

  return "No pudimos iniciar sesion por email en este momento. Reintenta en unos segundos.";
}

function sanitizeEmail(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.trim().toLowerCase();
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = sanitizeNextPath(params.next);
  const authError = parseAuthError(params.authError);
  const authStatus = parseAuthStatus(params.authStatus);
  const emailValue = sanitizeEmail(params.email);

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
          Usa tu email para recibir un magic link y entrar a KIGEN.
        </p>

        {authError ? (
          <div className="mt-4 rounded-sm border border-amber-300/40 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            {authErrorMessage(authError)}
          </div>
        ) : null}

        {authStatus === "magic_link_sent" ? (
          <div className="mt-4 rounded-sm border border-emerald-300/40 bg-emerald-300/10 p-3 text-xs leading-5 text-emerald-100">
            Enviamos un link de acceso a {emailValue || "tu email"}. Revisa tambien spam/promociones.
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <form action={signInWithEmailWithNext} className="space-y-3">
            <input type="hidden" name="next" value={nextPath} />
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              defaultValue={emailValue}
              placeholder="tu@email.com"
              className="w-full rounded-sm border border-white/20 bg-black/20 px-3 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-300/60"
            />
            <button
              type="submit"
              className="w-full rounded-sm border border-cyan-300/40 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
            >
              Enviar magic link
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
