export function TopNav() {
  return (
    <header className="obsidian-glass sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 px-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">
          Transmission Timeline
        </p>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-white">
          Weekly Releases
        </h1>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <button className="rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:border-cyan-300/50 hover:text-cyan-300">
          Live Feed
        </button>
        <button className="rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:border-cyan-300/50 hover:text-cyan-300">
          Roadmap
        </button>
      </div>
    </header>
  );
}
