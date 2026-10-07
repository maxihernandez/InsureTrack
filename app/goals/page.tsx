import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/app/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parsePeriod } from "@/lib/period";
import { isUuid } from "@/lib/validation";

export const instant = false;

type GoalRow = { id: string; goal_id: string | null; name: string; code: string; target_count: number | null; target_amount: string | null };

async function saveGoal(form: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "manager") redirect("/");

  const productId = String(form.get("product_id") ?? "");
  const year = Number(form.get("year"));
  const month = Number(form.get("month"));
  const targetCount = Number(form.get("target_count"));
  const amountText = String(form.get("target_amount") ?? "").trim();
  const amountValid = amountText === "" || /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(amountText);
  const period = `${year}-${String(month).padStart(2, "0")}`;
  if (!isUuid(productId) || !Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(targetCount) || targetCount < 0 || targetCount > 1_000_000 || !amountValid) {
    redirect("/goals?error=invalid");
  }

  const sql = getDb();
  const product = await sql`select id from policyboard.products where id = ${productId} and active`;
  if (!product.length) redirect(`/goals?period=${period}&error=product`);
  await sql`
    insert into policyboard.goals (product_id, year, month, target_count, target_amount)
    values (${productId}, ${year}, ${month}, ${targetCount}, ${amountText === "" ? null : amountText})
    on conflict (product_id, year, month)
    do update set target_count = excluded.target_count, target_amount = excluded.target_amount
  `;
  revalidatePath("/");
  revalidatePath("/goals");
  redirect(`/goals?period=${period}&saved=1`);
}

async function removeGoal(form: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "manager") redirect("/");
  const id = String(form.get("id") ?? "");
  const period = parsePeriod(String(form.get("period") ?? ""));
  if (!isUuid(id)) redirect("/goals?error=invalid");
  await getDb()`delete from policyboard.goals where id = ${id}`;
  revalidatePath("/");
  revalidatePath("/goals");
  redirect(`/goals?period=${period.year}-${String(period.month).padStart(2, "0")}`);
}

export default async function Goals({ searchParams }: { searchParams: Promise<{ period?: string; error?: string; saved?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "manager") redirect("/");
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const periodValue = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const goals = await getDb()<GoalRow[]>`
    select p.id, g.id as goal_id, p.name, p.code, g.target_count, g.target_amount::text
    from policyboard.products p
    left join policyboard.goals g on g.product_id = p.id and g.year = ${period.year} and g.month = ${period.month}
    where p.active
    order by p.display_order
  `;
  return <AppShell user={user} current="goals">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-emerald-700">Planning</p><h1 className="text-2xl font-semibold">Goals</h1><p className="text-sm text-zinc-600">Team targets for {period.label}</p></div>
      <form method="get" className="flex items-end gap-2"><label className="text-sm font-medium">Month<input name="period" type="month" min="2020-01" max="2100-12" defaultValue={periodValue} className="mt-1 block rounded-lg border border-zinc-300 bg-white px-3 py-2" /></label><button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">View</button></form>
    </div>
    {params.error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Check the goal values and product.</p>}
    {params.saved && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Goal saved.</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{goals.map(goal => <article key={goal.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{goal.name}</h2><span className="text-xs text-zinc-500">{goal.code}</span></div>
      <form action={saveGoal} className="space-y-3"><input type="hidden" name="product_id" value={goal.id}/><input type="hidden" name="year" value={period.year}/><input type="hidden" name="month" value={period.month}/>
        <label className="block text-sm">Sales target<input name="target_count" type="number" min="0" max="1000000" step="1" required defaultValue={goal.target_count ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label>
        <label className="block text-sm">Amount target (optional)<input name="target_amount" type="number" min="0" step="0.01" defaultValue={goal.target_amount ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label>
        <button className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">{goal.target_count === null ? "Set goal" : "Update goal"}</button>
      </form>
      {goal.goal_id && <form action={removeGoal} className="mt-2"><input type="hidden" name="id" value={goal.goal_id}/><input type="hidden" name="period" value={periodValue}/><button className="text-sm text-red-700 hover:underline">Remove goal</button></form>}
    </article>)}</div>
  </AppShell>;
}
