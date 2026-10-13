import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parsePeriod } from "@/lib/period";
import { ReportRangePicker } from "@/app/report-range-picker";
import { ReportSections } from "@/app/report-sections";
import { getHistoricalReport } from "@/lib/reports";
import { monthLabel, parseReportRange, reportSummary } from "@/lib/report-summary";
import { MonthlyChart, DistributionChart } from "./report-charts";
import { getDb } from "@/lib/db";

export const instant = false;
const money = (value: string | number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
const card = "min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm";
export default async function History({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "manager") redirect("/");
  const params = await searchParams;
  const period = parsePeriod(undefined);
  const periodValue = period.start.slice(0, 7);
  const reportMonths = parseReportRange(params.range);
  const report = await getHistoricalReport(periodValue, reportMonths);
  const summary = reportSummary(report.months);
  const [annualProgress] = await getDb()<{ recorded: number; target: number }[]>`
    with annual_targets as (
      select product_id, target_count
      from policyboard.annual_goals
      where year = ${period.year}
    )
    select
      (select count(*)::int from policyboard.sales s
        join annual_targets at on at.product_id = s.product_id
        where s.policy_status = 'in_force'
          and s.effective_date >= ${`${period.year}-01-01`}::date
          and s.effective_date < least(${period.end}::date, current_date + 1)) as recorded,
      coalesce((select sum(target_count)::int from annual_targets), 0) as target
  `;
  const annualLabel = annualProgress?.target ? `${annualProgress.recorded} / ${annualProgress.target}` : "—";
  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-emerald-700">Historical overview</p><h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-zinc-600">{monthLabel(report.start.slice(0, 7))} – {monthLabel(periodValue)} · {reportMonths}-month team summary</p></div>
      <ReportRangePicker value={reportMonths} />
    </div>
    <p className="mb-5 text-sm text-zinc-500">Shows active policies by effective date. Recorded, issued, cancelled, and not-issued policies do not affect this report. Goals are current stored targets, not immutable monthly snapshots.</p>
    <p role="status" className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This report includes the current month. Active policies are counted only through today; assigned goals cover the full month.</p>
    <section aria-label="Report summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {[{ label: "Active policies", value: summary.sales, detail: `Policies effective in the ${reportMonths}-month range` },
        { label: "Active premium", value: money(summary.premium), detail: "Premium on active policies in this range, not revenue" },
        { label: "Monthly target attainment", value: summary.achievement === null ? "—" : `${Math.round(summary.achievement)}%`, detail: "Active policies versus targets set for matching product-months" },
        { label: "Highest-volume month", value: summary.best ? monthLabel(summary.best.month) : "—", detail: summary.best ? `${summary.best.sales} active policies` : "No active policies" },
        { label: `${period.year} annual target progress`, value: annualLabel, detail: annualProgress?.target ? `${Math.round(annualProgress.recorded / annualProgress.target * 100)}% · active policies for configured products, through ${monthLabel(periodValue)}` : "No annual targets configured" }].map(item => <div key={item.label} className={card}><p className="text-sm text-zinc-500">{item.label}</p><p className="mt-2 text-2xl font-semibold">{item.value}</p><p className="mt-1 text-xs text-zinc-500">{item.detail}</p></div>)}
    </section>
    <ReportSections
      trends={<div className="grid gap-5 xl:grid-cols-2"><section className={card}><h2 className="text-lg font-semibold">Active policies vs goals</h2><p className="mb-4 text-sm text-zinc-500">Monthly active-policy totals. A missing goal is not a zero target.</p><MonthlyChart months={report.months} /></section><section className={card}><h2 className="text-lg font-semibold">Active premium by month</h2><p className="mb-4 text-sm text-zinc-500">Premium from active policies across products and agents.</p><MonthlyChart months={report.months} premium /></section></div>}
      distribution={<div className="grid gap-5 xl:grid-cols-2"><section className={card}><h2 className="mb-4 text-lg font-semibold">Product mix</h2><DistributionChart rows={report.products} total={summary.sales} /></section><section className={card}><h2 className="mb-1 text-lg font-semibold">Agent contribution</h2><p className="mb-4 text-sm text-zinc-500">Top 8 by sales · share of the entire period</p><DistributionChart rows={report.agents.slice(0, 8)} total={summary.sales} color="bg-zinc-700" />{report.agents.length > 8 && <p className="mt-4 text-xs text-zinc-500">{report.agents.length - 8} additional agents included in the totals.</p>}</section></div>}
      breakdown={<section><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><h2 className="text-lg font-semibold">Monthly breakdown</h2><p className="text-sm text-zinc-600">Ending month vs previous: {summary.change === null ? "— (no previous active policies)" : `${summary.change > 0 ? "+" : ""}${summary.change.toFixed(1)}%`}</p></div><div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white"><table className="w-full whitespace-nowrap text-left text-sm"><caption className="sr-only">Exact monthly values for the historical report charts</caption><thead className="bg-zinc-100 text-zinc-600"><tr>{["Month", "Active policies", "Goal", "Attainment", "Goal gap", "Premium"].map(label => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{report.months.map(month => <tr key={month.month} className="border-t border-zinc-100"><th scope="row" className="px-4 py-3 font-medium">{monthLabel(month.month)}</th><td className="px-4 py-3">{month.sales}</td><td className="px-4 py-3">{month.goal ?? "—"}</td><td className="px-4 py-3">{month.goal && month.goal > 0 ? `${Math.round(month.goal_sales / month.goal * 100)}%` : "—"}</td><td className={`px-4 py-3 font-medium ${month.goal && month.goal > 0 && month.goal_sales >= month.goal ? "text-emerald-800" : "text-zinc-700"}`}>{month.goal && month.goal > 0 ? month.goal_sales >= month.goal ? "Goal met" : `${month.goal - month.goal_sales} remaining` : "—"}</td><td className="px-4 py-3">{money(month.premium)}</td></tr>)}</tbody></table></div></section>}
    />  </>;
}
