"use client";

import { useFormStatus } from "react-dom";

type GoalSaveButtonProps = {
  configured: boolean;
  label: string;
};

export function GoalSaveButton({ configured, label }: GoalSaveButtonProps) {
  const { pending } = useFormStatus();
  const actionClass = configured
    ? "text-green-700 hover:bg-green-50 focus-visible:outline-green-700"
    : "text-blue-700 hover:bg-blue-50 focus-visible:outline-blue-700";

  return <button type="submit" disabled={pending} aria-disabled={pending} aria-label={pending ? `Saving ${label}` : `${configured ? "Save" : "Set"} ${label}`} title={pending ? "Saving…" : `${configured ? "Save" : "Set"} ${label}`} className={`inline-flex size-10 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60 ${actionClass}`}>
    {pending ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : configured ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M5 4h12l2 2v14H5V4Z" /><path d="M8 4v6h7V4m-7 16v-6h8v6" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></svg>}
  </button>;
}
