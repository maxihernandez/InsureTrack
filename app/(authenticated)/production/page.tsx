import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProductionPageData } from "@/lib/production/repository";
import { addSale } from "./actions";

export const instant = false;


export default async function Production({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const { products, agents, recent } = await getProductionPageData(user.id, user.role === "manager");
  const canSubmit = products.length > 0 && (user.role !== "manager" || agents.length > 0);
  return <>
    <div className="mb-6"><p className="text-sm font-medium text-emerald-700">Production</p><h1 className="text-2xl font-semibold">Add a sale</h1><p className="text-sm text-zinc-600">Each saved sale counts as one marker toward its product goal.</p></div>
    {params.error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error === "inactive" ? "Select an active agent and product." : "Check the date and amounts."}</p>}
    {params.saved && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Production saved.</p>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
      <form action={addSale} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        {user.role === "manager" && <label className="block text-sm font-medium">Agent<select name="agent_id" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"><option value="">Select agent</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
        <label className="block text-sm font-medium">Product<select name="product_id" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"><option value="">Select product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="block text-sm font-medium">Sale date<input name="sale_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Premium<input name="premium" type="number" min="0" step="0.01" placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label><label className="block text-sm font-medium">Amount<input name="amount" type="number" min="0" step="0.01" placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label></div>
        <label className="block text-sm font-medium">Notes<textarea name="notes" maxLength={2000} rows={3} placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label>
        <button disabled={!canSubmit} className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">Save production</button>
        {!canSubmit && <p className="text-sm text-zinc-600">An active product and agent are required.{user.role === "manager" && agents.length === 0 && <> <Link href="/team/manage" className="font-medium text-emerald-800 underline">Create an agent</Link>.</>}</p>}
      </form>
      <section><h2 className="mb-3 text-lg font-semibold">Recent production</h2><div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{recent.length ? recent.map(s => <div key={s.id} className="flex justify-between gap-3 border-b border-zinc-100 p-4 last:border-0"><div><p className="font-medium">{s.product}</p><p className="text-sm text-zinc-600">{s.name} · {s.sale_date}</p></div><p className="text-sm text-zinc-600">{s.premium === null ? "—" : `$${Number(s.premium).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</p></div>) : <p className="p-4 text-sm text-zinc-600">No production recorded yet.</p>}</div></section>
    </div>
  </>;
}
