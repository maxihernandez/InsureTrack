import { isUuid } from "@/lib/validation";

export type CreateSaleInput = { productId: string; agentId: string; saleDate: string; premium: string | null; amount: string | null; notes: string | null };

function moneyValue(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(value) ? value : undefined;
}

export function readCreateSale(form: FormData, agentId: string): CreateSaleInput | null {
  const productId = String(form.get("product_id") ?? "");
  const saleDate = String(form.get("sale_date") ?? "");
  const premium = moneyValue(form.get("premium"));
  const amount = moneyValue(form.get("amount"));
  const notes = String(form.get("notes") ?? "").trim();
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(saleDate) && !Number.isNaN(Date.parse(`${saleDate}T00:00:00Z`)) && new Date(`${saleDate}T00:00:00Z`).toISOString().slice(0, 10) === saleDate;
  if (!isUuid(productId) || !isUuid(agentId) || !dateValid || premium === undefined || amount === undefined || notes.length > 2000) return null;
  return { productId, agentId, saleDate, premium, amount, notes: notes || null };
}