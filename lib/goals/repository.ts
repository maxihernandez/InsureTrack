import "server-only";
import { getDb } from "@/lib/db";
import type { SaveAnnualGoalInput, SaveGoalInput } from "./validation";
export type GoalRow = { id: string; goal_id: string | null; name: string; code: string; target_count: number | null };
export type AnnualGoalRow = GoalRow;
export async function saveGoal(input: SaveGoalInput) {
  const sql = getDb();
  const product = await sql`select id from policyboard.products where id = ${input.productId} and active`;
  if (!product.length) return false;
  await sql`insert into policyboard.goals (product_id, year, month, target_count) values (${input.productId}, ${input.year}, ${input.month}, ${input.targetCount}) on conflict (product_id, year, month) do update set target_count = excluded.target_count`;
  return true;
}
export async function removeGoal(id: string) { await getDb()`delete from policyboard.goals where id = ${id}`; }
export function getGoals(year: number, month: number) { return getDb()<GoalRow[]>`select p.id, g.id as goal_id, p.name, p.code, g.target_count from policyboard.products p left join policyboard.goals g on g.product_id = p.id and g.year = ${year} and g.month = ${month} where p.active order by p.display_order`; }
export async function saveAnnualGoal(input: SaveAnnualGoalInput) {
  const sql = getDb();
  const product = await sql`select id from policyboard.products where id = ${input.productId} and active`;
  if (!product.length) return false;
  await sql`insert into policyboard.annual_goals (product_id, year, target_count) values (${input.productId}, ${input.year}, ${input.targetCount}) on conflict (product_id, year) do update set target_count = excluded.target_count, updated_at = now()`;
  return true;
}
export async function removeAnnualGoal(id: string) { await getDb()`delete from policyboard.annual_goals where id = ${id}`; }
export function getAnnualGoals(year: number) { return getDb()<AnnualGoalRow[]>`select p.id, g.id as goal_id, p.name, p.code, g.target_count from policyboard.products p left join policyboard.annual_goals g on g.product_id = p.id and g.year = ${year} where p.active order by p.display_order`; }
