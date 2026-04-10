import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LibraryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="p-6">
        <section className="obsidian-card max-w-2xl rounded-sm p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300">Library Locked</p>
          <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-white">
            Inicia sesion para ver tu biblioteca
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            La biblioteca personal depende de auth para guardar tracking por usuario.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login?next=/library"
              className="inline-flex rounded-sm border border-cyan-300/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
            >
              Ir a login
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-sm border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition-colors hover:border-cyan-300/40 hover:text-cyan-300"
            >
              Volver al dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="p-6">
      <section className="obsidian-card max-w-3xl rounded-sm p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Library</p>
        <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-white">
          Bienvenido, {user.email}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Esta pantalla queda lista para conectar el CRUD de `user_media_list` en el siguiente
          bloque de trabajo.
        </p>
      </section>
    </main>
  );
}
