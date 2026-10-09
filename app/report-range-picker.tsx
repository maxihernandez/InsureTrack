"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ranges = [3, 6, 12] as const;

export function ReportRangePicker({ value }: { value: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function selectRange(months: number) {
    if (months === value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("period");
    params.set("range", String(months));
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return <div className="text-sm font-medium"><div className="mb-1 flex h-5 items-center gap-2"><span>Range</span>{isPending && <><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="size-4 animate-spin text-emerald-700 motion-reduce:animate-none"><path d="M12 3a9 9 0 1 1-6.4 2.6" /></svg><span className="sr-only" aria-live="polite">Loading report</span></>}</div><div role="group" aria-label="Report range" aria-busy={isPending} className="flex rounded-lg border border-zinc-300 bg-white p-1 shadow-sm">{ranges.map(months => <button key={months} type="button" onClick={() => selectRange(months)} disabled={isPending} aria-pressed={value === months} className={`min-h-8 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60 ${value === months ? "bg-emerald-700 text-white" : "text-zinc-600 hover:bg-emerald-50 hover:text-emerald-900"}`}>{months}M</button>)}</div></div>;
}