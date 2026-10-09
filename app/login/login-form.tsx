"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { login } from "./actions";

function BrandMark() {
  return <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-800 text-sm font-bold tracking-tight text-white shadow-sm">PB</span>;
}

function FieldIcon({ type }: { type: "user" | "lock" }) {
  return type === "user"
    ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><circle cx="12" cy="8" r="3.5" /><path d="M5 21c.5-4 2.8-6 7-6s6.5 2 7 6" /></svg>
    : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></svg>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-80">
    {pending ? <><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5 animate-spin"><path d="M12 3a9 9 0 1 1-6.4 2.6" /></svg><span>Signing in…</span></> : <><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M10 5H5v14h5" /><path d="m14 8 4 4-4 4M8 12h10" /></svg><span>Sign in</span></>}
  </button>;
}

export function LoginForm({ error }: { error?: string }) {
  return <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/50 sm:p-8">
    <div className="mb-7 flex items-center gap-3"><BrandMark /><div><h1 className="text-2xl font-semibold tracking-tight text-zinc-900">PolicyBoard</h1><p className="mt-0.5 text-sm text-zinc-500">Sales performance workspace</p></div></div>
    {error && <p role="alert" className="mb-5 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" /></svg>Invalid credentials or temporary lock.</p>}
    <form action={login} className="space-y-5">
      <label className="block text-sm font-medium text-zinc-800">Username<div className="relative mt-1.5"><input className="block w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 pl-11 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={32} required placeholder="Enter your username" /><span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-zinc-400"><FieldIcon type="user" /></span></div></label>
      <label className="block text-sm font-medium text-zinc-800">Password<div className="relative mt-1.5"><input className="block w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 pl-11 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" /><span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-zinc-400"><FieldIcon type="lock" /></span></div></label>
      <SubmitButton />
    </form>
    <div className="mt-6 border-t border-zinc-100 pt-5 text-center"><Link className="text-sm font-medium text-emerald-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href="/setup">First manager setup</Link></div>
  </div>;
}