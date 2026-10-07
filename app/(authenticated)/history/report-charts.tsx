import { monthLabel, type ReportMonth, type ReportBreakdown } from "@/lib/report-summary";

const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export function MonthlyChart({ months, premium = false }: { months: ReportMonth[]; premium?: boolean }) {
  const values = months.map(month => premium ? Number(month.premium) : month.sales);
  const max = Math.max(1, ...values, ...(premium ? [] : months.map(month => month.goal ?? 0)));
  const x = (index: number) => 58 + index * (594 / Math.max(months.length - 1, 1));
  const y = (value: number) => 200 - value / max * 164;
  return <div className="overflow-x-auto">
    <svg viewBox="0 0 710 248" className="w-full min-w-[28rem]" role="img" aria-label={premium ? "Monthly premium bar chart" : "Monthly sales and goals line chart"}>
      <desc>Exact values are available in the monthly breakdown table below. Missing goals are not plotted.</desc>
      {[0, 1, 2, 3, 4].map(tick => <g key={tick}><line x1="58" x2="670" y1={y(max * tick / 4)} y2={y(max * tick / 4)} stroke="#e4e4e7" /><text x="49" y={y(max * tick / 4) + 4} textAnchor="end" fontSize="11" fill="#71717a">{premium ? "$" : ""}{compact(max * tick / 4)}</text></g>)}
      {!premium && <polyline points={values.map((value, index) => `${x(index)},${y(value)}`).join(" ")} fill="none" stroke="#047857" strokeWidth="3" />}
      {months.map((month, index) => <g key={month.month}>
        <text x={x(index)} y="226" textAnchor="middle" fontSize="10" fill="#71717a">{monthLabel(month.month)}</text>
        {premium ? <rect x={x(index) - 15} y={y(values[index])} width="30" height={200 - y(values[index])} rx="3" fill="#059669"><title>{`${monthLabel(month.month)}: $${values[index].toFixed(2)}`}</title></rect>
          : <><circle cx={x(index)} cy={y(month.sales)} r="4" fill="#047857"><title>{`${monthLabel(month.month)}: ${month.sales} sales`}</title></circle>
            {month.goal !== null && <circle cx={x(index)} cy={y(month.goal)} r="4" fill="#a16207"><title>{`Goal: ${month.goal}`}</title></circle>}
            {index > 0 && month.goal !== null && months[index - 1].goal !== null && <line x1={x(index - 1)} x2={x(index)} y1={y(months[index - 1].goal!)} y2={y(month.goal)} stroke="#a16207" strokeWidth="2" strokeDasharray="5 4" />}
          </>}
      </g>)}
    </svg>
    {!premium && <p className="flex gap-4 text-xs text-zinc-600"><span>● <span className="text-emerald-800">Sales</span></span><span>● <span className="text-yellow-800">Goal (when assigned)</span></span></p>}
  </div>;
}

export function DistributionChart({ rows, total, color = "bg-emerald-600" }: { rows: ReportBreakdown[]; total: number; color?: string }) {
  if (!rows.length) return <p className="py-8 text-sm text-zinc-500">No production in this period.</p>;
  return <div className="space-y-4">{rows.map(row => <div key={row.id}>
    <div className="mb-1 flex justify-between gap-3 text-sm"><span className="min-w-0 break-words font-medium">{row.name}</span><span className="shrink-0 text-zinc-600">{row.sales} · {total ? Math.round(row.sales / total * 100) : 0}%</span></div>
    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-zinc-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${total ? Math.min(row.sales / total * 100, 100) : 0}%` }} /></div>
  </div>)}</div>;
}
