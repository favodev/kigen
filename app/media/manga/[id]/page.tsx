import Link from "next/link";
import { notFound } from "next/navigation";

import { addToLibrary } from "@/app/library/actions";
import { AppShell } from "@/components/shell/app-shell";
import { getMangaById } from "@/lib/apis/kitsu";

type MangaDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MangaDetailPage({ params }: MangaDetailPageProps) {
  const { id } = await params;
  const manga = await getMangaById(id);

  if (!manga) {
    notFound();
  }

  return (
    <AppShell>
      <section className="obsidian-card rounded-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Manga Detail</p>
          <Link
            href="/"
            className="rounded-sm border border-white/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-colors hover:border-cyan-300/40 hover:text-cyan-300"
          >
            Volver
          </Link>
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-sm border border-white/10 bg-slate-900">
            {manga.imageUrl ? (
              <img src={manga.imageUrl} alt={manga.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-72 w-full bg-linear-to-br from-violet-300/20 to-cyan-500/20" />
            )}
          </div>

          <div>
            <h1 className="font-headline text-4xl font-black tracking-tight text-white">{manga.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {manga.description ?? "Sin descripcion disponible por ahora."}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Tipo: <span className="text-slate-200">{manga.subtype ?? "unknown"}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Estado: <span className="text-slate-200">{manga.status ?? "unknown"}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Capitulos: <span className="text-slate-200">{manga.chapterCount ?? "?"}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Volumenes: <span className="text-slate-200">{manga.volumeCount ?? "?"}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Score: <span className="text-slate-200">{manga.score ? `${manga.score}/10` : "sin score"}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Inicio: <span className="text-slate-200">{manga.startDate ?? "?"}</span>
              </p>
            </div>

            <form action={addToLibrary} className="mt-6">
              <input type="hidden" name="externalId" value={manga.id} />
              <input type="hidden" name="title" value={manga.title} />
              <input type="hidden" name="subtitle" value={`${manga.subtype ?? "manga"} - ${manga.status ?? "unknown"}`} />
              <input type="hidden" name="imageUrl" value={manga.imageUrl ?? ""} />
              <input type="hidden" name="score" value={manga.score ?? ""} />
              <input type="hidden" name="source" value={manga.source} />
              <input type="hidden" name="mediaKind" value="MANGA" />
              <input type="hidden" name="nextPath" value={`/media/manga/${manga.id}`} />
              <button
                type="submit"
                className="rounded-sm border border-cyan-300/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
              >
                guardar en biblioteca
              </button>
            </form>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
