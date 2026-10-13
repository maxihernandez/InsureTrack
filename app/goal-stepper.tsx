"use client";

import { Children, useId, useRef, useState, type ReactNode } from "react";

const labels = ["Monthly targets", "Annual targets"];

function StepIcon({ index }: { index: number }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">{index === 0 ? <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16m-9 4h5m-5 3h3" /></> : <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>}</svg>;
}

export function GoalStepper({ children }: { children: ReactNode }) {
  const panels = Children.toArray(children);
  const [selected, setSelected] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const select = (index: number) => { setSelected(index); buttons.current[index]?.focus(); };
  return <div className="mt-5"><div role="tablist" aria-label="Goal periods" className="flex rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm sm:p-2">{labels.map((label, index) => <button key={label} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} ref={element => { buttons.current[index] = element; }} onClick={() => setSelected(index)} onKeyDown={event => { const next = event.key === "ArrowRight" ? (index + 1) % labels.length : event.key === "ArrowLeft" ? (index + labels.length - 1) % labels.length : event.key === "Home" ? 0 : event.key === "End" ? labels.length - 1 : null; if (next !== null) { event.preventDefault(); select(next); } }} className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${selected === index ? "bg-emerald-50 text-emerald-900" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"}`}><span aria-hidden="true" className={`flex size-7 items-center justify-center rounded-lg border ${selected === index ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-300 bg-white"}`}><StepIcon index={index} /></span>{label}</button>)}</div>{panels.map((panel, index) => <div key={labels[index]} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index} tabIndex={0} className="mt-5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">{panel}</div>)}</div>;
}
