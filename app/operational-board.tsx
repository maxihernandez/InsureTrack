"use client";

import { useState } from "react";
import type { BoardPin, BoardProduct } from "@/lib/operational-board/repository";
import { pinColorValue } from "@/lib/pin-colors";

export function initials(firstName: string, lastName: string) {
  return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() || "?";
}

function statusLabel(status: BoardPin["policy_status"]) {
  return { recorded: "Recorded", issued: "Issued", in_force: "Active", not_issued: "Not issued", cancelled: "Cancelled", legacy: "Legacy" }[status];
}

function slotsFor(product: BoardProduct, pinCount: number) {
  const target = product.target_count ?? 0;
  return Math.min(Math.max(target, pinCount, 10), 30);
}

function BoardPinButton({ pin, onSelect }: { pin: BoardPin; onSelect: (pin: BoardPin) => void }) {
  const name = `${pin.first_name} ${pin.last_name}`;
  const active = pin.policy_status === "in_force";
  return <button type="button" onClick={() => onSelect(pin)} title={`${name} · ${statusLabel(pin.policy_status)}`} aria-label={`View ${name}'s ${pin.policy_number ?? "policy"}, ${statusLabel(pin.policy_status)}`}
    className={`relative flex size-9 items-center justify-center rounded-full border-2 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${active ? "border-zinc-950" : "border-white"}`}
    style={{ backgroundColor: pinColorValue(pin.pin_color) }}>
    {initials(pin.first_name, pin.last_name)}
    <span aria-hidden="true" className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full ${active ? "bg-emerald-500" : pin.policy_status === "cancelled" || pin.policy_status === "not_issued" ? "bg-rose-500" : "bg-amber-400"}`} />
  </button>;
}

export function OperationalBoard({ products, pins, periodLabel, isManager }: { products: BoardProduct[]; pins: BoardPin[]; periodLabel: string; isManager: boolean }) {
  const [selectedPin, setSelectedPin] = useState<BoardPin | null>(null);
  const pinsByProduct = new Map(products.map(product => [product.id, pins.filter(pin => pin.product_id === product.id)]));
  const displayedProducts = products.filter(product => product.target_count !== null || product.mtd_count > 0);
  const agents = [...new Map(pins.map(pin => [pin.agent_id, pin])).values()];
  const activePins = pins.filter(pin => pin.policy_status === "in_force").length;

  return <>
    <section aria-label="Operational board" className="overflow-hidden rounded-2xl border-2 border-zinc-900 bg-white shadow-sm">
      <header className="grid gap-3 border-b-2 border-zinc-900 p-4 sm:grid-cols-[minmax(11rem,1fr)_auto] sm:items-center sm:p-5">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Operational board</p><h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">{periodLabel}</h1><p className="mt-1 text-sm text-zinc-600">Pins are existing policies. Initials identify the assigned agent.</p></div>
        <dl className="grid grid-cols-3 divide-x divide-zinc-200 rounded-xl border border-zinc-200 bg-zinc-50 text-center"><div className="px-3 py-2"><dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Recorded</dt><dd className="text-xl font-black tabular-nums">{pins.length}</dd></div><div className="px-3 py-2"><dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Active</dt><dd className="text-xl font-black tabular-nums">{activePins}</dd></div><div className="px-3 py-2"><dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">View</dt><dd className="text-sm font-bold">{isManager ? "Team" : "Mine"}</dd></div></dl>
      </header>
      <div className="divide-y-2 divide-zinc-900">
        {displayedProducts.map(product => {
          const productPins = pinsByProduct.get(product.id) ?? [];
          const slots = slotsFor(product, productPins.length);
          const visiblePins = productPins.slice(0, slots);
          const overflow = productPins.length - visiblePins.length;
          return <section key={product.id} className="grid gap-3 p-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:p-5">
            <div className="flex items-baseline justify-between gap-3 sm:block"><div><p className="text-lg font-black tracking-tight text-zinc-950">{product.name}</p><p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{product.code}</p></div><p className="text-sm font-semibold tabular-nums text-zinc-700 sm:mt-2">{isManager ? `${product.mtd_count} / ${product.target_count ?? "—"}` : `${product.mtd_count} mine · ${product.target_count ?? "—"} team target`}</p><p className="hidden text-xs text-zinc-500 sm:block">YTD {product.ytd_count}</p></div>
            <div className="min-w-0"><div className="grid grid-cols-5 gap-2 border-y border-zinc-300 py-3 sm:grid-cols-10">{Array.from({ length: slots }, (_, index) => <div key={index} className="flex min-h-10 items-center justify-center border-r border-zinc-200 last:border-r-0">{visiblePins[index] ? <BoardPinButton pin={visiblePins[index]} onSelect={setSelectedPin} /> : <span aria-hidden="true" className="size-2 rounded-full bg-zinc-200" />}</div>)}</div>{overflow > 0 && <p className="mt-2 text-xs font-medium text-zinc-600">+{overflow} additional policies are included in the monthly total.</p>}</div>
          </section>;
        })}
        {!displayedProducts.length && <p className="p-8 text-center text-sm text-zinc-600">No goals or recorded policies for this month.</p>}
      </div>
      <footer className="border-t-2 border-zinc-900 bg-zinc-50 p-4"><p className="text-xs text-zinc-600">Status marker: <span className="font-semibold text-emerald-800">green</span> active · <span className="font-semibold text-amber-700">amber</span> recorded or issued · <span className="font-semibold text-rose-700">red</span> cancelled or not issued.</p><div className="mt-3 flex flex-wrap gap-2">{agents.map(agent => <span key={agent.agent_id} className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700"><span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: pinColorValue(agent.pin_color) }}>{initials(agent.first_name, agent.last_name)}</span>{agent.first_name} {agent.last_name}</span>)}</div></footer>
    </section>
    {selectedPin && <div className="fixed inset-0 z-40 grid place-items-center bg-zinc-950/30 p-4" onClick={() => setSelectedPin(null)}><section role="dialog" aria-modal="true" aria-labelledby="board-pin-title" onClick={event => event.stopPropagation()} className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-emerald-700">Policy pin</p><h2 id="board-pin-title" className="text-xl font-semibold">{selectedPin.first_name} {selectedPin.last_name}</h2></div><button type="button" onClick={() => setSelectedPin(null)} aria-label="Close policy detail" className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100">×</button></div><dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-zinc-500">Policy</dt><dd className="font-semibold">{selectedPin.policy_number ?? "No policy number"}</dd></div><div><dt className="text-zinc-500">Status</dt><dd className="font-semibold">{statusLabel(selectedPin.policy_status)}</dd></div><div><dt className="text-zinc-500">Recorded</dt><dd className="font-semibold">{selectedPin.sale_date}</dd></div><div><dt className="text-zinc-500">Agent color</dt><dd className="font-semibold">{initials(selectedPin.first_name, selectedPin.last_name)}</dd></div></dl></section></div>}
  </>;
}
