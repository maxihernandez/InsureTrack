"use client";

import { useId, useRef, useState, type ReactNode } from "react";

function StepIcon({ index }: { index: number }) {
  const graphic = index === 0 ? <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>
    : index === 1 ? <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 20c.4-3.1 2.4-5 5.5-5s5.1 1.9 5.5 5M15 15.5c2.8-.3 4.8 1.1 5.2 4" /></>
      : <><path d="M4 19V10m5 9V5m5 14v-7m5 7V3" /><path d="M3 21h18" /></>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">{graphic}</svg>;
}

export function DashboardSteps({ production, ranking, commercial, enabled = true }: {
  production: ReactNode; ranking: ReactNode; commercial: ReactNode; enabled?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const steps = [
    { label: "Product goals", content: production },
    { label: "Team ranking", content: ranking },
    { label: "Commercial activity", content: commercial },
  ];
  if (!enabled) return <>{production}<div className="mt-6 grid gap-4 lg:grid-cols-2">{ranking}{commercial}</div></>;

  function select(index: number) {
    setSelected(index);
    buttons.current[index]?.focus();
  }

  return <div className="mt-5">
    <div role="tablist" aria-label="Dashboard sections" className="flex items-center rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm sm:p-2">
      {steps.map((step, index) => <div key={step.label} role="presentation" className="flex min-w-0 flex-1 items-center last:flex-none last:w-1/3">
        <button type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
          aria-selected={selected === index} tabIndex={selected === index ? 0 : -1}
          ref={element => { buttons.current[index] = element; }}
          onClick={() => setSelected(index)}
          onKeyDown={event => {
            const next = event.key === "ArrowRight" ? (index + 1) % steps.length
              : event.key === "ArrowLeft" ? (index + steps.length - 1) % steps.length
              : event.key === "Home" ? 0 : event.key === "End" ? steps.length - 1 : null;
            if (next !== null) { event.preventDefault(); select(next); }
          }}
          className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:flex-row sm:gap-2 sm:px-2 sm:text-sm ${selected === index ? "bg-emerald-50 text-emerald-900" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"}`}>
          <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${selected === index ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-300 bg-white"}`}><StepIcon index={index} /></span>
          <span>{step.label}</span>
        </button>
        {index < steps.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-3 shrink-0 bg-zinc-200 sm:mx-2 sm:w-6" />}
      </div>)}
    </div>
    {steps.map((step, index) => <div key={step.label} role="tabpanel" id={`${id}-panel-${index}`}
      aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index} tabIndex={0}
      className="mt-4 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
      {step.content}
    </div>)}
  </div>;
}
