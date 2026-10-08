import { isUuid } from "@/lib/validation";

export type SaveGoalInput = { productId: string; year: number; month: number; targetCount: number; targetAmount: string | null };

export function readSaveGoal(form: FormData): SaveGoalInput | null {
  const productId = String(form.get("product_id") ?? "");
  const year = Number(form.get("year"));
  const month = Number(form.get("month"));
  const targetCount = Number(form.get("target_count"));
  const amountText = String(form.get("target_amount") ?? "").trim();
  const amountValid = amountText === "" || /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(amountText);
  if (!isUuid(productId) || !Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(targetCount) || targetCount < 0 || targetCount > 1_000_000 || !amountValid) return null;
  return { productId, year, month, targetCount, targetAmount: amountText || null };
}