"use client";

import { useFormStatus } from "react-dom";

export function SaveSaleButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={disabled || pending} aria-disabled={disabled || pending} className="w-full rounded-lg bg-emerald-800 px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
    {pending ? "Saving policy…" : "Save policy"}
  </button>;
}
