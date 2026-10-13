"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { executeRemoveAnnualGoal, executeRemoveGoal, executeSaveAnnualGoal, executeSaveGoal } from "@/lib/goals/use-cases";
import { readSaveAnnualGoal, readSaveGoal } from "@/lib/goals/validation";
import { parsePeriod } from "@/lib/period";
const periodValue = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;
async function requireManager() { const user = await getCurrentUser(); if (!user) redirect("/login"); if (user.role !== "manager") redirect("/"); return user; }
export async function saveGoal(form: FormData) {
  const user = await requireManager(); const input = readSaveGoal(form); if (!input) redirect("/goals?error=invalid");
  const result = await executeSaveGoal(user, input); const period = periodValue(input.year, input.month);
  if (result === "missing-product") redirect(`/goals?period=${period}&error=product`);
  revalidatePath("/"); revalidatePath("/goals"); redirect(`/goals?period=${period}&saved=1`);
}
export async function removeGoal(form: FormData) {
  const user = await requireManager(); const period = parsePeriod(String(form.get("period") ?? ""));
  if (!await executeRemoveGoal(user, String(form.get("id") ?? ""))) redirect("/goals?error=invalid");
  revalidatePath("/"); revalidatePath("/goals"); redirect(`/goals?period=${periodValue(period.year, period.month)}`);
}
export async function saveAnnualGoal(form: FormData) {
  const user = await requireManager(); const input = readSaveAnnualGoal(form); if (!input) redirect("/goals?error=invalid");
  const result = await executeSaveAnnualGoal(user, input);
  if (result === "missing-product") redirect(`/goals?error=product`);
  revalidatePath("/"); revalidatePath("/goals"); redirect(`/goals?saved=1`);
}
export async function removeAnnualGoal(form: FormData) {
  const user = await requireManager();
  if (!await executeRemoveAnnualGoal(user, String(form.get("id") ?? ""))) redirect("/goals?error=invalid");
  revalidatePath("/"); revalidatePath("/goals"); redirect("/goals");
}
export async function addProduct(form: FormData) {
  await requireManager();
  const name = String(form.get("name") ?? "").trim();
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  const category = String(form.get("category") ?? "Other");
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .&'/-]{1,59}$/u.test(name) || !/^[A-Z0-9]{2,12}$/.test(code) || !["Vehicle", "Property", "Business", "Personal", "Other"].includes(category)) redirect("/goals?error=product");
  const sql = (await import("@/lib/db")).getDb();
  const [{ next_order }] = await sql<{ next_order: number }[]>`select coalesce(max(display_order), 0)::int + 1 as next_order from policyboard.products`;
  try { await sql`insert into policyboard.products (name, code, category, display_order) values (${name}, ${code}, ${category}, ${next_order})`; }
  catch { redirect("/goals?error=product"); }
  revalidatePath("/"); revalidatePath("/goals"); redirect("/goals?saved=1");
}
