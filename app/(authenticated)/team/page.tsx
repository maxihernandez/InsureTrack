import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parsePeriod } from "@/lib/period";
import { MonthPicker } from "@/app/month-picker";
import { CreateAgentDialog } from "@/app/create-agent-dialog";

export const instant = false;

type AgentRow = { id: string; name: string; active: boolean; mtd_count: number; ytd_count: number; mtd_premium: string };

export default async function Team({ searchParams }: { searchParams: Promise<{ period?: string; saved?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "manager") redirect("/");
  const { period: rawPeriod, saved } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const periodValue = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const yearStart = `${period.year}-01-01`;
  const sql = getDb();
  const [agents, targets, reserved] = await Promise.all([
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
    user.role === "manager" ? sql<{ username: string }[]>`select lower(username) as username from policyboard.users where username is not null` : Promise.resolve([] as { username: string }[]),
  ]);
  const teamGoal = targets[0]?.target ?? 0;
  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-emerald-700">Team performance</p><h1 className="text-2xl font-semibold">Team</h1><p className="text-sm text-zinc-600">Ranking for {period.label}</p></div>
      <MonthPicker value={periodValue} />
    </div>
{saved === "created" && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Agent created and available in Team.</p>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2 shadow-sm"><span aria-hidden="true" className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></svg></span><div><p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Team target</p><p className="text-lg font-semibold tabular-nums text-zinc-950">{teamGoal.toLocaleString("en-US")} <span className="text-sm font-medium text-zinc-500">sales</span></p></div></div><span title="Each percentage is the agent contribution to the team target" className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 20c.4-3.1 2.4-5 5.5-5s5.1 1.9 5.5 5M15 15.5c2.8-.3 4.8 1.1 5.2 4" /></svg>Contribution</span></div>{user.role === "manager" && <CreateAgentDialog reservedUsernames={reserved.map(agent => agent.username)} />}</div>
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-center text-sm"><thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500"><tr><th scope="col" className="px-4 py-3">Rank</th><th scope="col" className="px-4 py-3">Agent</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">MTD</th><th scope="col" className="px-4 py-3">YTD</th><th scope="col" className="px-4 py-3">Goal share</th><th scope="col" className="px-4 py-3">MTD premium</th><th scope="col" className="px-4 py-3">Actions</th></tr></thead>
        <tbody>{agents.length ? agents.map((agent, index) => <tr key={agent.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"><td className="px-4 py-4 font-medium text-emerald-800">#{index + 1}</td><td className="px-4 py-4 font-semibold text-zinc-900">{agent.name}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${agent.active ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-600"}`}>{agent.active ? "Active" : "Inactive"}</span></td><td className="px-4 py-4 font-medium tabular-nums">{agent.mtd_count}</td><td className="px-4 py-4 tabular-nums">{agent.ytd_count}</td><td className="px-4 py-4 tabular-nums">{teamGoal ? `${Math.round(agent.mtd_count / teamGoal * 100)}%` : "-"}</td><td className="px-4 py-4 font-medium tabular-nums">${Number(agent.mtd_premium).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td><td className="px-4 py-4"><div className="flex items-center justify-center gap-1 whitespace-nowrap">{(user.role === "manager" || user.id === agent.id) && <Link aria-label={`View ${agent.name} details`} title={`View ${agent.name} details`} className="inline-flex size-9 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={`/team/${agent.id}?period=${periodValue}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg></Link>}{user.role === "manager" && <><Link aria-label={`Edit ${agent.name}`} title={`Edit ${agent.name}`} className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={`/team/manage?agent=${agent.id}#agent-${agent.id}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5l-3.5-3.5L4 16.5Z" /><path d="m13.5 7 3.5 3.5" /></svg></Link><Link aria-label={`${agent.active ? "Deactivate" : "Activate"} ${agent.name}`} title={`${agent.active ? "Deactivate" : "Activate"} ${agent.name}`} className={`inline-flex size-9 items-center justify-center rounded-lg hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 ${agent.active ? "text-rose-700 focus-visible:outline-rose-700 hover:bg-rose-50" : "text-emerald-700 focus-visible:outline-emerald-700 hover:bg-emerald-50"}`} href={`/team/manage?agent=${agent.id}#agent-${agent.id}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M12 3v9" /><path d="M7.1 5.9a7 7 0 1 0 9.8 0" /></svg></Link></>}</div></td></tr>) : <tr><td colSpan={8} className="px-4 py-6 text-zinc-600">No active agents yet.</td></tr>}</tbody>
      </table>
    </div>
  </>;
}
