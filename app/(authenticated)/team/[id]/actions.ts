"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { updatePolicyStatus } from "@/lib/production/repository";
import { readPolicyStatusUpdate } from "@/lib/production/validation";
import { isUuid } from "@/lib/validation";

export async function markPolicyActive(form: FormData) {
  const user = await getCurrentUser();
  const agentId = String(form.get("agent_id") ?? "");
  const period = String(form.get("period") ?? "");
  if (!user) redirect("/login");
  if (user.role !== "manager" || !isUuid(agentId)) redirect("/");
  const input = readPolicyStatusUpdate(form);
  if (!input || input.status !== "in_force") redirect(`/team/${agentId}?period=${period}&policy_error=invalid`);
  if (!await updatePolicyStatus(input, user.id)) redirect(`/team/${agentId}?period=${period}&policy_error=unavailable`);
  revalidatePath("/");
  revalidatePath("/production");
  revalidatePath(`/team/${agentId}`);
  redirect(`/team/${agentId}?period=${period}&policy_updated=1`);
}
