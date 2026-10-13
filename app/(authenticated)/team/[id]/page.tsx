import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parsePeriod } from "@/lib/period";
import { MonthPicker } from "@/app/month-picker";
import { isUuid } from "@/lib/validation";
import { markPolicyActive } from "./actions";

export const instant = false;


type Breakdown = { id: string; name: string; mtd_count: number; ytd_count: number; team_target: number | null; mtd_premium: string };
type AgentPolicy = { id: string; product: string; policy_number: string | null; sale_date: string; policy_status: "recorded" | "issued" | "in_force" | "not_issued" | "cancelled" | "legacy"; effective_date: string | null };

export default async function AgentDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ period?: string; policy_updated?: string; policy_error?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!isUuid(id)) notFound();
  if (user.role !== "manager") redirect("/");
  const { period: rawPeriod, policy_updated, policy_error } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const periodValue = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const yearStart = `${period.year}-01-01`;
  const sql = getDb();
  const [agents, breakdown, policies] = await Promise.all([
    sql<{ name: string }[]>`select pr.first_name || ' ' || pr.last_name as name from policyboard.users u join policyboard.profiles pr on pr.user_id = u.id join policyboard.roles r on r.id = u.role_id where u.id = ${id} and r.code = 'agent'`,
    sql<Breakdown[]>`
      with monthly as (
        select product_id, count(*)::int sale_count, coalesce(sum(premium), 0)::text premium
        from policyboard.sales where user_id = ${id} and sale_date >= ${period.start}::date and sale_date < least(${period.end}::date, current_date + 1) group by product_id
      ), yearly as (
        select product_id, count(*)::int sale_count from policyboard.sales
        where user_id = ${id} and sale_date >= ${yearStart}::date and sale_date < least(${period.end}::date, current_date + 1) group by product_id
      )
      select p.id, p.name, coalesce(m.sale_count, 0)::int mtd_count, coalesce(y.sale_count, 0)::int ytd_count,
        g.target_count as team_target, coalesce(m.premium, '0') mtd_premium
      from policyboard.products p
      left join monthly m on m.product_id = p.id
      left join yearly y on y.product_id = p.id
      left join policyboard.goals g on g.product_id = p.id and g.year = ${period.year} and g.month = ${period.month}
      where p.active or m.product_id is not null or y.product_id is not null
      order by p.display_order
    `,
    sql<AgentPolicy[]>`
      select s.id, p.name as product, s.policy_number, s.sale_date::text, s.policy_status, s.effective_date::text
      from policyboard.sales s join policyboard.products p on p.id = s.product_id
      where s.user_id = ${id} and (s.sale_date >= ${period.start}::date and s.sale_date < ${period.end}::date or s.effective_date >= ${period.start}::date and s.effective_date < ${period.end}::date)
      order by s.sale_date desc, s.created_at desc
    `,
  ]);
  const agent = agents[0];
  if (!agent) notFound();
  const mtd = breakdown.reduce((total, row) => total + row.mtd_count, 0);
  const ytd = breakdown.reduce((total, row) => total + row.ytd_count, 0);
  return <>
    <Link href={`/team?period=${periodValue}`} className="text-sm text-emerald-700 hover:underline">← Team</Link>
    <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-emerald-700">Agent detail</p><h1 className="text-2xl font-semibold">{agent.name}</h1><p className="text-sm text-zinc-600">{period.label}</p></div>
      <MonthPicker value={periodValue} /></div>
    <div className="mb-6 grid grid-cols-2 gap-3"><div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-sm text-zinc-600">Sales this month</p><p className="text-2xl font-semibold">{mtd}</p></div><div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-sm text-zinc-600">Sales this year</p><p className="text-2xl font-semibold">{ytd}</p></div></div>
    {policy_updated && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Policy marked active.</p>}
    {policy_error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">An effective date is required to mark this policy active.</p>}
    <section className="mb-7"><div className="mb-3"><h2 className="text-lg font-semibold">Policies</h2><p className="text-sm text-zinc-600">Policies recorded or effective during {period.label}. Marking a policy active is audited and updates the dashboard count.</p></div><div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{policies.length ? policies.map(policy => { const active = policy.policy_status === "in_force"; const canActivate = policy.policy_status === "recorded" || policy.policy_status === "issued"; return <article key={policy.id} className="border-b border-zinc-100 p-4 last:border-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{policy.product} <span className="font-normal text-zinc-500">· {policy.policy_number ?? "No policy number"}</span></p><p className="mt-1 text-sm text-zinc-600">Recorded {policy.sale_date}{policy.effective_date ? ` · Effective ${policy.effective_date}` : ""}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-green-100 text-green-800" : policy.policy_status === "cancelled" || policy.policy_status === "not_issued" ? "bg-red-50 text-red-800" : "bg-zinc-100 text-zinc-700"}`}>{active ? "Active" : policy.policy_status === "not_issued" ? "Not issued" : policy.policy_status === "recorded" ? "Recorded" : policy.policy_status === "issued" ? "Issued" : policy.policy_status === "cancelled" ? "Cancelled" : "Legacy"}</span></div>{canActivate && <form action={markPolicyActive} className="mt-3 flex flex-wrap items-end gap-2 border-t border-zinc-100 pt-3"><input type="hidden" name="sale_id" value={policy.id}/><input type="hidden" name="policy_status" value="in_force"/><input type="hidden" name="agent_id" value={id}/><input type="hidden" name="period" value={periodValue}/><label className="text-xs font-medium text-zinc-600">Effective date<input name="effective_date" type="date" required defaultValue={policy.effective_date ?? ""} className="mt-1 block rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" /></label><button type="submit" className="min-h-9 rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Mark active</button></form>}</article>; }) : <p className="p-4 text-sm text-zinc-600">No policies for this month.</p>}</div></section>
    <h2 className="mb-3 text-lg font-semibold">Production by product</h2><p className="mb-3 text-sm text-zinc-600">Targets below belong to the team; they are not individual quotas.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{breakdown.map(row => <article key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4"><h3 className="font-semibold">{row.name}</h3><p className="mt-2 text-sm">{row.mtd_count} this month · {row.ytd_count} this year</p><p className="text-sm text-zinc-600">Team target: {row.team_target ?? "—"}</p><p className="text-sm text-zinc-600">This month's premium: ${Number(row.mtd_premium).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></article>)}</div>
  </>;
}
