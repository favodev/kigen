import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Library", href: "/library" },
  { label: "Community", href: "/community" },
  { label: "Explorer", href: "/explorer" },
  { label: "Profile", href: "/profile" },
];

export function SideNav() {
  return (
    <aside className="obsidian-panel sticky top-0 h-screen w-20 border-r border-white/10 p-4 transition-all duration-200 hover:w-56">
      <div className="mb-10 overflow-hidden px-2">
        <span className="block whitespace-nowrap text-lg font-black tracking-tight text-white">
          KIGEN
        </span>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item, index) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-sm px-2 py-3 text-sm font-semibold tracking-wide text-slate-300 transition-colors hover:bg-cyan-300/10 hover:text-cyan-300"
          >
            <span className="mr-2 inline-block w-4 text-center text-xs text-cyan-300/80">
              {index + 1}
            </span>
            <span className="opacity-0 transition-opacity group-hover:opacity-100">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
