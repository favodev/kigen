import Link from "next/link";

import { removeFromLibrary, updateLibraryEntry } from "@/app/library/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LibraryPageProps = {
  searchParams?: Promise<{
    setup?: string;
    library?: string;
  }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="p-6">
        <section className="obsidian-card max-w-2xl rounded-sm p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300">Library Locked</p>
          <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-white">
            Inicia sesion para ver tu biblioteca
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            La biblioteca personal depende de auth para guardar tracking por usuario.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login?next=/library"
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
      </main>
    );
  }

  const { data: entries, error } = await supabase
    .from("user_media_list")
    .select("id, title, subtitle, image_url, score, media_kind, status, progress, notes, source, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const setupRequired = error?.code === "42P01" || params.setup === "required";

  return (
    <main className="p-6">
      <section className="obsidian-card max-w-3xl rounded-sm p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Library</p>
        <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-white">
          Bienvenido, {user.email}
        </h1>

        {setupRequired ? (
          <div className="mt-5 rounded-sm border border-amber-300/30 bg-amber-300/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Database setup required
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Falta aplicar la migracion para activar la persistencia de biblioteca.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              supabase/migrations/20260410122000_create_user_media_list.sql
            </p>
          </div>
        ) : null}

        {params.library === "remove-failed" ? (
          <div className="mt-5 rounded-sm border border-rose-300/30 bg-rose-300/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Remove failed
            </p>
            <p className="mt-2 text-sm text-slate-300">
              No se pudo quitar el item ahora. Reintenta en unos segundos.
            </p>
          </div>
        ) : null}

        {params.library === "saved" || params.library === "updated" || params.library === "removed" ? (
          <div className="mt-5 rounded-sm border border-emerald-300/30 bg-emerald-300/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              {params.library === "saved"
                ? "Saved"
                : params.library === "updated"
                  ? "Updated"
                  : "Removed"}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              {params.library === "saved"
                ? "Item guardado correctamente en biblioteca."
                : params.library === "updated"
                  ? "Tracking actualizado correctamente."
                  : "Item quitado correctamente de biblioteca."}
            </p>
          </div>
        ) : null}

        {params.library === "update-failed" ? (
          <div className="mt-5 rounded-sm border border-rose-300/30 bg-rose-300/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Update failed
            </p>
            <p className="mt-2 text-sm text-slate-300">
              No se pudo actualizar el item ahora. Reintenta en unos segundos.
            </p>
          </div>
        ) : null}

        {!setupRequired && (entries?.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Tu biblioteca esta vacia. Desde el dashboard ya podes guardar anime y manga en un click.
          </p>
        ) : null}

        {!setupRequired && (entries?.length ?? 0) > 0 ? (
          <ul className="mt-6 space-y-3">
            {(entries ?? []).map((entry) => (
              <li
                key={entry.id}
                className="flex gap-3 rounded-sm border border-white/10 bg-black/30 p-3"
              >
                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-slate-900">
                  {entry.image_url ? (
                    <img
                      src={entry.image_url}
                      alt={entry.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-cyan-300/20 to-indigo-500/20" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{entry.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                    {entry.media_kind} - {entry.status} - {entry.source}
                  </p>
                  {entry.subtitle ? <p className="mt-1 text-xs text-slate-400">{entry.subtitle}</p> : null}
                  <p className="mt-2 text-xs text-slate-500">{entry.score ? `${entry.score}/10` : "sin score"}</p>

                  <form action={updateLibraryEntry} className="mt-3 grid gap-2 sm:grid-cols-3">
                    <input type="hidden" name="entryId" value={entry.id} />
                    <input type="hidden" name="nextPath" value="/library" />

                    <select
                      name="status"
                      defaultValue={entry.status}
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
                      defaultValue={entry.progress}
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
                      defaultValue={entry.notes ?? ""}
                      rows={2}
                      className="sm:col-span-3 rounded-sm border border-white/15 bg-black/40 px-2 py-2 text-[11px] text-slate-300"
                      placeholder="Notas privadas"
                    />
                  </form>
                </div>

                <div className="shrink-0 self-center">
                  <form action={removeFromLibrary}>
                    <input type="hidden" name="entryId" value={entry.id} />
                    <input type="hidden" name="nextPath" value="/library" />
                    <button
                      type="submit"
                      className="rounded-sm border border-rose-300/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-300 transition-colors hover:bg-rose-300/10"
                    >
                      quitar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
