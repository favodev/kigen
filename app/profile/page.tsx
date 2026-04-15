import Link from "next/link";

import { AppShell } from "@/components/shell/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LibraryProfileRow = {
  id: string;
  source: string;
  media_kind: string;
  status: string;
  progress: number;
  score: number | null;
  notes: string | null;
};

type AchievementCard = {
  key: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressText: string;
};

function rankFromPoints(points: number) {
  if (points >= 900) {
    return { label: "Celestial Archivist", color: "text-fuchsia-300" };
  }

  if (points >= 650) {
    return { label: "Mythic Curator", color: "text-violet-300" };
  }

  if (points >= 420) {
    return { label: "Signal Keeper", color: "text-cyan-300" };
  }

  if (points >= 220) {
    return { label: "Archive Scout", color: "text-emerald-300" };
  }

  return { label: "Rookie Tracker", color: "text-amber-300" };
}

function buildAchievements(entries: LibraryProfileRow[]): AchievementCard[] {
  const total = entries.length;
  const completed = entries.filter((entry) => entry.status === "COMPLETED").length;
  const active = entries.filter((entry) => entry.status === "WATCHING" || entry.status === "READING").length;
  const withNotes = entries.filter((entry) => (entry.notes ?? "").trim().length > 0).length;
  const sources = new Set(entries.map((entry) => entry.source)).size;

  return [
    {
      key: "first-entry",
      title: "Primer Registro",
      description: "Guarda tu primera obra en biblioteca.",
      unlocked: total >= 1,
      progressText: `${Math.min(total, 1)}/1`,
    },
    {
      key: "consistent-watcher",
      title: "Consistencia",
      description: "Mantener 3 obras en tracking activo.",
      unlocked: active >= 3,
      progressText: `${Math.min(active, 3)}/3`,
    },
    {
      key: "finisher",
      title: "Finalizador",
      description: "Completar 5 obras.",
      unlocked: completed >= 5,
      progressText: `${Math.min(completed, 5)}/5`,
    },
    {
      key: "cross-source",
      title: "Multifuente",
      description: "Trackear obras de 2 fuentes distintas.",
      unlocked: sources >= 2,
      progressText: `${Math.min(sources, 2)}/2`,
    },
    {
      key: "critic",
      title: "Critico",
      description: "Registrar notas privadas en 5 obras.",
      unlocked: withNotes >= 5,
      progressText: `${Math.min(withNotes, 5)}/5`,
    },
  ];
}

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AppShell>
        <section className="obsidian-card max-w-3xl rounded-sm p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300">Profile Locked</p>
          <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-white">
            Inicia sesion para ver tu Watcher Rank
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Esta vista calcula rank, progreso y logros desde tu biblioteca personal.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login?next=/profile"
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
      </AppShell>
    );
  }

  const { data, error } = await supabase
    .from("user_media_list")
    .select("id, source, media_kind, status, progress, score, notes")
    .eq("user_id", user.id)
    .limit(1000);

  if (error?.code === "42P01") {
    return (
      <AppShell>
        <section className="obsidian-card max-w-3xl rounded-sm p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300">Database Setup Required</p>
          <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-white">
            Perfil bloqueado hasta migrar biblioteca
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Aplica migraciones de Supabase para habilitar el calculo de rank y logros.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Archivo clave: supabase/migrations/20260410122000_create_user_media_list.sql
          </p>
        </section>
      </AppShell>
    );
  }

  const entries = (data ?? []) as LibraryProfileRow[];
  const total = entries.length;
  const completed = entries.filter((entry) => entry.status === "COMPLETED").length;
  const active = entries.filter((entry) => entry.status === "WATCHING" || entry.status === "READING").length;
  const dropped = entries.filter((entry) => entry.status === "DROPPED").length;
  const totalProgress = entries.reduce((acc, entry) => acc + (entry.progress ?? 0), 0);
  const scoredEntries = entries.filter((entry) => typeof entry.score === "number");
  const averageScore =
    scoredEntries.length > 0
      ? Math.round(
          (scoredEntries.reduce((acc, entry) => acc + (entry.score ?? 0), 0) / scoredEntries.length) * 10,
        ) / 10
      : null;

  const points =
    completed * 40 +
    active * 22 +
    Math.min(240, totalProgress) +
    (averageScore ? Math.round(averageScore * 8) : 0) -
    dropped * 5;

  const rank = rankFromPoints(Math.max(0, points));
  const achievements = buildAchievements(entries);

  return (
    <AppShell>
      <section className="obsidian-card rounded-sm p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Profile</p>
        <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-white">
          Perfil de usuario
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Base inicial de gamificacion activa: rank calculado por actividad real y logros progresivos.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-sm border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Watcher Rank</p>
            <p className={`mt-1 font-headline text-xl font-black ${rank.color}`}>{rank.label}</p>
            <p className="mt-1 text-xs text-slate-500">{Math.max(0, points)} pts</p>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Items</p>
            <p className="mt-1 font-headline text-xl font-black text-white">{total}</p>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Completados</p>
            <p className="mt-1 font-headline text-xl font-black text-emerald-300">{completed}</p>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">En progreso</p>
            <p className="mt-1 font-headline text-xl font-black text-cyan-300">{active}</p>
          </div>
        </div>

        <div className="mt-6 rounded-sm border border-white/10 bg-black/25 p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Resumen</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Progreso acumulado: <span className="text-slate-200">{totalProgress}</span>
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Dropped: <span className="text-slate-200">{dropped}</span>
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Score promedio: <span className="text-slate-200">{averageScore ? `${averageScore}/10` : "n/a"}</span>
            </p>
          </div>
        </div>

        <section className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Logros Base</p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {achievements.map((achievement) => (
              <li
                key={achievement.key}
                className={`rounded-sm border p-3 ${
                  achievement.unlocked
                    ? "border-emerald-300/30 bg-emerald-300/5"
                    : "border-white/10 bg-black/30"
                }`}
              >
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
                    achievement.unlocked ? "text-emerald-300" : "text-slate-400"
                  }`}
                >
                  {achievement.unlocked ? "UNLOCKED" : "IN PROGRESS"}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{achievement.title}</p>
                <p className="mt-1 text-xs text-slate-400">{achievement.description}</p>
                <p className="mt-2 text-[11px] uppercase tracking-widest text-slate-500">
                  progreso: {achievement.progressText}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </AppShell>
  );
}
