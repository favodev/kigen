import Link from "next/link";
import { redirect } from "next/navigation";

import {
  requestPasswordResetWithNext,
  resendSignupConfirmationWithNext,
  signInWithPasswordWithNext,
  signUpWithPasswordWithNext,
} from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginAuthError =
  | "email_invalid"
  | "password_too_short"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_signup_failed"
  | "email_signin_failed"
  | "email_resend_failed"
  | "email_recovery_failed";
type LoginAuthStatus =
  | "signup_check_email"
  | "signup_confirmation_resent"
  | "password_reset_email_sent"
  | "password_updated";

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
    value === "password_too_short" ||
    value === "invalid_credentials" ||
    value === "email_not_confirmed" ||
    value === "email_signup_failed" ||
    value === "email_signin_failed" ||
    value === "email_resend_failed" ||
    value === "email_recovery_failed"
  ) {
    return value;
  }

  return null;
}

function parseAuthStatus(value: string | undefined): LoginAuthStatus | null {
  if (
    value === "signup_check_email" ||
    value === "signup_confirmation_resent" ||
    value === "password_reset_email_sent" ||
    value === "password_updated"
  ) {
    return value;
  }

  return null;
}

function authErrorMessage(authError: LoginAuthError): string {
  if (authError === "email_invalid") {
    return "El email ingresado no es valido.";
  }

  if (authError === "password_too_short") {
    return "La contrasena debe tener al menos 6 caracteres.";
  }

  if (authError === "invalid_credentials") {
    return "Email o contrasena incorrectos.";
  }

  if (authError === "email_not_confirmed") {
    return "Tu email no esta confirmado todavia. Revisa tu inbox y confirma la cuenta.";
  }

  if (authError === "email_signup_failed") {
    return "No pudimos crear tu cuenta en este momento. Reintenta en unos segundos.";
  }

  if (authError === "email_resend_failed") {
    return "No pudimos reenviar el email de confirmacion en este momento. Reintenta en unos segundos.";
  }

  if (authError === "email_recovery_failed") {
    return "No pudimos enviar el email de recuperacion en este momento. Reintenta en unos segundos.";
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
          Usa tu email y contrasena para entrar a KIGEN.
        </p>

        {authError ? (
          <div className="mt-4 rounded-sm border border-amber-300/40 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            {authErrorMessage(authError)}
          </div>
        ) : null}

        {authStatus === "signup_check_email" ? (
          <div className="mt-4 rounded-sm border border-emerald-300/40 bg-emerald-300/10 p-3 text-xs leading-5 text-emerald-100">
            Creamos tu cuenta para {emailValue || "tu email"}. Revisa tu inbox para confirmar el correo antes de iniciar sesion.
          </div>
        ) : null}

        {authStatus === "signup_confirmation_resent" ? (
          <div className="mt-4 rounded-sm border border-emerald-300/40 bg-emerald-300/10 p-3 text-xs leading-5 text-emerald-100">
            Reenviamos el email de confirmacion a {emailValue || "tu email"}. Revisa inbox y spam/promociones.
          </div>
        ) : null}

        {authStatus === "password_reset_email_sent" ? (
          <div className="mt-4 rounded-sm border border-emerald-300/40 bg-emerald-300/10 p-3 text-xs leading-5 text-emerald-100">
            Enviamos el email de recuperacion a {emailValue || "tu email"}. Revisa inbox y spam/promociones.
          </div>
        ) : null}

        {authStatus === "password_updated" ? (
          <div className="mt-4 rounded-sm border border-emerald-300/40 bg-emerald-300/10 p-3 text-xs leading-5 text-emerald-100">
            Contrasena actualizada. Inicia sesion con tu nueva credencial.
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <form className="space-y-3">
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
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Contrasena
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Minimo 6 caracteres"
              className="w-full rounded-sm border border-white/20 bg-black/20 px-3 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-300/60"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                formAction={signInWithPasswordWithNext}
                type="submit"
                className="w-full rounded-sm border border-cyan-300/40 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
              >
                Iniciar con email
              </button>
              <button
                formAction={signUpWithPasswordWithNext}
                type="submit"
                className="w-full rounded-sm border border-emerald-300/40 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-300/10"
              >
                Crear cuenta
              </button>
            </div>
            <p className="text-[11px] leading-5 text-slate-400">
              Si todavia no tenes cuenta, usa Crear cuenta con tu email y contrasena.
            </p>
          </form>

          <form action={requestPasswordResetWithNext} className="space-y-3 rounded-sm border border-white/10 p-3">
            <input type="hidden" name="next" value={nextPath} />
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Recuperar acceso
            </p>
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
              className="w-full rounded-sm border border-violet-300/40 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-violet-300 transition-colors hover:bg-violet-300/10"
            >
              Enviar email de recuperacion
            </button>
          </form>

          <form action={resendSignupConfirmationWithNext} className="space-y-3 rounded-sm border border-white/10 p-3">
            <input type="hidden" name="next" value={nextPath} />
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Reenviar confirmacion
            </p>
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
              className="w-full rounded-sm border border-teal-300/40 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-teal-300 transition-colors hover:bg-teal-300/10"
            >
              Reenviar email de confirmacion
            </button>
          </form>

          <section className="rounded-sm border border-cyan-300/20 bg-cyan-300/5 p-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-200">
              Checklist entrega email
            </p>
            <ul className="mt-2 space-y-1 text-[11px] leading-5 text-slate-300">
              <li>1) Revisa inbox, spam y promociones.</li>
              <li>2) Espera 1-2 minutos y evita reenviar multiples veces seguidas.</li>
              <li>3) Confirma que escribiste exactamente el email esperado.</li>
              <li>4) Si usas dominio corporativo, valida filtros/antispam del dominio.</li>
            </ul>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              Aplica para confirmacion de cuenta y recuperacion de contrasena.
            </p>
          </section>
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
