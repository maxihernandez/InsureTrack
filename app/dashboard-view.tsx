import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parsePeriod } from "@/lib/period";
import { DashboardSteps } from "@/app/dashboard-steps";
import { ProductGoalsSection } from "@/app/product-goals-section";
import { TeamRanking } from "@/app/team-ranking";

type ProductProgress = { id: string; name: string; target_count: number | null; target_amount: string | null; mtd_count: number; ytd_count: number; mtd_premium: string; ytd_premium: string; mtd_amount: string };
type Ranking = { id: string; name: string; mtd_count: number; ytd_count: number };
type Activity = { metric_type: string; value: number; target: number | null };
const money = (value: string | number) => `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type SummaryMetric = "mtd-sales" | "monthly-goal" | "ytd-sales" | "mtd-premium";
function SummaryIcon({ metric }: { metric: SummaryMetric }) {
  const graphic = metric === "mtd-sales" ? <><path d="M4 4h8l8 8-8 8-8-8V4Z" /><circle cx="9" cy="9" r="1" /><path d="M14 11v5m1.5-4c-.4-.5-2.5-.6-2.5.6 0 1.6 2.5.6 2.5 2.1 0 1.2-2.1 1.1-2.6.5" /></>
    : metric === "monthly-goal" ? <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>
      : metric === "ytd-sales" ? <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16m-9 4h5m-5 3h3" /></>
        : <><circle cx="12" cy="12" r="8" /><path d="M14.5 9.5c-.5-.8-1.5-1.2-2.5-1.2-1.4 0-2.4.7-2.4 1.8 0 2.7 4.9 1.3 4.9 4 0 1.1-1.1 1.9-2.6 1.9-1.2 0-2.2-.5-2.8-1.4M12 6.5v11" /></>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">{graphic}</svg>;
}


export async function DashboardView({ searchParams, history = false }: { searchParams: Promise<{ period?: string }>; history?: boolean }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { period: rawPeriod } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const periodValue = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const yearStart = `${period.year}-01-01`;
  const sql = getDb();
  const [products, ranking, activities] = await Promise.all([
    sql<ProductProgress[]>`
      with monthly as (
        select product_id, count(*)::int as sale_count, coalesce(sum(premium), 0)::text as premium, coalesce(sum(amount), 0)::text as amount
        from policyboard.sales where sale_date >= ${period.start}::date and sale_date < least(${period.end}::date, current_date + 1) group by product_id
      ), yearly as (
        select product_id, count(*)::int as sale_count, coalesce(sum(premium), 0)::text as premium
        from policyboard.sales where sale_date >= ${yearStart}::date and sale_date < least(${period.end}::date, current_date + 1) group by product_id
      )
      select p.id, p.name, g.target_count, g.target_amount::text,
        coalesce(m.sale_count, 0)::int as mtd_count, coalesce(y.sale_count, 0)::int as ytd_count,
        coalesce(m.premium, '0') as mtd_premium, coalesce(y.premium, '0') as ytd_premium,
        coalesce(m.amount, '0') as mtd_amount
      from policyboard.products p
      left join policyboard.goals g on g.product_id = p.id and g.year = ${period.year} and g.month = ${period.month}
      left join monthly m on m.product_id = p.id
      left join yearly y on y.product_id = p.id
      where p.active or m.product_id is not null or y.product_id is not null
      order by p.display_order
    `,
    sql<Ranking[]>`
      select u.id, pr.first_name || ' ' || pr.last_name as name,
        count(s.id) filter (where s.sale_date >= ${period.start}::date)::int as mtd_count,
        count(s.id)::int as ytd_count
      from policyboard.users u
      join policyboard.profiles pr on pr.user_id = u.id
      join policyboard.roles r on r.id = u.role_id
      left join policyboard.sales s on s.user_id = u.id and s.sale_date >= ${yearStart}::date and s.sale_date < least(${period.end}::date, current_date + 1)
      where r.code = 'agent' and (u.active or exists (
        select 1 from policyboard.sales previous
        where previous.user_id = u.id and previous.sale_date >= ${yearStart}::date
          and previous.sale_date < least(${period.end}::date, current_date + 1)
      ))
      group by u.id, pr.first_name, pr.last_name
      order by mtd_count desc, ytd_count desc, name
    `,
    sql<Activity[]>`
      select metric_type,
        coalesce(max(value) filter (where user_id is null), sum(value) filter (where user_id is not null), 0)::int as value,
        coalesce(max(target) filter (where user_id is null), sum(target) filter (where user_id is not null))::int as target
      from policyboard.activity_metrics
      where year = ${period.year} and month = ${period.month}
      group by metric_type order by metric_type
    `,
  ]);
  const mtd = products.reduce((total, p) => total + p.mtd_count, 0);
  const ytd = products.reduce((total, p) => total + p.ytd_count, 0);
  const goal = products.reduce((total, p) => total + (p.target_count ?? 0), 0);
  const premium = products.reduce((total, p) => total + Number(p.mtd_premium), 0);
  return <>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-emerald-700">Team performance</p><h1 className="text-2xl font-semibold">{history ? "Monthly history" : "Dashboard"}</h1><p className="text-sm text-zinc-600">{period.label}</p></div>
      <div className="flex flex-wrap items-end gap-2">
        {!history && <Link href="/production" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Add sale</Link>}
        <form method="get" className="flex items-end gap-2"><label className="text-sm font-medium">Month<input name="period" type="month" min="2020-01" max="2100-12" defaultValue={periodValue} className="mt-1 block rounded-lg border border-zinc-300 bg-white px-3 py-2" /></label><button className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">View</button></form>
      </div>
    </div>
    <section aria-label="Summary" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {[{ label: "MTD sales", value: mtd, metric: "mtd-sales" as const, tone: "bg-emerald-50 text-emerald-800" }, { label: "Monthly goal", value: goal, metric: "monthly-goal" as const, tone: "bg-sky-50 text-sky-800" }, { label: "YTD sales", value: ytd, metric: "ytd-sales" as const, tone: "bg-violet-50 text-violet-800" }, { label: "MTD premium", value: money(premium), metric: "mtd-premium" as const, tone: "bg-amber-50 text-amber-800" }].map(item => <div key={item.label} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"><span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.tone}`}><SummaryIcon metric={item.metric} /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.label}</p><p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums text-zinc-950">{item.value}</p></div></div>)}
    </section>
    <DashboardSteps key={periodValue} enabled={!history} production={<ProductGoalsSection products={products} editGoalsHref={user.role === "manager" ? `/goals?period=${periodValue}` : undefined} customizable={!history} />} ranking={
      <TeamRanking agents={ranking} />
    } commercial={
      <section><h2 className="mb-3 text-lg font-semibold">Commercial activity · MTD</h2><div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{activities.length ? activities.map(a => <div key={a.metric_type} className="flex justify-between border-b border-zinc-100 px-4 py-3 last:border-0"><span>{a.metric_type}</span><span className="font-medium">{a.value}{a.target === null ? "" : ` / ${a.target}`}</span></div>) : <p className="p-4 text-sm text-zinc-600">No activity metrics for this month.</p>}</div></section>
    } />
  </>;
}
