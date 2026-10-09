import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parsePeriod } from "@/lib/period";
import { MonthPicker } from "@/app/month-picker";
import { isUuid } from "@/lib/validation";

export const instant = false;


type Breakdown = { id: string; name: string; mtd_count: number; ytd_count: number; team_target: number | null; mtd_premium: string };

export default async function AgentDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ period?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!isUuid(id)) notFound();
  if (user.role !== "manager") redirect("/");
  const { period: rawPeriod } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const periodValue = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const yearStart = `${period.year}-01-01`;
  const sql = getDb();
  const [agents, breakdown] = await Promise.all([
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
  ]);
  const agent = agents[0];
  if (!agent) notFound();
  const mtd = breakdown.reduce((total, row) => total + row.mtd_count, 0);
  const ytd = breakdown.reduce((total, row) => total + row.ytd_count, 0);
  return <>
    <Link href={`/team?period=${periodValue}`} className="text-sm text-emerald-700 hover:underline">← Team</Link>
    <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-emerald-700">Agent detail</p><h1 className="text-2xl font-semibold">{agent.name}</h1><p className="text-sm text-zinc-600">{period.label}</p></div>
      <MonthPicker value={periodValue} /></div>
    <div className="mb-6 grid grid-cols-2 gap-3"><div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-sm text-zinc-600">MTD sales</p><p className="text-2xl font-semibold">{mtd}</p></div><div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-sm text-zinc-600">YTD sales</p><p className="text-2xl font-semibold">{ytd}</p></div></div>
    <h2 className="mb-3 text-lg font-semibold">Production by product</h2><p className="mb-3 text-sm text-zinc-600">Targets below belong to the team; they are not individual quotas.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{breakdown.map(row => <article key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4"><h3 className="font-semibold">{row.name}</h3><p className="mt-2 text-sm">{row.mtd_count} MTD · {row.ytd_count} YTD</p><p className="text-sm text-zinc-600">Team target: {row.team_target ?? "—"}</p><p className="text-sm text-zinc-600">MTD premium: ${Number(row.mtd_premium).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></article>)}</div>
  </>;
}
