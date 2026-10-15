import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOperationalBoard } from "@/lib/operational-board/repository";
import { parsePeriod } from "@/lib/period";
import { MonthPicker } from "@/app/month-picker";
import { OperationalBoard } from "@/app/operational-board";

export const instant = false;

export default async function Board({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { period: rawPeriod } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const periodValue = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const { products, pins } = await getOperationalBoard(period, user.id, user.role === "manager");
  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-emerald-700">Team performance</p><h1 className="text-2xl font-semibold">Board</h1><p className="text-sm text-zinc-600">A visual operational view based on existing production data.</p></div><MonthPicker value={periodValue} /></div>
    <OperationalBoard products={products} pins={pins} periodLabel={period.label} isManager={user.role === "manager"} />
  </>;
}
