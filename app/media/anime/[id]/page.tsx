import Link from "next/link";
import { notFound } from "next/navigation";

import { addToLibrary } from "@/app/library/actions";
import { AppShell } from "@/components/shell/app-shell";
import { getAnimeById } from "@/lib/apis/anilist";

type AnimeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    notFound();
  }

  const anime = await getAnimeById(numericId);

  if (!anime) {
    notFound();
  }

  return (
    <AppShell>
      <section className="obsidian-card rounded-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Anime Detail</p>
          <Link
            href="/"
            className="rounded-sm border border-white/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-colors hover:border-cyan-300/40 hover:text-cyan-300"
          >
            Volver
          </Link>
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-sm border border-white/10 bg-slate-900">
            {anime.imageUrl ? (
              <img src={anime.imageUrl} alt={anime.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-72 w-full bg-linear-to-br from-cyan-300/20 to-indigo-500/20" />
            )}
          </div>

          <div>
            <h1 className="font-headline text-4xl font-black tracking-tight text-white">{anime.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {anime.description ?? "Sin descripcion disponible por ahora."}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Formato: <span className="text-slate-200">{anime.format ?? "unknown"}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Estado: <span className="text-slate-200">{anime.status ?? "unknown"}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Episodios: <span className="text-slate-200">{anime.episodes ?? "?"}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Duracion: <span className="text-slate-200">{anime.duration ? `${anime.duration} min` : "?"}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Score: <span className="text-slate-200">{anime.score ? `${anime.score}/10` : "sin score"}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Año: <span className="text-slate-200">{anime.seasonYear ?? "?"}</span>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(anime.genres ?? []).map((genre) => (
                <span
                  key={genre}
                  className="rounded-sm border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300"
                >
                  {genre}
                </span>
              ))}
            </div>

            <form action={addToLibrary} className="mt-6">
              <input type="hidden" name="externalId" value={String(anime.id)} />
              <input type="hidden" name="title" value={anime.title} />
              <input type="hidden" name="subtitle" value={`${anime.format ?? "Unknown"} - ${anime.status ?? "unknown"}`} />
              <input type="hidden" name="imageUrl" value={anime.imageUrl ?? ""} />
              <input type="hidden" name="score" value={anime.score ?? ""} />
              <input type="hidden" name="source" value={anime.source} />
              <input type="hidden" name="mediaKind" value="ANIME" />
              <input type="hidden" name="nextPath" value={`/media/anime/${anime.id}`} />
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
