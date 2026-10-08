import "server-only";

import { getDb } from "@/lib/db";

export async function hasConfiguredUsers() {
  const rows = await getDb()<{ configured: boolean }[]>`select exists (select 1 from policyboard.users) as configured`;
  return rows[0]?.configured ?? false;
}