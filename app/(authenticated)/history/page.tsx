import { DashboardView } from "@/app/dashboard-view";
import { connection } from "next/server";

export const instant = false;


export default async function History({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const params = await searchParams;
  await connection();
  const previousMonth = new Date();
  previousMonth.setUTCDate(1);
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1);
  const period = params.period ?? previousMonth.toISOString().slice(0, 7);
  return <DashboardView searchParams={Promise.resolve({ period })} history />;
}
