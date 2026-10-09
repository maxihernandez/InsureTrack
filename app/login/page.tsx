import { LoginForm } from "./login-form";

export const instant = false;

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 p-6">
    <div aria-hidden="true" className="absolute -left-24 top-0 size-80 rounded-full bg-emerald-100/60 blur-3xl" />
    <div aria-hidden="true" className="absolute -right-24 bottom-0 size-80 rounded-full bg-sky-100/60 blur-3xl" />
    <LoginForm error={error} />
  </main>;
}