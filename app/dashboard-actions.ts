"use server";

import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export type DashboardLayoutInput = {
  productOrder: string[];
  hiddenProductIds: string[];
};

export type DashboardLayoutResult = { ok: true } | { ok: false; message: string };

function isIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 100 && value.every(item => typeof item === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item));
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export async function saveDashboardLayout(input: DashboardLayoutInput): Promise<DashboardLayoutResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired. Sign in again." };
  if (!input || !isIdList(input.productOrder) || !isIdList(input.hiddenProductIds)) return { ok: false, message: "The dashboard layout is invalid." };

  try {
    const sql = getDb();
    const rows = await sql<{ id: string }[]>`select id from policyboard.products`;
    const allowed = new Set(rows.map(row => row.id));
    const productOrder = unique(input.productOrder).filter(id => allowed.has(id));
    const hiddenProductIds = unique(input.hiddenProductIds).filter(id => allowed.has(id));

    await sql`
      insert into policyboard.dashboard_preferences (user_id, product_order, hidden_product_ids)
      values (${user.id}, ${productOrder}::uuid[], ${hiddenProductIds}::uuid[])
      on conflict (user_id) do update
      set product_order = excluded.product_order,
          hidden_product_ids = excluded.hidden_product_ids,
          updated_at = now()
    `;
    return { ok: true };
  } catch {
    return { ok: false, message: "Your dashboard layout could not be saved. Try again." };
  }
}
