"use client";

import Link from "next/link";
import { useState, useTransition, type DragEvent } from "react";
import { ProgressBar } from "@/app/progress-bar";
import { saveDashboardLayout } from "@/app/dashboard-actions";
import { DashboardSaleDialog } from "@/app/dashboard-sale-dialog";

export type ProductGoalCard = {
  id: string;
  name: string;
  target_count: number | null;
  target_amount: string | null;
  mtd_count: number;
  ytd_count: number;
  mtd_in_force: number;
  ytd_in_force: number;
  mtd_premium: string;
  ytd_premium: string;
  mtd_amount: string;
  active: boolean;
};

type ProductGoalsSectionProps = {
  products: ProductGoalCard[];
  editGoalsHref?: string;
  customizable: boolean;
  savedLayout?: { product_order: string[]; hidden_product_ids: string[] } | null;
  isManager: boolean;
  agents: { id: string; name: string }[];
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

function ProductSummaryDialog({ product }: { product: ProductGoalCard }) {
  const [open, setOpen] = useState(false);
  const hasGoal = product.target_count !== null;
  const remaining = product.target_count === null ? null : Math.max(product.target_count - product.mtd_count, 0);
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={`View ${product.name} summary`} title={`View ${product.name} summary`} className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg></button>
    {open && <div className="fixed inset-0 z-40 overflow-y-auto bg-zinc-950/30 p-4 sm:p-6" onClick={() => setOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby={`product-summary-${product.id}`} onClick={event => event.stopPropagation()} className="mx-auto my-4 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl sm:my-10"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-emerald-700">Product summary</p><h3 id={`product-summary-${product.id}`} className="mt-1 text-xl font-semibold">{product.name}</h3><p className="mt-1 text-sm text-zinc-600">Current month performance.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close product summary" title="Close" className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">×</button></div><dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-emerald-50 p-3"><dt className="text-emerald-800">MTD sales</dt><dd className="mt-1 text-xl font-semibold text-emerald-950">{product.mtd_count}{hasGoal ? ` / ${product.target_count}` : ""}</dd></div><div className="rounded-lg bg-zinc-100 p-3"><dt className="text-zinc-600">{hasGoal ? "Remaining" : "YTD sales"}</dt><dd className="mt-1 text-xl font-semibold text-zinc-900">{hasGoal ? remaining : product.ytd_count}</dd></div><div className="rounded-lg border border-zinc-200 p-3"><dt className="text-zinc-600">YTD sales</dt><dd className="mt-1 text-lg font-semibold text-zinc-900">{product.ytd_count}</dd></div><div className="rounded-lg border border-zinc-200 p-3"><dt className="text-zinc-600">MTD premium</dt><dd className="mt-1 text-lg font-semibold text-zinc-900">{money(product.mtd_premium)}</dd></div>{product.target_amount !== null && <><div className="rounded-lg border border-zinc-200 p-3"><dt className="text-zinc-600">MTD amount</dt><dd className="mt-1 text-lg font-semibold text-zinc-900">{money(product.mtd_amount)}</dd></div><div className="rounded-lg border border-zinc-200 p-3"><dt className="text-zinc-600">Amount target</dt><dd className="mt-1 text-lg font-semibold text-zinc-900">{money(product.target_amount)}</dd></div></>}</dl><div className="mt-5 flex justify-end"><button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Close</button></div></div></div>}
  </>;
}
export function ProductGoalsSection({ products, editGoalsHref, customizable, savedLayout, isManager, agents }: ProductGoalsSectionProps) {
  const defaultOrder = products.map(product => product.id);
  const savedOrder = [...new Set((savedLayout?.product_order ?? []).filter(id => defaultOrder.includes(id)))];
  const initialOrder = [...savedOrder, ...defaultOrder.filter(id => !savedOrder.includes(id))];
  const hiddenIds = new Set((savedLayout?.hidden_product_ids ?? []).filter(id => defaultOrder.includes(id)));
  const initialVisible = new Set(initialOrder.filter(id => !hiddenIds.has(id)));
  const [appliedOrder, setAppliedOrder] = useState(initialOrder);
  const [appliedVisible, setAppliedVisible] = useState(initialVisible);
  const [draftOrder, setDraftOrder] = useState(initialOrder);
  const [draftVisible, setDraftVisible] = useState(initialVisible);
  const [open, setOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
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
    const nextOrder = [...draftOrder];
    const nextVisible = new Set(draftVisible);
    setAppliedOrder(nextOrder);
    setAppliedVisible(nextVisible);
    setOpen(false);
    setSaveError(null);
    startSaving(async () => {
      const result = await saveDashboardLayout({ productOrder: nextOrder, hiddenProductIds: defaultOrder.filter(id => !nextVisible.has(id)) });
      if (!result.ok) setSaveError(result.message);
    });
  }

  return <section>
    <div className="mb-2 flex items-end justify-between gap-3"><div><h2 className="text-base font-semibold">Product goals</h2><p className="text-xs text-zinc-600">Monthly progress by product.</p></div><div className="flex shrink-0 items-center gap-3">{editGoalsHref && <Link className="text-sm font-medium text-emerald-700 hover:underline" href={editGoalsHref}>Edit goals</Link>}</div></div>
    {saveError ? <p role="alert" className="mb-2 text-sm text-rose-700">{saveError}</p> : isSaving ? <p role="status" className="mb-2 text-sm text-zinc-600">Saving dashboard layout...</p> : null}
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{visibleProducts.map(product => <article key={product.id} className="rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm"><div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><ProductIcon product={product.name} /><h3 className="truncate font-semibold">{product.name}</h3></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${product.target_count === null ? "bg-amber-50 text-amber-900" : product.mtd_count >= product.target_count ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700"}`}>{product.target_count === null ? "No goal" : product.mtd_count >= product.target_count ? "Goal reached" : `${Math.max(product.target_count - product.mtd_count, 0)} remaining`}</span></div>
      {product.target_count === null ? <p className="mt-2 text-lg font-semibold tabular-nums">{product.mtd_count} <span className="text-sm font-medium text-zinc-500">sales this month</span></p> : <ProgressBar current={product.mtd_count} target={product.target_count} label={`${product.name} monthly goal progress`} compact />}{product.target_amount !== null && <p className="mt-1 text-xs text-zinc-500">Amount: {money(product.mtd_amount)} / {money(product.target_amount)}{Number(product.target_amount) > 0 ? ` · ${Math.round(Number(product.mtd_amount) / Number(product.target_amount) * 100)}%` : ""}</p>}<div className="mt-2 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2 text-xs text-zinc-600"><span className="whitespace-nowrap">In force: <strong className="font-semibold text-zinc-800">{product.mtd_in_force}</strong></span><span className="whitespace-nowrap">Premium: <strong className="font-semibold text-zinc-800">{money(product.mtd_premium)}</strong></span></div><div className="flex shrink-0 items-center gap-1"><ProductSummaryDialog product={product} />{product.active && (!isManager || agents.length > 0) && <DashboardSaleDialog product={product} isManager={isManager} agents={agents} compact />}</div></div>
    </article>)}</div>
    {customizable && <button type="button" onClick={openCustomizer} className="fixed bottom-5 right-5 z-20 inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white shadow-lg hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"><span aria-hidden="true">☷</span>Customize dashboard</button>}
    {open && <div className="fixed inset-0 z-30 bg-zinc-950/20" onClick={() => setOpen(false)}><aside role="dialog" aria-modal="true" aria-label="Customize dashboard" onClick={event => event.stopPropagation()} className="ml-auto flex h-dvh w-full max-w-sm flex-col border-l border-zinc-200 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-zinc-200 p-5"><div><h2 className="text-lg font-semibold">Customize dashboard</h2><p className="mt-1 text-sm text-zinc-600">Drag products to reorder. Uncheck products to hide them.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close customization" className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">×</button></div>
      <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">{draftOrder.map((id, index) => { const product = productsById.get(id); if (!product) return null; return <li key={id} draggable onDragStart={() => setDraggedId(id)} onDragEnd={() => setDraggedId(null)} onDragOver={event => event.preventDefault()} onDrop={event => dropOn(event, id)} className={`flex items-center gap-2 rounded-lg border p-2 ${draggedId === id ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 bg-white"}`}><span aria-hidden="true" className="cursor-grab px-1 text-zinc-400">⠿</span><label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium"><input type="checkbox" checked={draftVisible.has(id)} onChange={() => setDraftVisible(visible => { const next = new Set(visible); if (next.has(id)) next.delete(id); else next.add(id); return next; })} /> <span className="truncate">{product.name}</span></label><div className="flex"><button type="button" onClick={() => move(id, -1)} disabled={index === 0} aria-label={`Move ${product.name} up`} className="size-8 rounded hover:bg-zinc-100 disabled:opacity-30">↑</button><button type="button" onClick={() => move(id, 1)} disabled={index === draftOrder.length - 1} aria-label={`Move ${product.name} down`} className="size-8 rounded hover:bg-zinc-100 disabled:opacity-30">↓</button></div></li>; })}</ol>
      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 p-4"><button type="button" onClick={reset} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Reset to default</button><div className="flex gap-2"><button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Cancel</button><button type="button" onClick={apply} className="min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Apply</button></div></div>
    </aside></div>}
  </section>;
}