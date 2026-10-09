"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { executeCreateSale } from "@/lib/production/create-sale";
import { readCreateSale } from "@/lib/production/validation";
export async function addSale(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const agentId = user.role === "manager" ? String(form.get("agent_id") ?? "") : user.id;
  const input = readCreateSale(form, agentId);
  if (!input) redirect("/production?error=invalid");
  if (await executeCreateSale(user, input) !== "saved") redirect("/production?error=inactive");
  revalidatePath("/"); revalidatePath("/production");
  redirect("/production?saved=1");
}
export type DashboardSaleResult = { ok: true } | { ok: false; message: string };

export async function addSaleFromDashboard(form: FormData): Promise<DashboardSaleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired. Sign in again." };
  const agentId = user.role === "manager" ? String(form.get("agent_id") ?? "") : user.id;
  const input = readCreateSale(form, agentId);
  if (!input) return { ok: false, message: "Check the required sale details." };
  if (await executeCreateSale(user, input) !== "saved") return { ok: false, message: "The selected agent or product is no longer active." };
  revalidatePath("/");
  revalidatePath("/production");
  return { ok: true };
}