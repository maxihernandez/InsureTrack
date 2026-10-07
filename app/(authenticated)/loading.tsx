export default function Loading() {
  return <section aria-busy="true" aria-label="Loading page">
    <p role="status" className="mb-5 text-sm text-zinc-600">Loading…</p>
    <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
      <div className="mb-6 h-8 w-48 rounded bg-zinc-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(key => <div key={key} className="h-24 rounded-xl border border-zinc-200 bg-white" />)}
      </div>
      <div className="mt-6 h-64 rounded-xl border border-zinc-200 bg-white" />
    </div>
  </section>;
}
