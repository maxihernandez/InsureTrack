"use client";

import { useRef, useState } from "react";
import { createAgent } from "./actions";
import { ProfileFields } from "./profile-fields";
import { SubmitButton } from "./submit-button";

const inputClass = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2";

function StepIcon({ step }: { step: number }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">{step === 0 ? <><circle cx="12" cy="8" r="3" /><path d="M5 20c.5-4 3-6 7-6s6.5 2 7 6" /></> : <><circle cx="8" cy="15" r="3" /><path d="m10 13 7-7 3 3-7 7M15 8l3 3" /></>}</svg>;
}

export function CreateAgentStepper({ reservedUsernames }: { reservedUsernames: string[] }) {
  const [step, setStep] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  function continueToCredentials() {
    const inputs = [...(profileRef.current?.querySelectorAll<HTMLInputElement>("input") ?? [])];
    const invalid = inputs.find(input => !input.checkValidity());
    if (invalid) { invalid.reportValidity(); return; }
    setStep(1);
  }

  return <form action={createAgent} className="space-y-4">
    <div role="tablist" aria-label="Create agent steps" className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
      {[{ label: "Profile", index: 0 }, { label: "Credentials", index: 1 }].map(item => <button key={item.index} type="button" role="tab" aria-selected={step === item.index} onClick={() => item.index === 0 ? setStep(0) : continueToCredentials()} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${step === item.index ? "bg-white text-emerald-900 shadow-sm" : "text-zinc-500 hover:bg-white/70 hover:text-zinc-900"}`}><span className={`flex size-7 items-center justify-center rounded-lg ${step === item.index ? "bg-emerald-700 text-white" : "bg-zinc-200 text-zinc-600"}`}><StepIcon step={item.index} /></span>{item.label}</button>)}
    </div>
    <div hidden={step !== 0} ref={profileRef}><ProfileFields reservedUsernames={reservedUsernames} /></div>
    <div hidden={step !== 1} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={inputClass} /></label><label className="text-sm font-medium">Confirm password<input name="password_confirmation" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={inputClass} /></label></div><p className="text-sm text-zinc-600">12–128 characters. Share credentials through a secure channel. The password is never displayed after saving.</p></div>
    <div className="flex items-center justify-between gap-3"><button type="button" onClick={() => setStep(0)} className={`min-h-10 rounded-lg px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${step === 0 ? "invisible" : ""}`}>Back</button>{step === 0 ? <button type="button" onClick={continueToCredentials} className="min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Continue</button> : <SubmitButton>Create agent</SubmitButton>}</div>
  </form>;
}