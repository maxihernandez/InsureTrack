import "server-only";
import { getDb } from "@/lib/db";
import { reportRange, type ReportMonth, type ReportBreakdown, type ReportRangeMonths } from "@/lib/report-summary";

export async function getHistoricalReport(endMonth: string, rangeMonths: ReportRangeMonths = 12) {
  const range = reportRange(endMonth, rangeMonths);
  const sql = getDb();
  const [months, products, agents] = await Promise.all([
    sql<ReportMonth[]>`
      with months as (
        select month::date from generate_series(${range.start}::timestamp, ${range.end}::timestamp - interval '1 month', interval '1 month') month
      ), production as (
        select date_trunc('month', s.effective_date)::date as month, count(*)::int as sales,
          coalesce(sum(s.premium), 0)::text as premium,
          count(*) filter (where g.target_count > 0)::int as goal_sales
        from policyboard.sales s
        left join policyboard.goals g on g.product_id = s.product_id
          and g.year = extract(year from s.effective_date) and g.month = extract(month from s.effective_date)
        where s.policy_status = 'in_force' and s.effective_date >= ${range.start}::date and s.effective_date < least(${range.end}::date, current_date + 1)
        group by 1
      ), targets as (
        select make_date(year, month, 1) as month, sum(target_count)::int as goal
        from policyboard.goals where make_date(year, month, 1) >= ${range.start}::date
          and make_date(year, month, 1) < ${range.end}::date group by 1
      )
      select to_char(m.month, 'YYYY-MM') as month, coalesce(p.sales, 0)::int as sales,
        coalesce(p.premium, '0') as premium,
        t.goal, coalesce(p.goal_sales, 0)::int as goal_sales
      from months m left join production p on p.month = m.month left join targets t on t.month = m.month order by m.month
    `,
    sql<ReportBreakdown[]>`select p.id, p.name, count(*)::int as sales, coalesce(sum(s.premium), 0)::text as premium
      from policyboard.sales s join policyboard.products p on p.id = s.product_id
      where s.policy_status = 'in_force' and s.effective_date >= ${range.start}::date and s.effective_date < least(${range.end}::date, current_date + 1)
      group by p.id, p.name order by sales desc, p.name, p.id`,
    sql<ReportBreakdown[]>`select u.id, pr.first_name || ' ' || pr.last_name as name,
        count(*)::int as sales, coalesce(sum(s.premium), 0)::text as premium
      from policyboard.sales s join policyboard.users u on u.id = s.user_id join policyboard.profiles pr on pr.user_id = u.id
      where s.policy_status = 'in_force' and s.effective_date >= ${range.start}::date and s.effective_date < least(${range.end}::date, current_date + 1)
      group by u.id, pr.first_name, pr.last_name order by sales desc, name, u.id`,
  ]);
  return { ...range, months, products, agents };
}
