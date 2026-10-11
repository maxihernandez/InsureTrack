import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProductionPageData, type RecentSale } from "@/lib/production/repository";
import { addSale, updatePolicy } from "./actions";
import { SaveSaleButton } from "./submit-button";

export const instant = false;

const policyStatusLabel: Record<RecentSale["policy_status"], string> = {
  legacy: "Legacy",
  recorded: "Recorded",
  issued: "Issued",
  in_force: "In force",
  not_issued: "Not issued",
  cancelled: "Cancelled",
};

function PolicyStatusChip({ status }: { status: RecentSale["policy_status"] }) {
  const tone = status === "in_force" ? "bg-emerald-100 text-emerald-900" : status === "not_issued" || status === "cancelled" ? "bg-red-50 text-red-800" : status === "legacy" ? "bg-zinc-100 text-zinc-600" : "bg-zinc-100 text-zinc-700";
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tone}`}>{policyStatusLabel[status]}</span>;
}

export default async function Production({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; policy_error?: string; policy_updated?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const { products, agents, recent } = await getProductionPageData(user.id, user.role === "manager");
  const canSubmit = products.length > 0 && (user.role !== "manager" || agents.length > 0);
  return <>
    <div className="mb-6"><p className="text-sm font-medium text-emerald-700">Production</p><h1 className="text-2xl font-semibold">Add a policy</h1><p className="text-sm text-zinc-600">A policy is recorded first and becomes effective only after manager validation.</p></div>
    {params.error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error === "inactive" ? "Select an active agent and product." : "Check the policy number, date and amounts."}</p>}
    {params.saved && <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><span>Policy recorded. It is pending validation.</span><Link href="#sale-form" className="font-semibold underline">Add another policy</Link></div>}
    {params.policy_updated && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Policy status updated.</p>}
    {params.policy_error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.policy_error === "forbidden" ? "Only managers can validate policies." : "Check the selected status and effective date."}</p>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
      <form id="sale-form" action={addSale} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div><h2 className="text-lg font-semibold">Policy details</h2><p className="mt-1 text-sm text-zinc-600">Policy number, agent, product and date are required.</p></div>
        {user.role === "manager" && <label className="block text-sm font-medium">Agent<select name="agent_id" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"><option value="">Select agent</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
        <label className="block text-sm font-medium">Policy number<input name="policy_number" required maxLength={100} autoComplete="off" placeholder="Enter policy number" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label>
        <label className="block text-sm font-medium">Product<select name="product_id" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"><option value="">Select product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="block text-sm font-medium">Recorded date<input name="sale_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label>
        <fieldset className="space-y-4 border-t border-zinc-100 pt-5"><legend className="px-0 text-sm font-semibold">Optional financial details</legend><div className="mt-3 grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Premium<input name="premium" type="number" min="0" step="0.01" placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label><label className="block text-sm font-medium">Amount<input name="amount" type="number" min="0" step="0.01" placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label></div>
        <label className="block text-sm font-medium">Notes<textarea name="notes" maxLength={2000} rows={3} placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label></fieldset>
        <SaveSaleButton disabled={!canSubmit} />
        {!canSubmit && <p className="text-sm text-zinc-600">An active product and agent are required.{user.role === "manager" && agents.length === 0 && <> <Link href="/team/manage" className="font-medium text-emerald-800 underline">Create an agent</Link>.</>}</p>}
      </form>
      <section><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Recent policies</h2><p className="text-sm text-zinc-600">Recorded and effective status are tracked separately.</p></div></div><div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{recent.length ? recent.map(s => <article key={s.id} className="border-b border-zinc-100 p-4 last:border-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{s.product} <span className="font-normal text-zinc-500">· {s.policy_number ?? "No policy number"}</span></p><p className="mt-1 text-sm text-zinc-600">{s.name} · Recorded {s.sale_date}{s.effective_date ? ` · Effective ${s.effective_date}` : ""}</p></div><div className="flex items-center gap-3"><PolicyStatusChip status={s.policy_status} /><p className="text-sm text-zinc-600">{s.premium === null ? "—" : `$${Number(s.premium).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</p></div></div>{user.role === "manager" && s.policy_status !== "legacy" && <form action={updatePolicy} className="mt-3 grid items-end gap-2 border-t border-zinc-100 pt-3 sm:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_auto]"><input type="hidden" name="sale_id" value={s.id} /><label className="block text-xs font-medium text-zinc-600">Status<select name="policy_status" defaultValue={s.policy_status} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"><option value="recorded">Recorded</option><option value="issued">Issued</option><option value="in_force">In force</option><option value="not_issued">Not issued</option><option value="cancelled">Cancelled</option></select></label><label className="block text-xs font-medium text-zinc-600">Effective date <span className="font-normal">(required for In force)</span><input name="effective_date" type="date" defaultValue={s.effective_date ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" /></label><button aria-label={`Update ${s.policy_number} policy status`} title="Update policy status" className="inline-flex size-10 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M5 4h12l2 2v14H5V4Z" /><path d="M8 4v6h7V4m-7 16v-6h8v6" /></svg></button></form>}{s.policy_status === "legacy" && <p className="mt-2 text-xs text-zinc-500">Legacy sale: its policy number and effective status were not available.</p>}</article>) : <p className="p-4 text-sm text-zinc-600">No policies recorded yet.</p>}</div></section>
    </div>
  </>;
}