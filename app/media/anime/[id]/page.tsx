import Link from "next/link";
import { notFound } from "next/navigation";

import { addToLibrary, removeFromLibrary, updateLibraryEntry } from "@/app/library/actions";
import { CoverImage } from "@/components/media/cover-image";
import { AppShell } from "@/components/shell/app-shell";
import { getAnimeById } from "@/lib/apis/anilist";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AnimeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    setup?: string;
    library?: string;
  }>;
};

function recommendationReason(item: {
  rating: number | null;
  genres: string[];
  status: string | null;
}, baseGenres: string[]): string {
  const baseGenreSet = new Set(baseGenres.map((genre) => genre.toLowerCase()));
  const overlap = item.genres.filter((genre) => baseGenreSet.has(genre.toLowerCase()));
  const signals: string[] = [];
  let points = 18;

  if (overlap.length > 0) {
    const genrePoints = Math.min(52, overlap.length * 22);
    points += genrePoints;
    signals.push(`generos en comun: ${overlap.slice(0, 2).join(" / ")}`);
  }

  if (typeof item.rating === "number") {
    const ratingPoints = Math.max(0, Math.min(25, Math.round(item.rating / 4)));
    points += ratingPoints;
    signals.push(`voto comunitario: ${item.rating}`);
  }

  if (item.status === "releasing") {
    points += 10;
    signals.push("en emision");
  }

  const affinity = Math.min(99, points);
  const tier = affinity >= 75 ? "alta" : affinity >= 50 ? "media" : "exploratoria";
  const detail = signals.length > 0 ? signals.join(" · ") : "curada por catalogo";

  return `afinidad ${tier} (${affinity} pts) · ${detail}`;
}

