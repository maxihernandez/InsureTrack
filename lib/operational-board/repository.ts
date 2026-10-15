import "server-only";

import { getDb } from "@/lib/db";
import type { Period } from "@/lib/period";

export type BoardProduct = {
  id: string;
  name: string;
  code: string;
  target_count: number | null;
  mtd_count: number;
  ytd_count: number;
};

export type BoardPin = {
  id: string;
  product_id: string;
  policy_number: string | null;
  policy_status: "recorded" | "issued" | "in_force" | "not_issued" | "cancelled" | "legacy";
  sale_date: string;
  agent_id: string;
  first_name: string;
  last_name: string;
  pin_color: number;
};

export async function getOperationalBoard(period: Period, userId: string, isManager: boolean) {
  const sql = getDb();
  const yearStart = `${period.year}-01-01`;
  const [products, pins] = await Promise.all([
    sql<BoardProduct[]>`
      with monthly as (
        select product_id, count(*)::int as sale_count
        from policyboard.sales
        where sale_date >= ${period.start}::date and sale_date < least(${period.end}::date, current_date + 1)
          and (${isManager} or user_id = ${userId})
        group by product_id
      ), yearly as (
        select product_id, count(*)::int as sale_count
        from policyboard.sales
        where sale_date >= ${yearStart}::date and sale_date < least(${period.end}::date, current_date + 1)
          and (${isManager} or user_id = ${userId})
        group by product_id
      )
      select p.id, p.name, p.code, g.target_count,
        coalesce(m.sale_count, 0)::int as mtd_count,
        coalesce(y.sale_count, 0)::int as ytd_count
      from policyboard.products p
      left join policyboard.goals g on g.product_id = p.id and g.year = ${period.year} and g.month = ${period.month}
      left join monthly m on m.product_id = p.id
      left join yearly y on y.product_id = p.id
      where p.active or m.product_id is not null or y.product_id is not null
      order by p.display_order
    `,
    sql<BoardPin[]>`
      select s.id, s.product_id, s.policy_number, s.policy_status, s.sale_date::text,
        u.id as agent_id, pr.first_name, pr.last_name, pr.pin_color
      from policyboard.sales s
      join policyboard.users u on u.id = s.user_id
      join policyboard.profiles pr on pr.user_id = u.id
      where s.sale_date >= ${period.start}::date
        and s.sale_date < least(${period.end}::date, current_date + 1)
        and (${isManager} or s.user_id = ${userId})
      order by s.sale_date, s.created_at
    `,
  ]);
  return { products, pins };
}
