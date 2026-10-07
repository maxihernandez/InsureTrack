import Link from "next/link";
import { logout } from "@/app/login/actions";

type User = { first_name: string; role: string };

export function AppShell({ user, current, children }: { user: User; current: "dashboard" | "goals" | "production" | "team" | "history"; children: React.ReactNode }) {
  const links = [
    { href: "/", label: "Dashboard", key: "dashboard" },
    { href: "/production", label: "Production", key: "production" },
    { href: "/team", label: "Team", key: "team" },
    { href: "/history", label: "History", key: "history" },
    ...(user.role === "manager" ? [{ href: "/goals", label: "Goals", key: "goals" }] : []),
  ];
  const navLink = (link: (typeof links)[number], mobile = false) => (
    <Link
      key={link.key}
      href={link.href}
      aria-current={current === link.key ? "page" : undefined}
      className={`rounded-lg px-2 py-2 text-xs font-medium sm:text-sm ${mobile ? "min-w-0 flex-1 text-center" : "block"} ${current === link.key ? "bg-emerald-100 text-emerald-900" : "text-zinc-600 hover:bg-zinc-100"}`}
    >
      {link.label}
    </Link>
  );
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 md:flex">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white p-5 md:flex md:flex-col">
        <Link href="/" className="text-xl font-bold tracking-tight">PolicyBoard</Link>
        <nav aria-label="Main navigation" className="mt-8 space-y-1">{links.map(link => navLink(link))}</nav>
        <div className="mt-auto border-t border-zinc-200 pt-5">
          <p className="mb-3 text-sm text-zinc-600">{user.first_name} · {user.role}</p>
          <form action={logout}><button className="text-sm font-medium text-zinc-700 hover:underline">Sign out</button></form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 md:hidden">
          <Link href="/" className="text-lg font-bold">PolicyBoard</Link>
          <form action={logout}><button className="text-sm text-zinc-600">Sign out</button></form>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 md:pb-8">{children}</main>
      </div>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-10 flex gap-1 border-t border-zinc-200 bg-white px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden">
        {links.map(link => navLink(link, true))}
      </nav>
    </div>
  );
}
