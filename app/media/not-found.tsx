import Link from "next/link";

import { AppShell } from "@/components/shell/app-shell";

export default function MediaNotFound() {
  return (
    <AppShell>
      <section className="obsidian-card max-w-3xl rounded-sm p-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-rose-300">Media Not Found</p>
        <h1 className="mt-2 font-headline text-4xl font-black tracking-tight text-white">
          No encontramos esa ficha
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Puede que el ID no exista en la fuente actual o que el contenido ya no este disponible.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-sm border border-cyan-300/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
          >
            Volver al dashboard
          </Link>
          <Link
            href="/library"
            className="rounded-sm border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition-colors hover:border-cyan-300/40 hover:text-cyan-300"
          >
            Ir a biblioteca
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
