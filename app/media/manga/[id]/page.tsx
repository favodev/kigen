import Link from "next/link";
import { notFound } from "next/navigation";

import { addToLibrary, removeFromLibrary, updateLibraryEntry } from "@/app/library/actions";
import { CoverImage } from "@/components/media/cover-image";
import { AppShell } from "@/components/shell/app-shell";
import { getMangaById, type MangaDetail } from "@/lib/apis/kitsu";
import type { UnifiedLibraryEntry, UnifiedLibraryRelatedEntry } from "@/lib/media/contracts";
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

type MangaRecommendationForReason = Pick<
  MangaDetail["recommendations"][number],
  "score" | "subtype" | "status"
>;

type MangaRelatedLibraryRow = UnifiedLibraryRelatedEntry & {
  external_id: string;
};

function recommendationReason(item: MangaRecommendationForReason, baseSubtype: MangaDetail["subtype"]): string {
  const signals: string[] = [];
  let points = 16;

  if (baseSubtype && item.subtype && baseSubtype === item.subtype) {
    points += 34;
    signals.push(`mismo subtipo: ${item.subtype}`);
  }

  if (typeof item.score === "number") {
    const scorePoints = Math.max(0, Math.min(35, Math.round(item.score * 3.2)));
    points += scorePoints;
    signals.push(`score comunidad: ${item.score}/10`);
  }

  if (item.status === "current") {
    points += 12;
    signals.push("obra activa");
  } else if (item.status === "finished") {
    points += 6;
  }

  const affinity = Math.min(99, points);
  const tier = affinity >= 72 ? "alta" : affinity >= 48 ? "media" : "exploratoria";
  const detail = signals.length > 0 ? signals.join(" · ") : "seleccion editorial";

  return `afinidad ${tier} (${affinity} pts) · ${detail}`;
}

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
  let libraryEntry: UnifiedLibraryEntry | null = null;
  const relatedLibraryMap = new Map<string, UnifiedLibraryRelatedEntry>();

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

      const relatedIds = Array.from(
        new Set([
          ...manga.related.map((item) => String(item.id)),
          ...manga.recommendations.map((item) => String(item.id)),
        ]),
      );

      if (relatedIds.length > 0) {
        const { data: relatedData } = await supabase
          .from("user_media_list")
          .select("id, external_id, status, progress")
          .eq("user_id", user.id)
          .eq("source", "Kitsu")
          .in("external_id", relatedIds);

        (relatedData ?? []).forEach((entry: MangaRelatedLibraryRow) => {
          relatedLibraryMap.set(String(entry.external_id), {
            id: entry.id,
            status: entry.status,
            progress: entry.progress,
          });
        });
      }
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

        {pageParams.library === "saved" || pageParams.library === "updated" || pageParams.library === "removed" ? (
          <div className="mt-4 rounded-sm border border-emerald-300/30 bg-emerald-300/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              {pageParams.library === "saved"
                ? "Saved"
                : pageParams.library === "updated"
                  ? "Updated"
                  : "Removed"}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              {pageParams.library === "saved"
                ? "Item guardado correctamente en biblioteca."
                : pageParams.library === "updated"
                  ? "Tracking actualizado correctamente."
                  : "Item quitado correctamente de biblioteca."}
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid items-start gap-5 md:grid-cols-[220px_1fr]">
          <div className="aspect-2/3 w-full self-start overflow-hidden rounded-sm border border-white/10 bg-slate-900">
            {manga.imageUrl ? (
              <CoverImage src={manga.imageUrl} alt={manga.title} />
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

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <section className="rounded-sm border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Related Picks</p>
                {manga.related.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">Sin picks relacionados por ahora.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {manga.related.map((item, index) => (
                      <li
                        key={`${item.id}-${item.status ?? "related"}-${index}`}
                        className="flex gap-2 rounded-sm border border-white/10 bg-black/30 p-2"
                      >
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-slate-900">
                          {item.imageUrl ? (
                            <CoverImage src={item.imageUrl} alt={item.title} />
                          ) : (
                            <div className="h-full w-full bg-linear-to-br from-violet-300/20 to-cyan-500/20" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/media/manga/${item.id}`} className="truncate text-sm font-semibold text-white hover:text-cyan-300">
                            {item.title}
                          </Link>
                          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
                            {item.subtype ?? "manga"} - {item.status ?? "unknown"}
                          </p>
                        </div>
                        <div className="shrink-0 self-center">
                          {(() => {
                            const existing = relatedLibraryMap.get(String(item.id));

                            if (existing) {
                              return (
                                <form action={updateLibraryEntry} className="space-y-1 text-right">
                                  <input type="hidden" name="entryId" value={existing.id} />
                                  <input type="hidden" name="nextPath" value={nextPath} />
                                  <select
                                    name="status"
                                    defaultValue={existing.status}
                                    className="rounded-sm border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-200"
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
                                    defaultValue={existing.progress}
                                    className="w-20 rounded-sm border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-200"
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-sm border border-emerald-300/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-300/10"
                                  >
                                    actualizar
                                  </button>
                                </form>
                              );
                            }

                            if (!user) {
                              return (
                                <Link
                                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                                  className="rounded-sm border border-cyan-300/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
                                >
                                  login
                                </Link>
                              );
                            }

                            return (
                              <form action={addToLibrary}>
                                <input type="hidden" name="externalId" value={item.id} />
                                <input type="hidden" name="title" value={item.title} />
                                <input
                                  type="hidden"
                                  name="subtitle"
                                  value={`${item.subtype ?? "manga"} - ${item.status ?? "unknown"}`}
                                />
                                <input type="hidden" name="imageUrl" value={item.imageUrl ?? ""} />
                                <input type="hidden" name="score" value={item.score ?? ""} />
                                <input type="hidden" name="source" value="Kitsu" />
                                <input type="hidden" name="mediaKind" value="MANGA" />
                                <input type="hidden" name="nextPath" value={nextPath} />
                                <button
                                  type="submit"
                                  className="rounded-sm border border-cyan-300/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
                                >
                                  guardar
                                </button>
                              </form>
                            );
                          })()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-sm border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Recomendaciones</p>
                {manga.recommendations.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">Sin recomendaciones por ahora.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {manga.recommendations.map((item, index) => (
                      <li
                        key={`${item.id}-${item.score ?? 0}-${index}`}
                        className="flex gap-2 rounded-sm border border-white/10 bg-black/30 p-2"
                      >
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-slate-900">
                          {item.imageUrl ? (
                            <CoverImage src={item.imageUrl} alt={item.title} />
                          ) : (
                            <div className="h-full w-full bg-linear-to-br from-cyan-300/20 to-indigo-500/20" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/media/manga/${item.id}`} className="truncate text-sm font-semibold text-white hover:text-cyan-300">
                            {item.title}
                          </Link>
                          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
                            {item.score ? `${item.score}/10` : "sin score"} - {item.status ?? "unknown"}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-wider text-cyan-300/80">
                            {recommendationReason(item, manga.subtype)}
                          </p>
                        </div>
                        <div className="shrink-0 self-center">
                          {(() => {
                            const existing = relatedLibraryMap.get(String(item.id));

                            if (existing) {
                              return (
                                <form action={updateLibraryEntry} className="space-y-1 text-right">
                                  <input type="hidden" name="entryId" value={existing.id} />
                                  <input type="hidden" name="nextPath" value={nextPath} />
                                  <select
                                    name="status"
                                    defaultValue={existing.status}
                                    className="rounded-sm border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-200"
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
                                    defaultValue={existing.progress}
                                    className="w-20 rounded-sm border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-200"
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-sm border border-emerald-300/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-300/10"
                                  >
                                    actualizar
                                  </button>
                                </form>
                              );
                            }

                            if (!user) {
                              return (
                                <Link
                                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                                  className="rounded-sm border border-cyan-300/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
                                >
                                  login
                                </Link>
                              );
                            }

                            return (
                              <form action={addToLibrary}>
                                <input type="hidden" name="externalId" value={item.id} />
                                <input type="hidden" name="title" value={item.title} />
                                <input
                                  type="hidden"
                                  name="subtitle"
                                  value={`${item.subtype ?? "manga"} - ${item.status ?? "unknown"}`}
                                />
                                <input type="hidden" name="imageUrl" value={item.imageUrl ?? ""} />
                                <input type="hidden" name="score" value={item.score ?? ""} />
                                <input type="hidden" name="source" value="Kitsu" />
                                <input type="hidden" name="mediaKind" value="MANGA" />
                                <input type="hidden" name="nextPath" value={nextPath} />
                                <button
                                  type="submit"
                                  className="rounded-sm border border-cyan-300/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
                                >
                                  guardar
                                </button>
                              </form>
                            );
                          })()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
