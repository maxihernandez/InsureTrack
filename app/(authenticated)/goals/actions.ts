"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { executeRemoveGoal, executeSaveGoal } from "@/lib/goals/use-cases";
import { readSaveGoal } from "@/lib/goals/validation";
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