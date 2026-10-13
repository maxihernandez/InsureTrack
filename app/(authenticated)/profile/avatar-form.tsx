"use client";
import { useActionState } from "react";
import { saveAvatar } from "./actions";
const initial = { ok: false, message: "" };
export function AvatarForm() { const [state, action, pending] = useActionState(saveAvatar, initial); return <form action={action} className="mt-5"><label className="block text-sm font-medium">Profile photo<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-2 block w-full text-sm" /></label><p className="mt-2 text-xs text-zinc-500">Private JPG, PNG, or WebP. Maximum 2 MB.</p>{state.message && <p role={state.ok ? "status" : "alert"} className={`mt-3 text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p>}<button type="submit" disabled={pending} className="mt-4 min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60">{pending ? "Uploading…" : "Save photo"}</button></form>; }
