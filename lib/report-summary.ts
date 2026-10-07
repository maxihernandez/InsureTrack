export type ReportMonth = {
  month: string; sales: number; premium: string; amount: string; goal: number | null; goal_sales: number;
};
export type ReportBreakdown = { id: string; name: string; sales: number; premium: string };

export function reportRange(endMonth: string) {
  const date = new Date(`${endMonth}-01T00:00:00Z`);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 11, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
  return { start, end };
}

export function monthLabel(month: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
}

export function reportSummary(months: ReportMonth[]) {
  const sales = months.reduce((sum, month) => sum + month.sales, 0);
  const premium = months.reduce((sum, month) => sum + Number(month.premium), 0);
  const goal = months.reduce((sum, month) => sum + (month.goal ?? 0), 0);
  const goalSales = months.reduce((sum, month) => sum + month.goal_sales, 0);
  const best = months.reduce<ReportMonth | null>((best, month) => month.sales > (best?.sales ?? 0) ? month : best, null);
  const last = months.at(-1);
  const previous = months.at(-2);
  return { sales, premium, achievement: goal > 0 ? goalSales / goal * 100 : null, best,
    change: previous && previous.sales > 0 && last ? (last.sales - previous.sales) / previous.sales * 100 : null };
}
