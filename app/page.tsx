import { AppShell } from "@/components/shell/app-shell";
import { getConnectionsHealth } from "@/lib/connections/health";

function statusColor(status: "ok" | "error" | "missing-config") {
  if (status === "ok") {
    return "text-emerald-300";
  }

  if (status === "missing-config") {
    return "text-amber-300";
  }

  return "text-rose-300";
}

export default async function Home() {
  const health = await getConnectionsHealth();

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
            Arranque visual listo. La siguiente etapa es conectar datos reales del catalogo
            y activar auth de Supabase con flujo server-side seguro.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-sm border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-400">Fase</p>
              <p className="mt-1 font-headline text-xl font-bold text-white">Semana 1</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-400">Estado UI</p>
              <p className="mt-1 font-headline text-xl font-bold text-cyan-300">Shell Ready</p>
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
    </AppShell>
  );
}
