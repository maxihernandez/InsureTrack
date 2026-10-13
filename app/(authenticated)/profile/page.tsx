import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { signedAvatarUrl } from "@/lib/avatar-storage";
import { AvatarForm } from "./avatar-form";

export default async function ProfilePage() {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const [profile] = await getDb()<{ first_name: string; last_name: string; avatar_path: string | null }[]>`select first_name, last_name, avatar_path from policyboard.profiles where user_id = ${user.id}`;
  const avatarUrl = await signedAvatarUrl(profile?.avatar_path ?? null);
  return <section className="mx-auto max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-emerald-700">Account</p><h1 className="mt-1 text-2xl font-semibold">Your profile</h1></div><Link href="/" aria-label="Back to dashboard" title="Back to dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="m14 5-7 7 7 7" /><path d="M7 12h12" /></svg>Back</Link></div><div className="mt-5 flex items-center gap-4">{avatarUrl ? <img src={avatarUrl} alt="Your profile" className="size-20 rounded-full border border-zinc-200 object-cover" /> : <span className="flex size-20 items-center justify-center rounded-full bg-emerald-50 text-2xl font-semibold text-emerald-800">{profile?.first_name?.slice(0, 1).toUpperCase()}</span>}<div><p className="font-semibold">{profile?.first_name} {profile?.last_name}</p><p className="text-sm capitalize text-zinc-600">{user.role}</p></div></div><AvatarForm /></section>;
}
