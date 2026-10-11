import { isUuid } from "@/lib/validation";

export const policyStatuses = ["recorded", "issued", "in_force", "not_issued", "cancelled"] as const;
export type PolicyStatus = (typeof policyStatuses)[number];

export type CreateSaleInput = {
  productId: string;
  agentId: string;
  policyNumber: string;
  saleDate: string;
  premium: string | null;
  amount: string | null;
  notes: string | null;
};

export type PolicyStatusUpdateInput = {
  saleId: string;
  status: PolicyStatus;
  effectiveDate: string | null;
};

function moneyValue(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(value) ? value : undefined;
}

function isoDate(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  return valid ? value : undefined;
}

function policyNumberValue(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  return value.length >= 1 && value.length <= 100 ? value : undefined;
}

export function readCreateSale(form: FormData, agentId: string): CreateSaleInput | null {
  const productId = String(form.get("product_id") ?? "");
  const policyNumber = policyNumberValue(form.get("policy_number"));
  const saleDate = isoDate(form.get("sale_date"));
  const premium = moneyValue(form.get("premium"));
  const amount = moneyValue(form.get("amount"));
  const notes = String(form.get("notes") ?? "").trim();
  if (!isUuid(productId) || !isUuid(agentId) || policyNumber === undefined || saleDate === undefined || saleDate === null || premium === undefined || amount === undefined || notes.length > 2000) return null;
  return { productId, agentId, policyNumber, saleDate, premium, amount, notes: notes || null };
}

export function readPolicyStatusUpdate(form: FormData): PolicyStatusUpdateInput | null {
  const saleId = String(form.get("sale_id") ?? "");
  const status = String(form.get("policy_status") ?? "");
  const effectiveDate = isoDate(form.get("effective_date"));
  if (!isUuid(saleId) || !policyStatuses.includes(status as PolicyStatus) || effectiveDate === undefined || (status === "in_force" && effectiveDate === null)) return null;
  return { saleId, status: status as PolicyStatus, effectiveDate: status === "in_force" ? effectiveDate : null };
}
