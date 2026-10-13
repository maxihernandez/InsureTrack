"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { updatePolicyStatus } from "@/lib/production/repository";
import { readPolicyStatusUpdate } from "@/lib/production/validation";

export type DashboardPolicyResult = { ok: boolean; message: string };

export async function markDashboardPolicyActive(_previous: DashboardPolicyResult, form: FormData): Promise<DashboardPolicyResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "manager") return { ok: false, message: "Only managers can mark a policy active." };
  const input = readPolicyStatusUpdate(form);
  if (!input || input.status !== "in_force") return { ok: false, message: "An effective date is required." };
  if (!await updatePolicyStatus(input, user.id)) return { ok: false, message: "This policy is no longer available." };
  revalidatePath("/");
  revalidatePath("/production");
  return { ok: true, message: "Policy marked active." };
}
