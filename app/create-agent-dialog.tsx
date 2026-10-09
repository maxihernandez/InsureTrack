"use client";

import { useState } from "react";
import { CreateAgentStepper } from "@/app/(authenticated)/team/manage/create-agent-stepper";

export function CreateAgentDialog({ reservedUsernames }: { reservedUsernames: string[] }) {
  const [open, setOpen] = useState(false);

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Add agent" title="Add agent" className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><circle cx="10" cy="8" r="3" /><path d="M4 20c.4-3.2 2.5-5 6-5 1.7 0 3.2.5 4.2 1.5M19 14v6m-3-3h6" /></svg>
    </button>
    {open && <div className="fixed inset-0 z-40 overflow-y-auto bg-zinc-950/30 p-4 sm:p-6" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="create-agent-title" onClick={event => event.stopPropagation()} className="mx-auto my-4 w-full max-w-5xl rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl sm:my-10 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-emerald-700">Team administration</p><h2 id="create-agent-title" className="text-xl font-semibold">Create agent</h2><p className="mt-1 text-sm text-zinc-600">Credentials belong to PolicyBoard, not Supabase Auth.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close create agent" className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">x</button></div>
        <div className="mt-5"><CreateAgentStepper reservedUsernames={reservedUsernames} /></div>
      </div>
    </div>}
  </>;
}
