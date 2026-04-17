import Link from "next/link";

import { AppShell } from "@/components/shell/app-shell";
import type { Tables } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UserProfileStatsRow = Tables<"user_profile_stats">;

type AchievementCard = {
  key: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressText: string;
};

function rankColorFromLabel(label: string) {
  if (label === "Celestial Archivist") {
    return "text-fuchsia-300";
  }

  if (label === "Mythic Curator") {
    return "text-violet-300";
  }

  if (label === "Signal Keeper") {
    return "text-cyan-300";
  }

  if (label === "Archive Scout") {
    return "text-emerald-300";
  }

  return "text-amber-300";
}

function formatUpdatedAt(value: string): string {
  if (!value) {
    return "pendiente";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildAchievements(stats: UserProfileStatsRow): AchievementCard[] {
  const hasAverage = typeof stats.average_score === "number";

  return [
    {
      key: "first-entry",
      title: "Primer Registro",
      description: "Guarda tu primera obra en biblioteca.",
      unlocked: stats.total_items >= 1,
      progressText: `${Math.min(stats.total_items, 1)}/1`,
    },
    {
      key: "consistent-watcher",
      title: "Consistencia",
      description: "Mantener 3 obras en tracking activo.",
      unlocked: stats.active_items >= 3,
      progressText: `${Math.min(stats.active_items, 3)}/3`,
    },
    {
      key: "finisher",
      title: "Finalizador",
      description: "Completar 5 obras.",
      unlocked: stats.completed_items >= 5,
      progressText: `${Math.min(stats.completed_items, 5)}/5`,
    },
    {
      key: "burn-and-recover",
      title: "Reintento",
      description: "Registrar 2 obras como DROPPED para recalibrar backlog.",
      unlocked: stats.dropped_items >= 2,
      progressText: `${Math.min(stats.dropped_items, 2)}/2`,
    },
    {
      key: "rated-curator",
      title: "Curador",
      description: "Cargar score promedio para afinar recomendaciones.",
      unlocked: hasAverage,
      progressText: hasAverage ? "1/1" : "0/1",
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
    .from("user_profile_stats")
    .select(
      "user_id, rank_points, rank_label, total_items, completed_items, active_items, dropped_items, total_progress, average_score, achievements_unlocked, updated_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

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
            Archivos clave: 20260415091500_create_user_profile_stats.sql y 20260415184500_refresh_user_profile_stats_job.sql
          </p>
        </section>
      </AppShell>
    );
  }

  const hasSnapshot = Boolean(data);
  const profileStats: UserProfileStatsRow =
    data ?? {
      user_id: user.id,
      rank_points: 0,
      rank_label: "Rookie Tracker",
      total_items: 0,
      completed_items: 0,
      active_items: 0,
      dropped_items: 0,
      total_progress: 0,
      average_score: null,
      achievements_unlocked: 0,
      updated_at: new Date(0).toISOString(),
    };

  const rankColor = rankColorFromLabel(profileStats.rank_label);
  const achievements = buildAchievements(profileStats);

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
        <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">
          persistencia rank: recalculo db (trigger + job horario){" "}
          {hasSnapshot ? `(actualizado ${formatUpdatedAt(profileStats.updated_at)})` : "(snapshot pendiente)"}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-sm border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Watcher Rank</p>
            <p className={`mt-1 font-headline text-xl font-black ${rankColor}`}>{profileStats.rank_label}</p>
            <p className="mt-1 text-xs text-slate-500">{profileStats.rank_points} pts</p>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Items</p>
            <p className="mt-1 font-headline text-xl font-black text-white">{profileStats.total_items}</p>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Completados</p>
            <p className="mt-1 font-headline text-xl font-black text-emerald-300">{profileStats.completed_items}</p>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">En progreso</p>
            <p className="mt-1 font-headline text-xl font-black text-cyan-300">{profileStats.active_items}</p>
          </div>
        </div>

        <div className="mt-6 rounded-sm border border-white/10 bg-black/25 p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Resumen</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Progreso acumulado: <span className="text-slate-200">{profileStats.total_progress}</span>
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Dropped: <span className="text-slate-200">{profileStats.dropped_items}</span>
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Score promedio:{" "}
              <span className="text-slate-200">{profileStats.average_score ? `${profileStats.average_score}/10` : "n/a"}</span>
            </p>
          </div>
        </div>

        <section className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">
            Logros Base ({profileStats.achievements_unlocked}/{achievements.length})
          </p>
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
