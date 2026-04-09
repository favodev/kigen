import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="obsidian-card w-full max-w-md rounded-sm p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-rose-300">Auth Error</p>
        <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-white">
          No se pudo iniciar sesion
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Fallo el intercambio del codigo OAuth. Reintenta el login y verifica que el redirect
          URI del proveedor coincida con el de Supabase.
        </p>

        <Link
          href="/"
          className="mt-5 inline-flex rounded-sm border border-cyan-300/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
        >
          Volver al dashboard
        </Link>
      </section>
    </main>
  );
}
