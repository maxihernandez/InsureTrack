"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { logout } from "@/app/login/actions";

type User = { first_name: string; role: string };
type IconName = "dashboard" | "team" | "reports" | "goals" | "profile" | "pin" | "pin-filled" | "logout";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    team: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 20c.4-3.1 2.4-5 5.5-5s5.1 1.9 5.5 5M15 15.5c2.8-.3 4.8 1.1 5.2 4" /></>,
    reports: <><path d="M6 3h9l3 3v15H6V3Z" /><path d="M15 3v4h4M9 11h6M9 15h6M9 19h4" /></>,
    goals: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>,
    profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21c.5-4 2.8-6 7-6s6.5 2 7 6" /></>,
    pin: <><path d="M9 4h6l-.8 5.2 3 3V14H6.8v-1.8l3-3L9 4Z" /><path d="M12 14v6" /></>,
    "pin-filled": <><path fill="currentColor" stroke="none" d="M9 4h6l-.8 5.2 3 3V14H6.8v-1.8l3-3L9 4Z" /><path d="M12 14v6" /></>,
    logout: <><path d="M10 5H5v14h5" /><path d="m14 8 4 4-4 4M8 12h10" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">{paths[name]}</svg>;
}

function LogoutButton({ fullWidth = false, compact = false }: { fullWidth?: boolean; compact?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-disabled={pending} aria-label={compact ? "Log out" : undefined} title={compact ? "Log out" : undefined}
    className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60 ${fullWidth ? "w-full" : ""} ${compact ? "w-11 px-0" : ""}`}>
    {compact ? <Icon name="logout" /> : pending ? "Signing out…" : "Logout"}
  </button>;
}

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const current = pathname === "/" ? "dashboard" : pathname.split("/")[1];
  const links = [
    { href: "/", label: "Dashboard", key: "dashboard", icon: "dashboard" as const },
    ...(user.role === "manager" ? [
      { href: "/team", label: "Team", key: "team", icon: "team" as const },
      { href: "/history", label: "Reports", key: "history", icon: "reports" as const },
      { href: "/goals", label: "Goals", key: "goals", icon: "goals" as const },
    ] : []),
  ];
  const navLink = (link: (typeof links)[number], mobile = false) => (
    <Link key={link.key} href={link.href} aria-current={current === link.key ? "page" : undefined} title={!mobile && collapsed ? link.label : undefined}
      className={`min-h-11 rounded-lg px-2 py-2 text-xs font-medium sm:text-sm ${mobile ? "min-w-0 flex-1 text-center" : `flex items-center gap-3 ${collapsed ? "justify-center group-hover/sidebar:justify-start" : ""}`} ${current === link.key ? "bg-emerald-100 text-emerald-900" : "text-zinc-600 hover:bg-zinc-100"}`}>
      {!mobile && <Icon name={link.icon} />}<span className={!mobile && collapsed ? "hidden whitespace-nowrap group-hover/sidebar:inline" : ""}>{link.label}</span>
    </Link>
  );
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 md:flex">
      <aside className={`group/sidebar hidden shrink-0 border-r border-zinc-200 bg-white p-4 transition-[width] md:sticky md:top-0 md:flex md:h-dvh md:self-start md:flex-col md:overflow-hidden ${collapsed ? "w-20 hover:w-60" : "w-60"}`}>
        <div className="relative min-h-24 shrink-0">
          <Link href="/" className="flex min-h-11 items-center gap-2 text-xl font-bold tracking-tight" aria-label="PolicyBoard home"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-800 text-sm text-white">PB</span><span className={collapsed ? "hidden whitespace-nowrap group-hover/sidebar:inline" : "whitespace-nowrap"}>PolicyBoard</span></Link>
          <button type="button" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? "Pin sidebar open" : "Unpin sidebar"} title={collapsed ? "Pin sidebar open" : "Unpin sidebar"} className={`absolute right-0 top-0 inline-flex size-11 items-center justify-center rounded-lg text-zinc-600 transition-opacity hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${collapsed ? "pointer-events-none opacity-0 group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100" : ""}`}><Icon name={collapsed ? "pin" : "pin-filled"} /></button>
        </div>
        <nav aria-label="Main navigation" className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">{links.map(link => navLink(link))}</nav>
        <div className="relative flex shrink-0 items-center justify-center gap-2 border-t border-zinc-200 pt-5">
          <button type="button" onClick={() => setProfileOpen(open => !open)} aria-label="View profile" aria-expanded={profileOpen} title="View profile" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><Icon name="profile" /></button>
          {profileOpen && <div className={`absolute bottom-14 left-0 z-30 w-48 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg ${collapsed ? "hidden group-hover/sidebar:block" : ""}`}><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">{user.first_name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-900">{user.first_name}</p><span className="mt-1 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-600">{user.role}</span></div></div></div>}
          <form action={logout} className="flex justify-center"><LogoutButton compact /></form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 md:hidden">
          <Link href="/" className="text-lg font-bold">PolicyBoard</Link>
          <form action={logout}><LogoutButton /></form>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 md:pb-8">{children}</main>
      </div>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-10 flex gap-1 border-t border-zinc-200 bg-white px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden">
        {links.map(link => navLink(link, true))}
      </nav>
    </div>
  );
}