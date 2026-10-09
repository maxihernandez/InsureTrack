"use client";

import Link from "next/link";
import { useState, type DragEvent } from "react";
import { ProgressBar } from "@/app/progress-bar";

export type ProductGoalCard = {
  id: string;
  name: string;
  target_count: number | null;
  target_amount: string | null;
  mtd_count: number;
  ytd_count: number;
  mtd_premium: string;
  ytd_premium: string;
  mtd_amount: string;
};

type ProductGoalsSectionProps = {
  products: ProductGoalCard[];
  editGoalsHref?: string;
  customizable: boolean;
};

const money = (value: string | number) => `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ProductIcon({ product }: { product: string }) {
  const name = product.trim().toLowerCase();
  let graphic = <><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M7 7V5h10v2m-7 4h4m-6 4h8" /></>;
  if (name === "auto" || name === "pap") graphic = <><path d="M5 15h14l-1.5-5H6.5L5 15Z" /><path d="M7 15v2m10-2v2M8 10l1.5-3h5L16 10" /><circle cx="8" cy="17" r="1" /><circle cx="16" cy="17" r="1" /></>;
  else if (name === "fire") graphic = <path d="M12 21c4 0 6-2.7 6-6.1 0-3.1-1.8-5.2-4.1-7.7.1 2.2-1.2 3.6-2.8 4.5.2-2.6-1.1-4.5-2.9-6.7C7.9 8.2 6 10.5 6 14.2 6 18 8.4 21 12 21Z" />;
  else if (name === "bank") graphic = <><path d="m3 9 9-5 9 5" /><path d="M5 10h14M5 20h14M7 10v10m5-10v10m5-10v10" /></>;
  else if (name === "life") graphic = <path d="M20 8.8C20 5.6 16.4 4 12 8.1 7.6 4 4 5.6 4 8.8c0 4.7 4.7 7.3 8 10.2 3.3-2.9 8-5.5 8-10.2Z" />;
  else if (name === "health") graphic = <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4Z" />;
  else if (name === "boat") graphic = <><path d="m4 14 4 4h8l4-4H4Z" /><path d="m9 14 1-6h4l1 6M3 20c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0" /></>;
  else if (name === "flood") graphic = <><path d="M4 7h16v6H4z" /><path d="M3 16c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0M3 20c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0" /></>;
  else if (name === "pup") graphic = <><path d="M12 3 19 6v5c0 4.4-2.8 7.7-7 10-4.2-2.3-7-5.6-7-10V6l7-3Z" /><path d="M9 12h6m-3-3v6" /></>;
  else if (name === "renter" || name === "ho3") graphic = <><path d="m4 11 8-7 8 7v9H4v-9Z" /><path d="M9 20v-5h6v5M9 11h6" /></>;
  else if (name === "cpic") graphic = <><path d="M5 20V6h14v14M3 20h18M9 10h2m2 0h2m-6 4h2m2 0h2" /></>;
  return <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">{graphic}</svg></span>;
}

export function ProductGoalsSection({ products, editGoalsHref, customizable }: ProductGoalsSectionProps) {
  const defaultOrder = products.map(product => product.id);
  const [appliedOrder, setAppliedOrder] = useState(defaultOrder);
  const [appliedVisible, setAppliedVisible] = useState(new Set(defaultOrder));
  const [draftOrder, setDraftOrder] = useState(defaultOrder);
  const [draftVisible, setDraftVisible] = useState(new Set(defaultOrder));
  const [open, setOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const productsById = new Map(products.map(product => [product.id, product]));
  const visibleProducts = appliedOrder.flatMap(id => {
    const product = productsById.get(id);
    return product && appliedVisible.has(id) ? [product] : [];
  });

  function openCustomizer() {
    setDraftOrder(appliedOrder);
    setDraftVisible(new Set(appliedVisible));
    setOpen(true);
  }

  function move(id: string, direction: -1 | 1) {
    setDraftOrder(order => {
      const index = order.indexOf(id);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= order.length) return order;
      const next = [...order];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function dropOn(event: DragEvent<HTMLLIElement>, destinationId: string) {
    event.preventDefault();
    if (!draggedId || draggedId === destinationId) return;
    setDraftOrder(order => {
      const next = order.filter(id => id !== draggedId);
      next.splice(next.indexOf(destinationId), 0, draggedId);
      return next;
    });
    setDraggedId(null);
  }

  function reset() {
    setDraftOrder(defaultOrder);
    setDraftVisible(new Set(defaultOrder));
  }

  function apply() {
    setAppliedOrder(draftOrder);
    setAppliedVisible(new Set(draftVisible));
    setOpen(false);
  }

  return <section>
    <div className="mb-2 flex items-end justify-between gap-3"><div><h2 className="text-base font-semibold">Product goals</h2><p className="text-xs text-zinc-600">Monthly progress by product.</p></div><div className="flex shrink-0 items-center gap-3">{editGoalsHref && <Link className="text-sm font-medium text-emerald-700 hover:underline" href={editGoalsHref}>Edit goals</Link>}</div></div>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{visibleProducts.map(product => <article key={product.id} className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-3"><ProductIcon product={product.name} /><h3 className="truncate font-semibold">{product.name}</h3></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${product.target_count === null ? "bg-amber-50 text-amber-900" : product.mtd_count >= product.target_count ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700"}`}>{product.target_count === null ? "No goal" : product.mtd_count >= product.target_count ? "Goal reached" : `${Math.max(product.target_count - product.mtd_count, 0)} remaining`}</span></div>
      {product.target_count === null ? <p className="mt-3 text-lg font-semibold tabular-nums">{product.mtd_count} <span className="text-sm font-medium text-zinc-500">sales this month</span></p> : <ProgressBar current={product.mtd_count} target={product.target_count} label={`${product.name} monthly goal progress`} />}
      <p className="mt-1 text-xs text-zinc-500">YTD: {product.ytd_count}</p><p className="mt-1 text-sm text-zinc-600">Premium MTD: {money(product.mtd_premium)}</p>{product.target_amount !== null && <p className="text-xs text-zinc-500">Amount: {money(product.mtd_amount)} / {money(product.target_amount)}{Number(product.target_amount) > 0 ? ` · ${Math.round(Number(product.mtd_amount) / Number(product.target_amount) * 100)}%` : ""}</p>}
    </article>)}</div>
    {customizable && <button type="button" onClick={openCustomizer} className="fixed bottom-5 right-5 z-20 inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white shadow-lg hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"><span aria-hidden="true">☷</span>Customize dashboard</button>}
    {open && <div className="fixed inset-0 z-30 bg-zinc-950/20" onClick={() => setOpen(false)}><aside role="dialog" aria-modal="true" aria-label="Customize dashboard" onClick={event => event.stopPropagation()} className="ml-auto flex h-dvh w-full max-w-sm flex-col border-l border-zinc-200 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-zinc-200 p-5"><div><h2 className="text-lg font-semibold">Customize dashboard</h2><p className="mt-1 text-sm text-zinc-600">Drag products to reorder. Uncheck products to hide them.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close customization" className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">×</button></div>
      <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">{draftOrder.map((id, index) => { const product = productsById.get(id); if (!product) return null; return <li key={id} draggable onDragStart={() => setDraggedId(id)} onDragEnd={() => setDraggedId(null)} onDragOver={event => event.preventDefault()} onDrop={event => dropOn(event, id)} className={`flex items-center gap-2 rounded-lg border p-2 ${draggedId === id ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 bg-white"}`}><span aria-hidden="true" className="cursor-grab px-1 text-zinc-400">⠿</span><label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium"><input type="checkbox" checked={draftVisible.has(id)} onChange={() => setDraftVisible(visible => { const next = new Set(visible); if (next.has(id)) next.delete(id); else next.add(id); return next; })} /> <span className="truncate">{product.name}</span></label><div className="flex"><button type="button" onClick={() => move(id, -1)} disabled={index === 0} aria-label={`Move ${product.name} up`} className="size-8 rounded hover:bg-zinc-100 disabled:opacity-30">↑</button><button type="button" onClick={() => move(id, 1)} disabled={index === draftOrder.length - 1} aria-label={`Move ${product.name} down`} className="size-8 rounded hover:bg-zinc-100 disabled:opacity-30">↓</button></div></li>; })}</ol>
      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 p-4"><button type="button" onClick={reset} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Reset to default</button><div className="flex gap-2"><button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Cancel</button><button type="button" onClick={apply} className="min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Apply</button></div></div>
    </aside></div>}
  </section>;
}