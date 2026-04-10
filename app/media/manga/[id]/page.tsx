import Link from "next/link";
import { notFound } from "next/navigation";

import { addToLibrary, removeFromLibrary, updateLibraryEntry } from "@/app/library/actions";
import { AppShell } from "@/components/shell/app-shell";
import { getMangaById } from "@/lib/apis/kitsu";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MangaDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    setup?: string;
    library?: string;
  }>;
};

export default async function MangaDetailPage({ params, searchParams }: MangaDetailPageProps) {
  const { id } = await params;
  const pageParams = (await searchParams) ?? {};
  const manga = await getMangaById(id);

  if (!manga) {
    notFound();
  }

  const nextPath = `/media/manga/${manga.id}`;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let setupRequired = pageParams.setup === "required";
  let libraryEntry: {
    id: string;
    status: string;
    progress: number;
    notes: string | null;
  } | null = null;

  if (user && !setupRequired) {
    const { data, error } = await supabase
      .from("user_media_list")
      .select("id, status, progress, notes")
      .eq("user_id", user.id)
      .eq("source", "Kitsu")
      .eq("external_id", String(manga.id))
      .maybeSingle();

    if (error?.code === "42P01") {
      setupRequired = true;
    } else {
      libraryEntry = data;
    }
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

        {setupRequired ? (
          <div className="mt-4 rounded-sm border border-amber-300/30 bg-amber-300/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Database setup required</p>
            <p className="mt-2 text-sm text-slate-300">
              Falta aplicar migracion de biblioteca para guardar o actualizar tracking.
            </p>
          </div>
        ) : null}

        {pageParams.library === "save-failed" ? (
          <div className="mt-4 rounded-sm border border-rose-300/30 bg-rose-300/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-300">Save failed</p>
            <p className="mt-2 text-sm text-slate-300">No se pudo guardar este item. Reintenta.</p>
          </div>
        ) : null}

        {pageParams.library === "update-failed" ? (
          <div className="mt-4 rounded-sm border border-rose-300/30 bg-rose-300/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-300">Update failed</p>
            <p className="mt-2 text-sm text-slate-300">No se pudo actualizar este item. Reintenta.</p>
          </div>
        ) : null}

        {pageParams.library === "remove-failed" ? (
          <div className="mt-4 rounded-sm border border-rose-300/30 bg-rose-300/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-300">Remove failed</p>
            <p className="mt-2 text-sm text-slate-300">No se pudo quitar este item. Reintenta.</p>
          </div>
        ) : null}

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

            {!user ? (
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="mt-6 inline-flex rounded-sm border border-cyan-300/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
              >
                login para guardar
              </Link>
            ) : null}

            {user && !setupRequired && !libraryEntry ? (
              <form action={addToLibrary} className="mt-6">
                <input type="hidden" name="externalId" value={manga.id} />
                <input type="hidden" name="title" value={manga.title} />
                <input
                  type="hidden"
                  name="subtitle"
                  value={`${manga.subtype ?? "manga"} - ${manga.status ?? "unknown"}`}
                />
                <input type="hidden" name="imageUrl" value={manga.imageUrl ?? ""} />
                <input type="hidden" name="score" value={manga.score ?? ""} />
                <input type="hidden" name="source" value={manga.source} />
                <input type="hidden" name="mediaKind" value="MANGA" />
                <input type="hidden" name="nextPath" value={nextPath} />
                <button
                  type="submit"
                  className="rounded-sm border border-cyan-300/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
                >
                  guardar en biblioteca
                </button>
              </form>
            ) : null}

            {user && !setupRequired && libraryEntry ? (
              <div className="mt-6 space-y-3 rounded-sm border border-emerald-300/25 bg-emerald-300/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">en biblioteca</p>

                <form action={updateLibraryEntry} className="grid gap-2 sm:grid-cols-3">
                  <input type="hidden" name="entryId" value={libraryEntry.id} />
                  <input type="hidden" name="nextPath" value={nextPath} />

                  <select
                    name="status"
                    defaultValue={libraryEntry.status}
                    className="rounded-sm border border-white/15 bg-black/40 px-2 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-200"
                  >
                    <option value="PLAN">Plan</option>
                    <option value="WATCHING">Watching</option>
                    <option value="READING">Reading</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DROPPED">Dropped</option>
                  </select>

                  <input
                    type="number"
                    name="progress"
                    min={0}
                    defaultValue={libraryEntry.progress}
                    className="rounded-sm border border-white/15 bg-black/40 px-2 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-200"
                    placeholder="Progress"
                  />

                  <button
                    type="submit"
                    className="rounded-sm border border-cyan-300/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
                  >
                    guardar cambios
                  </button>

                  <textarea
                    name="notes"
                    defaultValue={libraryEntry.notes ?? ""}
                    rows={2}
                    className="sm:col-span-3 rounded-sm border border-white/15 bg-black/40 px-2 py-2 text-[11px] text-slate-300"
                    placeholder="Notas privadas"
                  />
                </form>

                <form action={removeFromLibrary}>
                  <input type="hidden" name="entryId" value={libraryEntry.id} />
                  <input type="hidden" name="nextPath" value={nextPath} />
                  <button
                    type="submit"
                    className="rounded-sm border border-rose-300/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-300 transition-colors hover:bg-rose-300/10"
                  >
                    quitar de biblioteca
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
