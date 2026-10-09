"use client";

import { useId, useRef, useState, type ReactNode } from "react";

type Section = { label: string; content: ReactNode; icon: "trends" | "distribution" | "breakdown" };

function SectionIcon({ icon }: { icon: Section["icon"] }) {
  const graphic = icon === "trends" ? <><path d="m4 16 6-6 4 4 6-7" /><path d="M15 7h5v5" /></>
    : icon === "distribution" ? <><path d="M12 3v9h9" /><path d="M20.5 15A8.5 8.5 0 1 1 9 3.5" /></>
      : <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">{graphic}</svg>;
}

export function ReportSections({ trends, distribution, breakdown }: { trends: ReactNode; distribution: ReactNode; breakdown: ReactNode }) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const sections: Section[] = [
    { label: "Trends", icon: "trends", content: trends },
    { label: "Distribution", icon: "distribution", content: distribution },
    { label: "Monthly breakdown", icon: "breakdown", content: breakdown },
  ];

  function select(index: number) {
    setSelected(index);
    buttons.current[index]?.focus();
  }

  return <div className="mt-5">
    <div role="tablist" aria-label="Report sections" className="flex items-center rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm sm:p-2">
      {sections.map((section, index) => <div key={section.label} role="presentation" className="flex min-w-0 flex-1 items-center">
        <button type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1}
          ref={element => { buttons.current[index] = element; }} onClick={() => setSelected(index)}
          onKeyDown={event => {
            const next = event.key === "ArrowRight" ? (index + 1) % sections.length : event.key === "ArrowLeft" ? (index + sections.length - 1) % sections.length : event.key === "Home" ? 0 : event.key === "End" ? sections.length - 1 : null;
            if (next !== null) { event.preventDefault(); select(next); }
          }}
          className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm ${selected === index ? "bg-emerald-50 text-emerald-900" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"}`}>
          <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${selected === index ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-300 bg-white"}`}><SectionIcon icon={section.icon} /></span><span className="truncate">{section.label}</span>
        </button>
        {index < sections.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-3 shrink-0 bg-zinc-200 sm:mx-2 sm:w-6" />}
      </div>)}
    </div>
    {sections.map((section, index) => <div key={section.label} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index} tabIndex={0} className="mt-5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">{section.content}</div>)}
  </div>;
}