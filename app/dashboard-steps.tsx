"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export function DashboardSteps({ production, ranking, commercial, enabled = true }: {
  production: ReactNode; ranking: ReactNode; commercial: ReactNode; enabled?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const steps = [
    { label: "Production", content: production },
    { label: "Ranking", content: ranking },
    { label: "Commercial", content: commercial },
  ];
  if (!enabled) return <>{production}<div className="mt-8 grid gap-6 lg:grid-cols-2">{ranking}{commercial}</div></>;

  function select(index: number) {
    setSelected(index);
    buttons.current[index]?.focus();
  }

  return <div className="mt-8">
    <div role="tablist" aria-label="Dashboard sections" className="flex items-center rounded-xl border border-zinc-200 bg-white p-2 shadow-sm sm:p-3">
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
          className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm ${selected === index ? "bg-emerald-50 text-emerald-900" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"}`}>
          <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${selected === index ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-300 bg-white"}`}>{index + 1}</span>
          <span>{step.label}</span>
        </button>
        {index < steps.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-3 shrink-0 bg-zinc-200 sm:mx-2 sm:w-6" />}
      </div>)}
    </div>
    {steps.map((step, index) => <div key={step.label} role="tabpanel" id={`${id}-panel-${index}`}
      aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index} tabIndex={0}
      className="mt-6 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
      {step.content}
    </div>)}
  </div>;
}
