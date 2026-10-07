import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parsePeriod } from "@/lib/period";
import { getHistoricalReport } from "@/lib/reports";
import { monthLabel, reportSummary } from "@/lib/report-summary";
import { MonthlyChart, DistributionChart } from "./report-charts";

export const instant = false;
const money = (value: string | number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
const card = "min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm";
export default async function History({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const previousMonth = new Date();
  previousMonth.setUTCDate(1);
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1);
  const period = parsePeriod(params.period ?? previousMonth.toISOString().slice(0, 7));
  const periodValue = period.start.slice(0, 7);
  const report = await getHistoricalReport(periodValue);
  const summary = reportSummary(report.months);
  const currentMonth = new Date().toISOString().slice(0, 7);
  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-emerald-700">Historical overview</p><h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-zinc-600">{monthLabel(report.start.slice(0, 7))} – {monthLabel(periodValue)} · 12-month team summary</p></div>
      <form method="get" className="flex items-end gap-2"><label className="text-sm font-medium">Ending month<input name="period" type="month" min="2020-01" max="2100-12" defaultValue={periodValue} className="mt-1 block rounded-lg border border-zinc-300 bg-white px-3 py-2" /></label><button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">View report</button></form>
    </div>
    <p className="mb-5 text-sm text-zinc-500">Includes historical sales from inactive agents and products. Dates after today are excluded. Goals are current stored targets, not immutable monthly snapshots.</p>
    {periodValue >= currentMonth && <p role="status" className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This range includes incomplete or future months. Sales are counted only through today; assigned goals cover the full month.</p>}
    <section aria-label="Report summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[{ label: "Total sales", value: summary.sales, detail: "Across the 12-month range" },
        { label: "Total premium", value: money(summary.premium), detail: "Recorded premium, not revenue" },
        { label: "Goal achievement", value: summary.achievement === null ? "—" : `${Math.round(summary.achievement)}%`, detail: "Only product/month pairs with positive goals" },
        { label: "Best month", value: summary.best ? monthLabel(summary.best.month) : "—", detail: summary.best ? `${summary.best.sales} sales` : "No sales recorded" }].map(item => <div key={item.label} className={card}><p className="text-sm text-zinc-500">{item.label}</p><p className="mt-2 text-2xl font-semibold">{item.value}</p><p className="mt-1 text-xs text-zinc-500">{item.detail}</p></div>)}
    </section>
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <section className={card}><h2 className="text-lg font-semibold">Sales evolution vs goals</h2><p className="mb-4 text-sm text-zinc-500">Monthly team totals. A missing goal is not a zero target.</p><MonthlyChart months={report.months} /></section>
      <section className={card}><h2 className="text-lg font-semibold">Premium by month</h2><p className="mb-4 text-sm text-zinc-500">Recorded premium across products and agents.</p><MonthlyChart months={report.months} premium /></section>
      <section className={card}><h2 className="mb-4 text-lg font-semibold">Product mix</h2><DistributionChart rows={report.products} total={summary.sales} /></section>
      <section className={card}><h2 className="mb-1 text-lg font-semibold">Agent contribution</h2><p className="mb-4 text-sm text-zinc-500">Top 8 by sales · share of the entire period</p><DistributionChart rows={report.agents.slice(0, 8)} total={summary.sales} color="bg-sky-600" />{report.agents.length > 8 && <p className="mt-4 text-xs text-zinc-500">{report.agents.length - 8} additional agents included in the totals.</p>}</section>
    </div>
    <section className="mt-6"><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><h2 className="text-lg font-semibold">Monthly breakdown</h2><p className="text-sm text-zinc-600">Ending month vs previous: {summary.change === null ? "— (no previous sales)" : `${summary.change > 0 ? "+" : ""}${summary.change.toFixed(1)}%`}</p></div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white"><table className="w-full whitespace-nowrap text-left text-sm"><caption className="sr-only">Exact monthly values for the historical report charts</caption>
        <thead className="bg-zinc-100 text-zinc-600"><tr>{["Month", "Sales", "Goal", "Achievement", "Premium", "Amount", "Details"].map(label => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
        <tbody>{report.months.map(month => <tr key={month.month} className="border-t border-zinc-100"><th scope="row" className="px-4 py-3 font-medium">{monthLabel(month.month)}</th><td className="px-4 py-3">{month.sales}</td><td className="px-4 py-3">{month.goal ?? "—"}</td><td className="px-4 py-3">{month.goal && month.goal > 0 ? `${Math.round(month.goal_sales / month.goal * 100)}%` : "—"}</td><td className="px-4 py-3">{money(month.premium)}</td><td className="px-4 py-3">{money(month.amount)}</td><td className="px-4 py-3"><Link href={`/?period=${month.month}`} className="font-medium text-emerald-800 underline">Dashboard<span className="sr-only"> for {monthLabel(month.month)}</span></Link></td></tr>)}</tbody>
      </table></div>
    </section>
  </>;
}
