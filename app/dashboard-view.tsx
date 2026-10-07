import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parsePeriod } from "@/lib/period";
import { DashboardSteps } from "@/app/dashboard-steps";

type ProductProgress = { id: string; name: string; target_count: number | null; target_amount: string | null; mtd_count: number; ytd_count: number; mtd_premium: string; ytd_premium: string; mtd_amount: string };
type Ranking = { id: string; name: string; mtd_count: number; ytd_count: number };
type Activity = { metric_type: string; value: number; target: number | null };
const money = (value: string | number) => `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-emerald-700">Team performance</p><h1 className="text-2xl font-semibold">{history ? "Monthly history" : "Dashboard"}</h1><p className="text-sm text-zinc-600">{period.label}</p></div>
      <form method="get" className="flex items-end gap-2"><label className="text-sm font-medium">Month<input name="period" type="month" min="2020-01" max="2100-12" defaultValue={periodValue} className="mt-1 block rounded-lg border border-zinc-300 bg-white px-3 py-2" /></label><button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">View</button></form>
    </div>
    <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[{ label: "MTD sales", value: mtd }, { label: "Monthly goal", value: goal }, { label: "YTD sales", value: ytd }, { label: "MTD premium", value: money(premium) }].map(item => <div key={item.label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-sm text-zinc-600">{item.label}</p><p className="mt-1 text-2xl font-semibold">{item.value}</p></div>)}
    </section>
    <DashboardSteps key={periodValue} enabled={!history} production={<section className={history ? "mt-8" : ""}><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Product goals</h2>{user.role === "manager" && <Link className="text-sm font-medium text-emerald-700 hover:underline" href={`/goals?period=${periodValue}`}>Edit goals</Link>}</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{products.map(p => {
        const target = p.target_count;
        const shownActual = Math.min(p.mtd_count, 40);
        const shownRemaining = target === null ? 0 : Math.min(Math.max(target - p.mtd_count, 0), 40 - shownActual);
        return <article key={p.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{p.name}</h3><span className="text-sm text-zinc-600">{target === null ? "No goal" : `${target ? Math.round(p.mtd_count / target * 100) : 0}%`}</span></div>
          <div aria-hidden="true" className="mt-3 break-all text-lg leading-6 tracking-wider text-emerald-600">{"●".repeat(shownActual)}<span className="text-zinc-300">{"○".repeat(shownRemaining)}</span></div>
          <p className="mt-2 text-sm font-medium">{p.mtd_count} / {target ?? "—"} sales</p>
          <p className="mt-1 text-xs text-zinc-500">Remaining: {target === null ? "—" : Math.max(target - p.mtd_count, 0)} · YTD: {p.ytd_count}</p>
          <p className="mt-2 text-sm text-zinc-600">Premium MTD: {money(p.mtd_premium)}</p>
          {p.target_amount !== null && <p className="text-xs text-zinc-500">Amount: {money(p.mtd_amount)} / {money(p.target_amount)}{Number(p.target_amount) > 0 ? ` · ${Math.round(Number(p.mtd_amount) / Number(p.target_amount) * 100)}%` : ""}</p>}
          {(p.mtd_count > 40 || (target !== null && target > 40)) && <p className="mt-1 text-xs text-zinc-500">Showing up to 40 markers.</p>}
        </article>;
      })}</div>
    </section>} ranking={
      <section><h2 className="mb-3 text-lg font-semibold">Team ranking · MTD</h2><div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{ranking.length ? ranking.map((agent, index) => <div key={agent.id} className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 last:border-0"><p><span className="mr-3 text-zinc-500">{index + 1}.</span>{agent.name}</p><p className="text-sm font-medium">{agent.mtd_count} MTD <span className="text-zinc-500">· {agent.ytd_count} YTD</span></p></div>) : <p className="p-4 text-sm text-zinc-600">No active agents yet.</p>}</div></section>
    } commercial={
      <section><h2 className="mb-3 text-lg font-semibold">Commercial activity · MTD</h2><div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{activities.length ? activities.map(a => <div key={a.metric_type} className="flex justify-between border-b border-zinc-100 px-4 py-3 last:border-0"><span>{a.metric_type}</span><span className="font-medium">{a.value}{a.target === null ? "" : ` / ${a.target}`}</span></div>) : <p className="p-4 text-sm text-zinc-600">No activity metrics for this month.</p>}</div></section>
    } />
  </>;
}
