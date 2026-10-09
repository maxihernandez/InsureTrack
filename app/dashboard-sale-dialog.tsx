"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addSaleFromDashboard } from "@/app/(authenticated)/production/actions";

type Agent = { id: string; name: string };
type Product = { id: string; name: string };

export function DashboardSaleDialog({ product, isManager, agents, compact = false }: { product: Product; isManager: boolean; agents: Agent[]; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await addSaleFromDashboard(new FormData(event.currentTarget));
    setPending(false);
    if (!result.ok) { setError(result.message); return; }
    setOpen(false);
    router.refresh();
  }

  return <>
    <button type="button" onClick={() => { setError(null); setOpen(true); }} aria-label={`Add ${product.name} sale`} title={`Add ${product.name} sale`} className={`${compact ? "" : "mt-3 "}inline-flex size-9 items-center justify-center rounded-lg bg-emerald-800 text-lg font-semibold leading-none text-white shadow-sm hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800`}><span aria-hidden="true">+</span></button>
    {open && <div className="fixed inset-0 z-40 overflow-y-auto bg-zinc-950/30 p-4 sm:p-6" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="quick-sale-title" onClick={event => event.stopPropagation()} className="mx-auto my-4 w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl sm:my-10">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-emerald-700">Quick sale</p><h2 id="quick-sale-title" className="text-xl font-semibold">{product.name}</h2><p className="mt-1 text-sm text-zinc-600">Record a sale without leaving the Dashboard.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close quick sale" className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">x</button></div>
        <form onSubmit={submit} className="mt-5 space-y-4"><input type="hidden" name="product_id" value={product.id} />
          {isManager && <label className="block text-sm font-medium">Agent<select name="agent_id" required defaultValue="" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"><option value="" disabled>Select agent</option>{agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>}
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"><span className="font-semibold">Product:</span> {product.name}</div>
          <label className="block text-sm font-medium">Sale date<input name="sale_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2" /></label>
          <fieldset className="grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-2"><legend className="px-0 text-sm font-semibold">Optional financial details</legend><label className="block text-sm font-medium">Premium<input name="premium" type="number" min="0" step="0.01" placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label><label className="block text-sm font-medium">Amount<input name="amount" type="number" min="0" step="0.01" placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label></fieldset>
          <label className="block text-sm font-medium">Notes<textarea name="notes" maxLength={2000} rows={3} placeholder="Optional" className="mt-1 w-full resize-y rounded-lg border border-zinc-300 px-3 py-2" /></label>
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} disabled={pending} className="min-h-10 rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50">Cancel</button><button disabled={pending} className="min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">{pending ? "Saving sale..." : "Save sale"}</button></div>
        </form>
      </div>
    </div>}
  </>;
}
