"use client";

import { useState } from "react";
import { previewUsername } from "@/lib/agent-validation";

type Profile = { first_name: string; last_name: string; username: string | null; email: string | null };
const inputClass = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2";

export function ProfileFields({ agent, reservedUsernames = [] }: { agent?: Profile; reservedUsernames?: string[] }) {
  const [firstName, setFirstName] = useState(agent?.first_name ?? "");
  const [lastName, setLastName] = useState(agent?.last_name ?? "");
  const generated = previewUsername(firstName, lastName, reservedUsernames);
  return <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm font-medium">First name<input name="first_name" required maxLength={100} autoComplete="given-name" value={firstName} onChange={event => setFirstName(event.target.value)} className={inputClass} /></label>
    <label className="text-sm font-medium">Last name<input name="last_name" required maxLength={100} autoComplete="family-name" value={lastName} onChange={event => setLastName(event.target.value)} className={inputClass} /></label>
    {agent ? <label className="text-sm font-medium sm:col-span-2">Username<input name="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9._\-]{2,31}" autoComplete="off" autoCapitalize="none" spellCheck={false} defaultValue={agent.username ?? ""} className={inputClass} /><span className="mt-1 block text-xs font-normal text-zinc-500">3–32 characters. Letters, digits, dots, underscores or hyphens. Case-insensitive.</span></label>
      : <><label className="text-sm font-medium sm:col-span-2">Username <span className="font-normal text-zinc-500">(preview)</span><input readOnly value={generated} placeholder="Enter first and last name" autoComplete="off" className={`${inputClass} bg-zinc-50 text-zinc-600`} /></label>
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 sm:col-span-2">Username is generated automatically: first initial + full last name, without spaces or accents. The assigned username appears in the agent list after saving.</p></>}
    <label className="text-sm font-medium sm:col-span-2">Email <span className="font-normal text-zinc-500">(optional)</span><input name="email" type="email" maxLength={254} autoComplete="off" defaultValue={agent?.email ?? ""} className={inputClass} /></label>
  </div>;
}
