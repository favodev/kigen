import Link from "next/link";

import { addToLibrary } from "@/app/library/actions";
import { AppShell } from "@/components/shell/app-shell";
import { getTrendingAnime } from "@/lib/apis/anilist";
import { getTodayReleases } from "@/lib/apis/jikan";
import { getTrendingManga } from "@/lib/apis/kitsu";
import { getConnectionsHealth } from "@/lib/connections/health";
import { isDiagnosticsEnabled } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FeedCardItem = {
  id: string | number;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  score: number | null;
  source: string;
};

type ReleaseCardItem = {
  id: number;
  title: string;
  airingAt: string;
  imageUrl: string | null;
  score: number | null;
  source: string;
};

type HomePageProps = {
  searchParams?: Promise<{
    library?: string;
  }>;
};

function toLibraryKey(source: string, externalId: string | number): string {
  return `${source}:${String(externalId)}`;
}

async function loadLibrarySnapshot() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAuthenticated: false,
      savedKeys: new Set<string>(),
    };
  }

  const { data } = await supabase
    .from("user_media_list")
    .select("source, external_id")
    .eq("user_id", user.id)
    .limit(500);

  const savedKeys = new Set<string>();

  (data ?? []).forEach((item) => {
    savedKeys.add(toLibraryKey(item.source, item.external_id));
  });

  return {
    isAuthenticated: true,
    savedKeys,
  };
}

function statusColor(status: "ok" | "error" | "missing-config") {
  if (status === "ok") {
    return "text-emerald-300";
  }

  if (status === "missing-config") {
    return "text-amber-300";
  }

  return "text-rose-300";
}

function fallbackAnimeItems(): FeedCardItem[] {
  return [
    {
      id: "a-fallback-1",
      title: "Cyber Pulse Protocol",
      subtitle: "TV - releasing - 2026",
      imageUrl: null,
      score: null,
      source: "Fallback",
    },
    {
      id: "a-fallback-2",
      title: "Neon Archive",
      subtitle: "TV - finished - 2024",
      imageUrl: null,
      score: null,
      source: "Fallback",
    },
  ];
}

function fallbackMangaItems(): FeedCardItem[] {
  return [
    {
      id: "m-fallback-1",
      title: "Obsidian Chronicle",
      subtitle: "manga - current",
      imageUrl: null,
      score: null,
      source: "Fallback",
    },
    {
      id: "m-fallback-2",
      title: "Signal of Eden",
      subtitle: "manga - finished",
      imageUrl: null,
      score: null,
      source: "Fallback",
    },
  ];
}

function fallbackReleaseItems(): ReleaseCardItem[] {
  return [
    {
      id: 1,
      title: "Neon Genesis Rebuild",
      airingAt: "04:30 PM JST",
      imageUrl: null,
      score: 8.2,
      source: "Fallback",
    },
    {
      id: 2,
      title: "Cyborg Protocol 7",
      airingAt: "09:15 PM JST",
      imageUrl: null,
      score: 7.9,
      source: "Fallback",
    },
    {
      id: 3,
      title: "Astral Blades",
      airingAt: "11:05 PM JST",
      imageUrl: null,
      score: null,
      source: "Fallback",
    },
  ];
}

