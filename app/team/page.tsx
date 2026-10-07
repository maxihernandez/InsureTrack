import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parsePeriod } from "@/lib/period";

export const instant = false;

type AgentRow = { id: string; name: string; active: boolean; mtd_count: number; ytd_count: number; mtd_premium: string };

export default async function Team({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { period: rawPeriod } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const periodValue = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const yearStart = `${period.year}-01-01`;
  const sql = getDb();
  const [agents, targets] = await Promise.all([
    sql<AgentRow[]>`
      select u.id, pr.first_name || ' ' || pr.last_name as name, u.active,
        count(s.id) filter (where s.sale_date >= ${period.start}::date)::int as mtd_count,
        count(s.id)::int as ytd_count,
        coalesce(sum(s.premium) filter (where s.sale_date >= ${period.start}::date), 0)::text as mtd_premium
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
    sql<{ target: number }[]>`select coalesce(sum(target_count), 0)::int as target from policyboard.goals where year = ${period.year} and month = ${period.month}`,
  ]);
  const teamGoal = targets[0]?.target ?? 0;
  return <AppShell user={user} current="team">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-emerald-700">Team performance</p><h1 className="text-2xl font-semibold">Team</h1><p className="text-sm text-zinc-600">Ranking for {period.label}</p></div>
      <form method="get" className="flex items-end gap-2"><label className="text-sm font-medium">Month<input name="period" type="month" min="2020-01" max="2100-12" defaultValue={periodValue} className="mt-1 block rounded-lg border border-zinc-300 bg-white px-3 py-2" /></label><button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">View</button></form>
    </div>
    <p className="mb-4 text-sm text-zinc-600">Team goal: {teamGoal} sales. Individual percentages show contribution to this team goal, not personal quotas.</p>
    <div className="space-y-3">{agents.length ? agents.map((agent, index) => <article key={agent.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-emerald-700">#{index + 1}</p><h2 className="text-lg font-semibold">{agent.name}{!agent.active && <span className="ml-2 text-xs font-normal text-zinc-500">Inactive</span>}</h2></div>{(user.role === "manager" || user.id === agent.id) && <Link className="text-sm font-medium text-emerald-700 hover:underline" href={`/team/${agent.id}?period=${periodValue}`}>Details</Link>}</div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><p><span className="block text-zinc-500">MTD</span><strong>{agent.mtd_count}</strong></p><p><span className="block text-zinc-500">YTD</span><strong>{agent.ytd_count}</strong></p><p><span className="block text-zinc-500">Team goal share</span><strong>{teamGoal ? `${Math.round(agent.mtd_count / teamGoal * 100)}%` : "—"}</strong></p><p><span className="block text-zinc-500">MTD premium</span><strong>${Number(agent.mtd_premium).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></p></div>
    </article>) : <p className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">No active agents yet.</p>}</div>
  </AppShell>;
}
