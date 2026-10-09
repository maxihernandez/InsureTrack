"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const minYear = 2020;
const maxYear = 2100;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseValue(value: string) {
  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  return { year: Number.isInteger(year) && year >= minYear && year <= maxYear ? year : new Date().getFullYear(), month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : new Date().getMonth() + 1 };
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function CalendarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></svg>;
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d={direction === "left" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} /></svg>;
}

export function MonthPicker({ value, label = "Month" }: { value: string; label?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = parseValue(value);
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState(() => ({ forValue: value, year: selected.year }));
  const displayYear = display.forValue === value ? display.year : selected.year;
  const container = useRef<HTMLDivElement>(null);
useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOnOutsideClick); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

  function changeYear(direction: -1 | 1) {
    setDisplay(current => { const year = current.forValue === value ? current.year : selected.year; return { forValue: value, year: Math.min(maxYear, Math.max(minYear, year + direction)) }; });
  }

  function selectMonth(year: number, month: number) {
    const nextValue = `${year}-${String(month).padStart(2, "0")}`;
    setOpen(false);
    if (nextValue === value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", nextValue);
    params.delete("saved");
    params.delete("error");
    router.replace(`${pathname}?${params.toString()}`);
  }

  const labelText = monthLabel(selected.year, selected.month);
  return <div ref={container} className="relative text-sm font-medium">
    <span className="mb-1 block">{label}</span>
    <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(isOpen => !isOpen)} className="flex min-h-10 min-w-44 items-center justify-between gap-3 rounded-lg border border-zinc-300 bg-white px-3 text-left font-semibold text-zinc-900 shadow-sm transition-colors hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><span>{labelText}</span><CalendarIcon /></button>
    {open && <div role="dialog" aria-label={`Select ${label.toLowerCase()}`} className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl">
      <div className="mb-3 flex items-center justify-between"><button type="button" onClick={() => changeYear(-1)} disabled={displayYear === minYear} aria-label="Previous year" title="Previous year" className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"><ArrowIcon direction="left" /></button><span className="font-semibold text-zinc-900">{displayYear}</span><button type="button" onClick={() => changeYear(1)} disabled={displayYear === maxYear} aria-label="Next year" title="Next year" className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"><ArrowIcon direction="right" /></button></div>
      <div className="grid grid-cols-3 gap-1" role="group" aria-label={`Months in ${displayYear}`}>{months.map((month, index) => { const number = index + 1; const active = displayYear === selected.year && number === selected.month; return <button key={month} type="button" onClick={() => selectMonth(displayYear, number)} aria-pressed={active} className={`min-h-10 rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${active ? "bg-emerald-700 text-white" : "text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900"}`}>{month}</button>; })}</div>
      <button type="button" onClick={() => { const today = new Date(); selectMonth(today.getFullYear(), today.getMonth() + 1); }} className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">This month</button>
    </div>}
  </div>;
}