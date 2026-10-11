import "server-only";
import { getDb, withTransaction } from "@/lib/db";
import type { CreateSaleInput, PolicyStatus, PolicyStatusUpdateInput } from "./validation";

export type Agent = { id: string; name: string };
export type Product = { id: string; name: string };
export type RecentSale = {
  id: string;
  name: string;
  product: string;
  sale_date: string;
  premium: string | null;
  policy_number: string | null;
  policy_status: PolicyStatus | "legacy";
  effective_date: string | null;
};

export async function createSale(input: CreateSaleInput) {
  const rows = await getDb()<{ id: string }[]>`
    insert into policyboard.sales (user_id, product_id, policy_number, sale_date, premium, amount, notes)
    select u.id, p.id, ${input.policyNumber}, ${input.saleDate}::date, ${input.premium}, ${input.amount}, ${input.notes}
    from policyboard.users u join policyboard.roles r on r.id = u.role_id cross join policyboard.products p
    where u.id = ${input.agentId} and u.active and r.code = 'agent' and p.id = ${input.productId} and p.active
    returning id`;
  return rows.length > 0;
}

export async function updatePolicyStatus(input: PolicyStatusUpdateInput, managerId: string) {
  return await withTransaction(async sql => {
    const current = await sql<{ policy_status: PolicyStatus | "legacy" }[]>`
      select policy_status from policyboard.sales where id = ${input.saleId} for update`;
    const previous = current[0];
    if (!previous || previous.policy_status === "legacy") return false;
    await sql`
      update policyboard.sales
      set policy_status = ${input.status},
          effective_date = ${input.effectiveDate}::date,
          policy_status_updated_at = now(),
          policy_status_updated_by = ${managerId}
      where id = ${input.saleId}`;
    await sql`
      insert into policyboard.policy_status_history (sale_id, previous_status, next_status, effective_date, changed_by)
      values (${input.saleId}, ${previous.policy_status}, ${input.status}, ${input.effectiveDate}::date, ${managerId})`;
    return true;
  });
}

export async function getProductionPageData(userId: string, isManager: boolean) {
  const sql = getDb();
  const [products, agents, recent] = await Promise.all([
    sql<Product[]>`select id, name from policyboard.products where active order by display_order`,
    isManager ? sql<Agent[]>`select u.id, p.first_name || ' ' || p.last_name as name from policyboard.users u join policyboard.profiles p on p.user_id = u.id join policyboard.roles r on r.id = u.role_id where u.active and r.code = 'agent' order by p.last_name, p.first_name` : Promise.resolve([] as Agent[]),
    isManager ? sql<RecentSale[]>`select s.id, pr.first_name || ' ' || pr.last_name as name, p.name as product, s.sale_date::text, s.premium::text, s.policy_number, s.policy_status, s.effective_date::text from policyboard.sales s join policyboard.profiles pr on pr.user_id = s.user_id join policyboard.products p on p.id = s.product_id order by s.sale_date desc, s.created_at desc limit 10` : sql<RecentSale[]>`select s.id, pr.first_name || ' ' || pr.last_name as name, p.name as product, s.sale_date::text, s.premium::text, s.policy_number, s.policy_status, s.effective_date::text from policyboard.sales s join policyboard.profiles pr on pr.user_id = s.user_id join policyboard.products p on p.id = s.product_id where s.user_id = ${userId} order by s.sale_date desc, s.created_at desc limit 10`,
  ]);
  return { products, agents, recent };
}
