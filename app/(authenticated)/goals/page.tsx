import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAnnualGoals, getGoals } from "@/lib/goals/repository";
import { parsePeriod } from "@/lib/period";
import { MonthPicker } from "@/app/month-picker";
import { GoalStepper } from "@/app/goal-stepper";
import { addProduct, removeGoal, saveAnnualGoal, saveGoal } from "./actions";
import { GoalSaveButton } from "./goal-save-button";

export const instant = false;


export default async function Goals({ searchParams }: { searchParams: Promise<{ period?: string; error?: string; saved?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "manager") redirect("/");
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const periodValue = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const goals = await getGoals(period.year, period.month);
  const annualGoals = await getAnnualGoals(period.year);
  return <>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm font-medium text-emerald-700">Planning</p><h1 className="text-2xl font-semibold">Goals</h1><p className="text-sm text-zinc-600">Team targets for {period.label}</p></div>
      <MonthPicker value={periodValue} />
    </div>
    {params.error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Check the goal values and product.</p>}
    {params.saved && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Goal saved.</p>}
    <details className="mb-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><summary className="cursor-pointer text-sm font-semibold text-emerald-800">Add a product</summary><form action={addProduct} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_10rem_auto]"><label className="text-sm font-medium">Product name<input name="name" required maxLength={60} placeholder="e.g. Motorcycle" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label><label className="text-sm font-medium">Code<input name="code" required maxLength={12} pattern="[A-Za-z0-9]{2,12}" placeholder="MOTO" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 uppercase" /></label><label className="text-sm font-medium">Category<select name="category" defaultValue="Other" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"><option>Vehicle</option><option>Property</option><option>Business</option><option>Personal</option><option>Other</option></select></label><button type="submit" className="mt-6 min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900">Add product</button></form><p className="mt-3 text-xs text-zinc-500">New products are active immediately and appear on the dashboard and in sales entry.</p></details>
    <GoalStepper>
    <section aria-label="Monthly product targets">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-zinc-600">Set monthly targets directly in the grid. Each row saves independently.</p><p className="text-xs text-zinc-500">Sales target is required.</p></div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600"><tr><th scope="col" className="px-3 py-2.5">Product</th><th scope="col" className="px-3 py-2.5">Sales target</th><th scope="col" className="px-3 py-2.5">Status</th><th scope="col" className="px-3 py-2.5 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-zinc-100">{goals.map(goal => { const formId = `goal-${goal.id}`; const hasGoal = goal.goal_id !== null; return <tr key={goal.id} className="hover:bg-zinc-50"><th scope="row" className="px-3 py-2.5 font-medium text-zinc-950"><div className="flex items-center gap-3"><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-800">{goal.code.slice(0, 2)}</span><span>{goal.name}</span></div></th><td className="px-3 py-2.5"><label className="sr-only" htmlFor={`sales-target-${goal.id}`}>{`${goal.name} sales target`}</label><input form={formId} id={`sales-target-${goal.id}`} name="target_count" type="number" min="0" max="1000000" step="1" required defaultValue={goal.target_count ?? ""} className="w-24 rounded-lg border border-zinc-300 px-2.5 py-1.5 tabular-nums" /></td><td className="px-3 py-2.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${hasGoal ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"}`}>{hasGoal ? "Configured" : "Not set"}</span></td><td className="px-3 py-2.5"><form id={formId} action={saveGoal} className="flex items-center justify-end gap-0.5"><input type="hidden" name="product_id" value={goal.id}/><input type="hidden" name="year" value={period.year}/><input type="hidden" name="month" value={period.month}/><input type="hidden" name="id" value={goal.goal_id ?? ""}/><input type="hidden" name="period" value={periodValue}/><GoalSaveButton configured={hasGoal} label={`${goal.name} goal`} />{hasGoal && <button formAction={removeGoal} formNoValidate aria-label={`Remove ${goal.name} goal`} title={`Remove ${goal.name} goal`} className="inline-flex size-10 items-center justify-center rounded-lg text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" /></svg></button>}</form></td></tr>; })}</tbody>
        </table>
      </div>
    </section>
    <section aria-label="Annual product targets">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-semibold">Annual targets</h2><p className="text-sm text-zinc-600">Yearly targets for {period.year}. Monthly dashboard cards remain monthly.</p></div><p className="text-xs text-zinc-500">Sales target is required.</p></div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm"><thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600"><tr><th scope="col" className="px-3 py-2.5">Product</th><th scope="col" className="px-3 py-2.5">Annual sales target</th><th scope="col" className="px-3 py-2.5">Status</th><th scope="col" className="px-3 py-2.5 text-right">Action</th></tr></thead><tbody className="divide-y divide-zinc-100">{annualGoals.map(goal => { const formId = `annual-goal-${goal.id}`; const hasGoal = goal.goal_id !== null; return <tr key={goal.id} className="hover:bg-zinc-50"><th scope="row" className="px-3 py-2.5 font-medium text-zinc-950"><div className="flex items-center gap-3"><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-800">{goal.code.slice(0, 2)}</span><span>{goal.name}</span></div></th><td className="px-3 py-2.5"><label className="sr-only" htmlFor={`annual-sales-${goal.id}`}>{`${goal.name} annual sales target`}</label><input form={formId} id={`annual-sales-${goal.id}`} name="target_count" type="number" min="0" max="1000000" step="1" required defaultValue={goal.target_count ?? ""} className="w-28 rounded-lg border border-zinc-300 px-2.5 py-1.5 tabular-nums" /></td><td className="px-3 py-2.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${hasGoal ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"}`}>{hasGoal ? "Configured" : "Not set"}</span></td><td className="px-3 py-2.5 text-right"><form id={formId} action={saveAnnualGoal} className="inline-flex"><input type="hidden" name="product_id" value={goal.id}/><input type="hidden" name="year" value={period.year}/><GoalSaveButton configured={hasGoal} label={`${goal.name} annual goal`} /></form></td></tr>; })}</tbody></table>
      </div>
    </section>
    </GoalStepper>
  </>;
}
