"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, danger = false, disabled = false }: { children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled}
    className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60 ${danger ? "bg-red-700 hover:bg-red-800" : "bg-emerald-800 hover:bg-emerald-900"}`}>
    {pending ? "Saving…" : children}
  </button>;
}
