"use client";

import { useEffect, useState, type DragEvent, type FormEvent } from "react";

type Color = "yellow" | "mint" | "blue" | "lavender" | "coral";
type Note = { id: string; title: string; body: string; color: Color; updatedAt: string };

const colors: { value: Color; label: string; tone: string }[] = [
  { value: "yellow", label: "Yellow", tone: "border-amber-200 bg-amber-50" },
  { value: "mint", label: "Mint", tone: "border-emerald-200 bg-emerald-50" },
  { value: "blue", label: "Blue", tone: "border-sky-200 bg-sky-50" },
  { value: "lavender", label: "Lavender", tone: "border-violet-200 bg-violet-50" },
  { value: "coral", label: "Coral", tone: "border-rose-200 bg-rose-50" },
];

function validNote(value: unknown): value is Note {
  const note = value as Partial<Note> | null;
  return Boolean(note && typeof note.id === "string" && typeof note.title === "string" && typeof note.body === "string" && typeof note.updatedAt === "string" && colors.some(color => color.value === note.color));
}

function NotesIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M6 3h10l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v4h4M8 12h8M8 16h6" /></svg>;
}

export function DashboardNotes({ userId }: { userId: string }) {
  const storageKey = `policyboard:dashboard-notes:${userId}`;
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState<Color>("yellow");
  const [dragged, setDragged] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try { const stored: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]"); if (Array.isArray(stored)) setNotes(stored.filter(validNote).slice(0, 8)); }
      catch { /* Browser storage is optional for this MVP. */ }
      finally { setLoaded(true); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [storageKey]);

  function save(next: Note[]) {
    setNotes(next);
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep notes for this session. */ }
  }

  function newNote() { setEditing(null); setTitle(""); setBody(""); setColor("yellow"); setEditorOpen(true); }
  function edit(note: Note) { setEditing(note.id); setTitle(note.title); setBody(note.body); setColor(note.color); setEditorOpen(true); }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const noteTitle = title.trim(), noteBody = body.trim();
    if (!noteTitle || !noteBody) return;
    const updatedAt = new Date().toISOString();
    if (editing) save(notes.map(note => note.id === editing ? { ...note, title: noteTitle, body: noteBody, color, updatedAt } : note));
    else save([{ id: crypto.randomUUID(), title: noteTitle, body: noteBody, color, updatedAt }, ...notes].slice(0, 8));
    setEditorOpen(false); setPanelOpen(true);
  }

  function dropOn(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    const moving = notes.find(note => note.id === dragged);
    if (!moving || moving.id === targetId) return;
    const next = notes.filter(note => note.id !== moving.id);
    next.splice(next.findIndex(note => note.id === targetId), 0, moving);
    save(next); setDragged(null);
  }

  return <>
    <button type="button" onClick={() => setPanelOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><NotesIcon />Notes{loaded && notes.length > 0 && <span aria-label={`${notes.length} notes`} className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-900">{notes.length}</span>}</button>
    {panelOpen && <div className="fixed inset-0 z-30 bg-zinc-950/20" onClick={() => setPanelOpen(false)}><aside role="dialog" aria-modal="true" aria-labelledby="notes-title" onClick={event => event.stopPropagation()} className="ml-auto flex h-dvh w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-zinc-200 p-5"><div><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><NotesIcon /></span><h2 id="notes-title" className="text-lg font-semibold">Notes</h2></div><p className="mt-1 text-sm text-zinc-600">Personal notes saved in this browser.</p></div><button type="button" onClick={() => setPanelOpen(false)} aria-label="Close notes" className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">×</button></div><div className="min-h-0 flex-1 overflow-y-auto p-4">{notes.length ? <div className="space-y-3">{notes.map(note => <article key={note.id} draggable onDragStart={() => setDragged(note.id)} onDragEnd={() => setDragged(null)} onDragOver={event => event.preventDefault()} onDrop={event => dropOn(event, note.id)} className={`group relative min-h-32 rounded-xl border p-3 shadow-sm transition-shadow hover:shadow-md ${colors.find(item => item.value === note.color)?.tone} ${dragged === note.id ? "opacity-50" : ""}`}><span aria-label="Drag to reorder" title="Drag to reorder" className="absolute right-3 top-3 inline-flex size-7 cursor-grab items-center justify-center rounded-md text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg></span><h3 className="pr-10 text-sm font-semibold text-zinc-900">{note.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-zinc-700">{note.body}</p><div className="mt-4 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"><button type="button" onClick={() => edit(note)} aria-label={`Edit ${note.title}`} title="Edit note" className="inline-flex size-8 items-center justify-center rounded-md text-zinc-700 hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5l-3.5-3.5L4 16.5Z" /><path d="m13.5 7 3.5 3.5" /></svg></button><button type="button" onClick={() => save(notes.filter(item => item.id !== note.id))} aria-label={`Delete ${note.title}`} title="Delete note" className="inline-flex size-8 items-center justify-center rounded-md text-rose-700 hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M4 7h16M10 11v6m4-6v6M9 7l1-3h4l1 3m-8 0 1 13h8l1-13" /></svg></button></div></article>)}</div> : <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center"><p className="font-medium text-zinc-800">No notes yet</p><p className="mt-1 text-sm text-zinc-600">Keep reminders and follow-ups close to your workflow.</p></div>}</div><div className="border-t border-zinc-200 p-4"><button type="button" onClick={newNote} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"><span aria-hidden="true">+</span>Add note</button></div></aside></div>}
    {editorOpen && <div className="fixed inset-0 z-40 bg-zinc-950/30 p-4" onClick={() => setEditorOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby="note-dialog-title" onClick={event => event.stopPropagation()} className="mx-auto mt-[10vh] w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="note-dialog-title" className="text-lg font-semibold">{editing ? "Edit note" : "Add note"}</h2><p className="mt-1 text-sm text-zinc-600">Visible only in this browser.</p></div><button type="button" onClick={() => setEditorOpen(false)} aria-label="Close note editor" className="size-10 rounded-lg text-zinc-600 hover:bg-zinc-100">×</button></div><form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-sm font-medium">Title<input required maxLength={80} value={title} onChange={event => setTitle(event.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Follow up with a client" /></label><label className="block text-sm font-medium">Note<textarea required maxLength={500} value={body} onChange={event => setBody(event.target.value)} rows={5} className="mt-1 block w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Add the details you want to remember." /></label><fieldset><legend className="text-sm font-medium">Color</legend><div className="mt-2 flex gap-2">{colors.map(item => <label key={item.value} className={`flex size-9 cursor-pointer rounded-full border-2 ${item.tone} ${color === item.value ? "ring-2 ring-emerald-700 ring-offset-2" : ""}`}><input type="radio" name="note-color" value={item.value} checked={color === item.value} onChange={() => setColor(item.value)} className="sr-only" /><span className="sr-only">{item.label}</span></label>)}</div></fieldset><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditorOpen(false)} className="min-h-10 rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">Cancel</button><button className="min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900">{editing ? "Save changes" : "Add note"}</button></div></form></div></div>}
  </>;
}