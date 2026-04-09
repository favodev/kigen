import { AppShell } from "@/components/shell/app-shell";
import { getTrendingAnime } from "@/lib/apis/anilist";
import { getTrendingManga } from "@/lib/apis/kitsu";
import { getConnectionsHealth } from "@/lib/connections/health";

type FeedCardItem = {
  id: string | number;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  score: number | null;
  source: string;
};

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

async function loadDashboardFeeds() {
  let animeItems: FeedCardItem[] = fallbackAnimeItems();
  let mangaItems: FeedCardItem[] = fallbackMangaItems();
  let animeLive = false;
  let mangaLive = false;

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

  return {
    animeItems,
    mangaItems,
    animeLive,
    mangaLive,
  };
}

export default async function Home() {
  const health = await getConnectionsHealth();
  const feeds = await loadDashboardFeeds();

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-3">
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
            <div className="rounded-sm border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-400">Health Check</p>
              <p className="mt-1 font-headline text-xl font-bold text-white">
                {health.items.filter((item) => item.status === "ok").length}/
                {health.items.length} OK
              </p>
            </div>
          </div>
        </article>

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
              <li
                key={item.id}
                className="flex gap-3 rounded-sm border border-white/10 bg-black/30 p-3"
              >
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
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                    {item.subtitle}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.score ? `${item.score}/10` : "sin score"} - {item.source}
                  </p>
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
              <li
                key={item.id}
                className="flex gap-3 rounded-sm border border-white/10 bg-black/30 p-3"
              >
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
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                    {item.subtitle}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.score ? `${item.score}/10` : "sin score"} - {item.source}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </AppShell>
  );
}
