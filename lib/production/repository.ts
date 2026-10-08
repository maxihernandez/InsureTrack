import "server-only";
import { getDb } from "@/lib/db";
import type { CreateSaleInput } from "./validation";

export type Agent = { id: string; name: string };
export type Product = { id: string; name: string };
export type RecentSale = { id: string; name: string; product: string; sale_date: string; premium: string | null };

export async function createSale(input: CreateSaleInput) {
  const rows = await getDb()<{ id: string }[]>`
    insert into policyboard.sales (user_id, product_id, sale_date, premium, amount, notes)
    select u.id, p.id, ${input.saleDate}::date, ${input.premium}, ${input.amount}, ${input.notes}
    from policyboard.users u join policyboard.roles r on r.id = u.role_id cross join policyboard.products p
    where u.id = ${input.agentId} and u.active and r.code = 'agent' and p.id = ${input.productId} and p.active
    returning id`;
  return rows.length > 0;
}

export async function getProductionPageData(userId: string, isManager: boolean) {
  const sql = getDb();
  const [products, agents, recent] = await Promise.all([
    sql<Product[]>`select id, name from policyboard.products where active order by display_order`,
    isManager ? sql<Agent[]>`select u.id, p.first_name || ' ' || p.last_name as name from policyboard.users u join policyboard.profiles p on p.user_id = u.id join policyboard.roles r on r.id = u.role_id where u.active and r.code = 'agent' order by p.last_name, p.first_name` : Promise.resolve([] as Agent[]),
    isManager ? sql<RecentSale[]>`select s.id, pr.first_name || ' ' || pr.last_name as name, p.name as product, s.sale_date::text, s.premium::text from policyboard.sales s join policyboard.profiles pr on pr.user_id = s.user_id join policyboard.products p on p.id = s.product_id order by s.sale_date desc, s.created_at desc limit 10` : sql<RecentSale[]>`select s.id, pr.first_name || ' ' || pr.last_name as name, p.name as product, s.sale_date::text, s.premium::text from policyboard.sales s join policyboard.profiles pr on pr.user_id = s.user_id join policyboard.products p on p.id = s.product_id where s.user_id = ${userId} order by s.sale_date desc, s.created_at desc limit 10`,
  ]);
  return { products, agents, recent };
}