export default async function AnimeDetailPage({ params, searchParams }: AnimeDetailPageProps) {
  const { id } = await params;
  const pageParams = (await searchParams) ?? {};
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    notFound();
  }

  const anime = await getAnimeById(numericId);

  if (!anime) {
    notFound();
  }

  const nextPath = `/media/anime/${anime.id}`;
  const continuity = anime.related.filter(
    (item) => item.relationType === "prequel" || item.relationType === "sequel",
  );
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
  const relatedLibraryMap = new Map<string, { id: string; status: string; progress: number }>();

  if (user && !setupRequired) {
    const { data, error } = await supabase
      .from("user_media_list")
      .select("id, status, progress, notes")
      .eq("user_id", user.id)
      .eq("source", "AniList")
      .eq("external_id", String(anime.id))
      .maybeSingle();

    if (error?.code === "42P01") {
      setupRequired = true;
    } else {
      libraryEntry = data;

      const relatedIds = Array.from(
        new Set([
          ...anime.related.map((item) => String(item.id)),
          ...anime.recommendations.map((item) => String(item.id)),
        ]),
      );

      if (relatedIds.length > 0) {
        const { data: relatedData } = await supabase
          .from("user_media_list")
          .select("id, external_id, status, progress")
          .eq("user_id", user.id)
          .eq("source", "AniList")
          .in("external_id", relatedIds);

        (relatedData ?? []).forEach((entry: {
          id: string;
          external_id: string;
          status: string;
          progress: number;
        }) => {
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
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Anime Detail</p>
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
            {anime.imageUrl ? (
              <CoverImage src={anime.imageUrl} alt={anime.title} />
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
                <input type="hidden" name="externalId" value={String(anime.id)} />
                <input type="hidden" name="title" value={anime.title} />
                <input
                  type="hidden"
                  name="subtitle"
                  value={`${anime.format ?? "Unknown"} - ${anime.status ?? "unknown"}`}
                />
                <input type="hidden" name="imageUrl" value={anime.imageUrl ?? ""} />
                <input type="hidden" name="score" value={anime.score ?? ""} />
                <input type="hidden" name="source" value={anime.source} />
                <input type="hidden" name="mediaKind" value="ANIME" />
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
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Cast</p>
                {anime.characters.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">Sin datos de personajes por ahora.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {anime.characters.map((character, index) => (
                      <li
                        key={`${character.id}-${character.role ?? "role"}-${index}`}
                        className="flex gap-2 rounded-sm border border-white/10 bg-black/30 p-2"
                      >
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-slate-900">
                          {character.imageUrl ? (
                            <CoverImage src={character.imageUrl} alt={character.name} />
                          ) : (
                            <div className="h-full w-full bg-linear-to-br from-cyan-300/20 to-indigo-500/20" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{character.name}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
                            {character.role ?? "role unknown"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-sm border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Staff</p>
                {anime.staff.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">Sin datos de staff por ahora.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {anime.staff.map((member, index) => (
                      <li
                        key={`${member.id}-${member.role ?? "role"}-${index}`}
                        className="flex gap-2 rounded-sm border border-white/10 bg-black/30 p-2"
                      >
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-slate-900">
                          {member.imageUrl ? (
                            <CoverImage src={member.imageUrl} alt={member.name} />
                          ) : (
                            <div className="h-full w-full bg-linear-to-br from-violet-300/20 to-cyan-500/20" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{member.name}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
                            {member.role ?? "role unknown"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <section className="rounded-sm border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Related</p>
                {anime.related.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">Sin relaciones disponibles por ahora.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {anime.related.map((item, index) => (
                      <li
                        key={`${item.id}-${item.relationType ?? "related"}-${index}`}
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
                          <Link href={`/media/anime/${item.id}`} className="truncate text-sm font-semibold text-white hover:text-cyan-300">
                            {item.title}
                          </Link>
                          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
                            {item.relationType ?? "related"} - {item.format ?? "unknown"} - {item.status ?? "unknown"}
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
                                <input type="hidden" name="externalId" value={String(item.id)} />
                                <input type="hidden" name="title" value={item.title} />
                                <input
                                  type="hidden"
                                  name="subtitle"
                                  value={`${item.format ?? "Unknown"} - ${item.status ?? "unknown"}`}
                                />
                                <input type="hidden" name="imageUrl" value={item.imageUrl ?? ""} />
                                <input type="hidden" name="score" value="" />
                                <input type="hidden" name="source" value="AniList" />
                                <input type="hidden" name="mediaKind" value="ANIME" />
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
                {anime.recommendations.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">Sin recomendaciones disponibles por ahora.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {anime.recommendations.map((item, index) => (
                      <li
                        key={`${item.id}-${item.rating ?? 0}-${index}`}
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
                          <Link href={`/media/anime/${item.id}`} className="truncate text-sm font-semibold text-white hover:text-cyan-300">
                            {item.title}
                          </Link>
                          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
                            {item.score ? `${item.score}/10` : "sin score"} - {item.format ?? "unknown"} - {item.status ?? "unknown"}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-wider text-cyan-300/80">
                            {recommendationReason(item, anime.genres)}
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
                                <input type="hidden" name="externalId" value={String(item.id)} />
                                <input type="hidden" name="title" value={item.title} />
                                <input
                                  type="hidden"
                                  name="subtitle"
                                  value={`${item.format ?? "Unknown"} - ${item.status ?? "unknown"}`}
                                />
                                <input type="hidden" name="imageUrl" value={item.imageUrl ?? ""} />
                                <input type="hidden" name="score" value={item.score ?? ""} />
                                <input type="hidden" name="source" value="AniList" />
                                <input type="hidden" name="mediaKind" value="ANIME" />
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

            <section className="mt-4 rounded-sm border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Continuidad</p>
              {continuity.length === 0 ? (
                <p className="mt-2 text-xs text-slate-400">No hay prequels/sequels detectados para esta obra.</p>
              ) : (
                <ul className="mt-3 grid gap-2 md:grid-cols-2">
                  {continuity.map((item, index) => (
                    <li
                      key={`${item.id}-${item.relationType ?? "continuity"}-${index}`}
                      className="flex items-start justify-between gap-3 rounded-sm border border-white/10 bg-black/30 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/media/anime/${item.id}`}
                          className="text-sm font-semibold text-white transition-colors hover:text-cyan-300"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
                          {item.relationType ?? "related"} - {item.format ?? "unknown"} - {item.status ?? "unknown"}
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
                              <input type="hidden" name="externalId" value={String(item.id)} />
                              <input type="hidden" name="title" value={item.title} />
                              <input
                                type="hidden"
                                name="subtitle"
                                value={`${item.format ?? "Unknown"} - ${item.status ?? "unknown"}`}
                              />
                              <input type="hidden" name="imageUrl" value={item.imageUrl ?? ""} />
                              <input type="hidden" name="score" value="" />
                              <input type="hidden" name="source" value="AniList" />
                              <input type="hidden" name="mediaKind" value="ANIME" />
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
      </section>
    </AppShell>
  );
}
