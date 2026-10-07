import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/app/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isUuid } from "@/lib/validation";

export const instant = false;

type Agent = { id: string; name: string };
type Product = { id: string; name: string };
type RecentSale = { id: string; name: string; product: string; sale_date: string; premium: string | null };

function moneyValue(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(value) ? value : undefined;
}

async function addSale(form: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const productId = String(form.get("product_id") ?? "");
  const agentId = user.role === "manager" ? String(form.get("agent_id") ?? "") : user.id;
  const saleDate = String(form.get("sale_date") ?? "");
  const premium = moneyValue(form.get("premium"));
  const amount = moneyValue(form.get("amount"));
  const notes = String(form.get("notes") ?? "").trim();
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(saleDate) && !Number.isNaN(Date.parse(`${saleDate}T00:00:00Z`)) && new Date(`${saleDate}T00:00:00Z`).toISOString().slice(0, 10) === saleDate;
  if (!isUuid(productId) || !isUuid(agentId) || !dateValid || premium === undefined || amount === undefined || notes.length > 2000) redirect("/production?error=invalid");

  const inserted = await getDb()<{ id: string }[]>`
    insert into policyboard.sales (user_id, product_id, sale_date, premium, amount, notes)
    select u.id, p.id, ${saleDate}::date, ${premium}, ${amount}, ${notes || null}
    from policyboard.users u
    join policyboard.roles r on r.id = u.role_id
    cross join policyboard.products p
    where u.id = ${agentId} and u.active and r.code = 'agent'
      and p.id = ${productId} and p.active
    returning id
  `;
  if (!inserted.length) redirect("/production?error=inactive");
  revalidatePath("/");
  revalidatePath("/production");
  redirect("/production?saved=1");
}

export default async function Production({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const sql = getDb();
  const [products, agents, recent] = await Promise.all([
    sql<Product[]>`select id, name from policyboard.products where active order by display_order`,
    user.role === "manager" ? sql<Agent[]>`select u.id, p.first_name || ' ' || p.last_name as name from policyboard.users u join policyboard.profiles p on p.user_id = u.id join policyboard.roles r on r.id = u.role_id where u.active and r.code = 'agent' order by p.last_name, p.first_name` : Promise.resolve([] as Agent[]),
    user.role === "manager" ? sql<RecentSale[]>`select s.id, pr.first_name || ' ' || pr.last_name as name, p.name as product, s.sale_date::text, s.premium::text from policyboard.sales s join policyboard.profiles pr on pr.user_id = s.user_id join policyboard.products p on p.id = s.product_id order by s.sale_date desc, s.created_at desc limit 10` : sql<RecentSale[]>`select s.id, pr.first_name || ' ' || pr.last_name as name, p.name as product, s.sale_date::text, s.premium::text from policyboard.sales s join policyboard.profiles pr on pr.user_id = s.user_id join policyboard.products p on p.id = s.product_id where s.user_id = ${user.id} order by s.sale_date desc, s.created_at desc limit 10`,
  ]);
  const canSubmit = products.length > 0 && (user.role !== "manager" || agents.length > 0);
  return <AppShell user={user} current="production">
    <div className="mb-6"><p className="text-sm font-medium text-emerald-700">Production</p><h1 className="text-2xl font-semibold">Add a sale</h1><p className="text-sm text-zinc-600">Each saved sale counts as one marker toward its product goal.</p></div>
    {params.error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error === "inactive" ? "Select an active agent and product." : "Check the date and amounts."}</p>}
    {params.saved && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Production saved.</p>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
      <form action={addSale} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        {user.role === "manager" && <label className="block text-sm font-medium">Agent<select name="agent_id" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"><option value="">Select agent</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
        <label className="block text-sm font-medium">Product<select name="product_id" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"><option value="">Select product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="block text-sm font-medium">Sale date<input name="sale_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Premium<input name="premium" type="number" min="0" step="0.01" placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label><label className="block text-sm font-medium">Amount<input name="amount" type="number" min="0" step="0.01" placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label></div>
        <label className="block text-sm font-medium">Notes<textarea name="notes" maxLength={2000} rows={3} placeholder="Optional" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" /></label>
        <button disabled={!canSubmit} className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">Save production</button>
        {!canSubmit && <p className="text-sm text-zinc-600">An active product and agent are required.</p>}
      </form>
      <section><h2 className="mb-3 text-lg font-semibold">Recent production</h2><div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{recent.length ? recent.map(s => <div key={s.id} className="flex justify-between gap-3 border-b border-zinc-100 p-4 last:border-0"><div><p className="font-medium">{s.product}</p><p className="text-sm text-zinc-600">{s.name} · {s.sale_date}</p></div><p className="text-sm text-zinc-600">{s.premium === null ? "—" : `$${Number(s.premium).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</p></div>) : <p className="p-4 text-sm text-zinc-600">No production recorded yet.</p>}</div></section>
    </div>
  </AppShell>;
}
