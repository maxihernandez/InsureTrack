import Link from "next/link";
import { login } from "./actions";

export const instant = false;

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="mx-auto flex min-h-screen max-w-md items-center p-6">
    <form action={login} className="w-full space-y-4 rounded-xl border p-6">
      <h1 className="text-2xl font-semibold">PolicyBoard</h1>
      {error && <p role="alert" className="text-sm text-red-700">Invalid credentials or temporary lock.</p>}
      <label className="block text-sm font-medium">Username<input className="mt-1 w-full rounded border p-3" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={32} required /></label>
      <label className="block text-sm font-medium">Password<input className="mt-1 w-full rounded border p-3" name="password" type="password" autoComplete="current-password" required /></label>
      <button className="w-full rounded bg-zinc-900 p-3 text-white">Sign in</button>
      <Link className="block text-center text-sm underline" href="/setup">First manager setup</Link>
    </form>
  </main>;
}
