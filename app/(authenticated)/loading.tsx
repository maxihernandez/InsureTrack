export default function Loading() {
  return <section aria-busy="true" aria-label="Loading page" className="flex min-h-[min(50vh,28rem)] items-center justify-center">
    <div role="status" className="flex flex-col items-center gap-3 text-sm font-medium text-zinc-600">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="size-9 animate-spin text-emerald-700 motion-reduce:animate-none"><path d="M12 3a9 9 0 1 1-6.4 2.6" /></svg>
      <span>Loading…</span>
    </div>
  </section>;
}