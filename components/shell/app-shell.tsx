import { SideNav } from "@/components/shell/side-nav";
import { TopNav } from "@/components/shell/top-nav";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-on-background">
      <SideNav />

      <div className="flex min-h-screen flex-1 flex-col">
        <TopNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