async function loadDashboardFeeds() {
  let animeItems: FeedCardItem[] = fallbackAnimeItems();
  let mangaItems: FeedCardItem[] = fallbackMangaItems();
  let releaseItems: ReleaseCardItem[] = fallbackReleaseItems();
  let animeLive = false;
  let mangaLive = false;
  let releaseLive = false;

  try {
    const anilist = await getTrendingAnime(6);

    if (anilist.length > 0) {
      animeItems = anilist;
      animeLive = true;
    }
  } catch {
    animeItems = fallbackAnimeItems();
  }

  try {
    const kitsu = await getTrendingManga(6);

    if (kitsu.length > 0) {
      mangaItems = kitsu;
      mangaLive = true;
    }
  } catch {
    mangaItems = fallbackMangaItems();
  }

  try {
    const jikanReleases = await getTodayReleases(8);

    if (jikanReleases.length > 0) {
      releaseItems = jikanReleases;
      releaseLive = true;
    }
  } catch {
    releaseItems = fallbackReleaseItems();
  }

  return {
    animeItems,
    mangaItems,
    releaseItems,
    animeLive,
    mangaLive,
    releaseLive,
  };
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const diagnosticsEnabled = isDiagnosticsEnabled();
  const health = diagnosticsEnabled ? await getConnectionsHealth() : null;
  const feeds = await loadDashboardFeeds();
  const library = await loadLibrarySnapshot();

  return (
    <AppShell>
      <section className={`grid gap-6 ${diagnosticsEnabled ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}>
        <article className="obsidian-card rounded-sm p-6 lg:col-span-2">
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">
            Kigen Core
          </p>
          <h2 className="font-headline text-4xl font-black tracking-tight text-white">
            Dashboard de Inicio
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Arranque visual y de conectividad listo. Esta vista ya consume anime en vivo desde
            AniList y manga en vivo desde Kitsu con fallback de seguridad.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-sm border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-400">Fase</p>
              <p className="mt-1 font-headline text-xl font-bold text-white">Semana 1</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-400">Estado UI</p>
              <p className="mt-1 font-headline text-xl font-bold text-cyan-300">
                Shell + Live Data
              </p>
            </div>
            {diagnosticsEnabled ? (
              <div className="rounded-sm border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] uppercase tracking-widest text-slate-400">Health Check</p>
                <p className="mt-1 font-headline text-xl font-bold text-white">
                  {health?.items.filter((item) => item.status === "ok").length}/
                  {health?.items.length} OK
                </p>
              </div>
            ) : (
              <div className="rounded-sm border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] uppercase tracking-widest text-slate-400">Modo</p>
                <p className="mt-1 font-headline text-xl font-bold text-emerald-300">Public</p>
              </div>
            )}
          </div>
        </article>

        {diagnosticsEnabled && health ? (
          <article className="obsidian-card rounded-sm p-6">
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">
              Conexiones
            </p>

            <ul className="space-y-3">
              {health.items.map((item) => (
                <li
                  key={item.name}
                  className="rounded-sm border border-white/10 bg-black/30 px-3 py-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                      {item.name}
                    </p>
                    <p className={`text-xs font-bold uppercase ${statusColor(item.status)}`}>
                      {item.status}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{item.details}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {item.latencyMs ? `${item.latencyMs}ms` : "sin medicion"}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[11px] text-slate-500">
              Endpoint JSON: /api/health/connections
            </p>
          </article>
        ) : null}
      </section>

      {params.library === "setup-required" ? (
        <section className="mt-6">
          <article className="obsidian-card rounded-sm border border-amber-300/30 bg-amber-300/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
              Library Setup Required
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Aplique la migracion de Supabase para habilitar persistencia de biblioteca.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Archivo: supabase/migrations/20260410122000_create_user_media_list.sql
            </p>
          </article>
        </section>
      ) : null}

      {params.library === "save-failed" ? (
        <section className="mt-6">
          <article className="obsidian-card rounded-sm border border-rose-300/30 bg-rose-300/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-300">
              Library Save Failed
            </p>
            <p className="mt-2 text-sm text-slate-300">
              No se pudo guardar este item ahora. Reintenta en unos segundos.
            </p>
          </article>
        </section>
      ) : null}

      <section className="mt-6">
        <article className="obsidian-card rounded-sm p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-2xl font-extrabold tracking-tight text-white">
              Today Releases
            </h3>
            <span
              className={`text-xs font-bold uppercase tracking-widest ${
                feeds.releaseLive ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {feeds.releaseLive ? "live jikan" : "fallback"}
            </span>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {feeds.releaseItems.map((item, index) => (
              <li key={`${item.id}-${index}`} className="rounded-sm border border-white/10 bg-black/30 p-3">
                <div className="mb-3 h-36 w-full overflow-hidden rounded-sm border border-white/10 bg-slate-900">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-cyan-300/20 to-fuchsia-500/20" />
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">{item.airingAt}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {item.score ? `${item.score}/10` : "sin score"} - {item.source}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="obsidian-card rounded-sm p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-2xl font-extrabold tracking-tight text-white">
              Trending Anime
            </h3>
            <span
              className={`text-xs font-bold uppercase tracking-widest ${
                feeds.animeLive ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {feeds.animeLive ? "live anilist" : "fallback"}
            </span>
          </div>

          <ul className="space-y-3">
            {feeds.animeItems.map((item) => (
              <li key={item.id} className="flex gap-3 rounded-sm border border-white/10 bg-black/30 p-3">
                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-slate-900">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-cyan-300/20 to-indigo-500/20" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                    {item.subtitle}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.score ? `${item.score}/10` : "sin score"} - {item.source}
                  </p>
                </div>
                <div className="shrink-0 self-center">
                  {(() => {
                    const canSave = item.source !== "Fallback";
                    const isSaved = library.savedKeys.has(toLibraryKey(item.source, item.id));

                    if (!canSave) {
                      return (
                        <span className="rounded-sm border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          offline
                        </span>
                      );
                    }

                    if (isSaved) {
                      return (
                        <span className="rounded-sm border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                          en biblioteca
                        </span>
                      );
                    }

                    if (!library.isAuthenticated) {
                      return (
                        <Link
                          href="/login?next=/"
                          className="rounded-sm border border-cyan-300/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
                        >
                          guardar
                        </Link>
                      );
                    }

                    return (
                      <form action={addToLibrary}>
                        <input type="hidden" name="externalId" value={String(item.id)} />
                        <input type="hidden" name="title" value={item.title} />
                        <input type="hidden" name="subtitle" value={item.subtitle} />
                        <input type="hidden" name="imageUrl" value={item.imageUrl ?? ""} />
                        <input type="hidden" name="score" value={item.score ?? ""} />
                        <input type="hidden" name="source" value={item.source} />
                        <input type="hidden" name="mediaKind" value="ANIME" />
                        <input type="hidden" name="nextPath" value="/" />
                        <button
                          type="submit"
                          className="rounded-sm border border-cyan-300/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
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
        </article>

        <article className="obsidian-card rounded-sm p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-2xl font-extrabold tracking-tight text-white">
              Trending Manga
            </h3>
            <span
              className={`text-xs font-bold uppercase tracking-widest ${
                feeds.mangaLive ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {feeds.mangaLive ? "live kitsu" : "fallback"}
            </span>
          </div>

          <ul className="space-y-3">
            {feeds.mangaItems.map((item) => (
              <li key={item.id} className="flex gap-3 rounded-sm border border-white/10 bg-black/30 p-3">
                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-slate-900">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-violet-300/20 to-cyan-400/20" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                    {item.subtitle}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.score ? `${item.score}/10` : "sin score"} - {item.source}
                  </p>
                </div>
                <div className="shrink-0 self-center">
                  {(() => {
                    const canSave = item.source !== "Fallback";
                    const isSaved = library.savedKeys.has(toLibraryKey(item.source, item.id));

                    if (!canSave) {
                      return (
                        <span className="rounded-sm border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          offline
                        </span>
                      );
                    }

                    if (isSaved) {
                      return (
                        <span className="rounded-sm border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                          en biblioteca
                        </span>
                      );
                    }

                    if (!library.isAuthenticated) {
                      return (
                        <Link
                          href="/login?next=/"
                          className="rounded-sm border border-cyan-300/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
                        >
                          guardar
                        </Link>
                      );
                    }

                    return (
                      <form action={addToLibrary}>
                        <input type="hidden" name="externalId" value={String(item.id)} />
                        <input type="hidden" name="title" value={item.title} />
                        <input type="hidden" name="subtitle" value={item.subtitle} />
                        <input type="hidden" name="imageUrl" value={item.imageUrl ?? ""} />
                        <input type="hidden" name="score" value={item.score ?? ""} />
                        <input type="hidden" name="source" value={item.source} />
                        <input type="hidden" name="mediaKind" value="MANGA" />
                        <input type="hidden" name="nextPath" value="/" />
                        <button
                          type="submit"
                          className="rounded-sm border border-cyan-300/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-300/10"
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
        </article>
      </section>
    </AppShell>
  );
}
