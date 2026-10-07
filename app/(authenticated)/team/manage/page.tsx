import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createAgent, resetAgentPassword, setAgentStatus, setAgentManagerAccess, updateAgent } from "./actions";
import { SubmitButton } from "./submit-button";

export const instant = false;

type Agent = { id: string; email: string; username: string | null; active: boolean; manager_access: boolean; first_name: string; last_name: string };
const inputClass = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2";
const errors: Record<string, string> = {
  invalid: "Complete all fields correctly. Username: 3–32 letters, digits, dots, underscores or hyphens, starting with a letter/digit. Passwords must match and contain 12–128 characters.",
  duplicate: "That username or email is already registered. Use another or edit the existing agent.",
  missing: "The agent is unavailable or you no longer have permission. Activate the agent before enabling manager access, then refresh the page.",
  save: "The changes could not be saved. Please try again.",
};
const messages: Record<string, string> = {
  created: "Agent created. They can sign in and are available in Production.",
  updated: "Agent updated. Changing the username or email signs them out.",
  activated: "Agent activated and available in Production.",
  deactivated: "Agent deactivated and sessions revoked. Historical sales are preserved.",
  password: "Password updated, login lock cleared and existing sessions revoked.",
  "manager-enabled": "Manager access enabled. The agent must sign in again; production and ranking are preserved.",
  "manager-disabled": "Manager access removed and sessions revoked. Agent access is preserved.",
};

function ProfileFields({ agent }: { agent?: Agent }) {
  return <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm font-medium">First name<input name="first_name" required maxLength={100} autoComplete="given-name" defaultValue={agent?.first_name} className={inputClass} /></label>
    <label className="text-sm font-medium">Last name<input name="last_name" required maxLength={100} autoComplete="family-name" defaultValue={agent?.last_name} className={inputClass} /></label>
    {agent ? <label className="text-sm font-medium sm:col-span-2">Username<input name="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9._\-]{2,31}" autoComplete="off" autoCapitalize="none" spellCheck={false} defaultValue={agent.username ?? ""} className={inputClass} /><span className="mt-1 block text-xs font-normal text-zinc-500">3–32 characters. Letters, digits, dots, underscores or hyphens. Case-insensitive.</span></label> : <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 sm:col-span-2">Username is generated automatically: first initial + full last name, without spaces or accents. If taken, a number is added: mhernandez, mhernandez1, mhernandez2. The assigned username appears in the agent list after saving.</p>}
    <label className="text-sm font-medium sm:col-span-2">Email<input name="email" type="email" required maxLength={254} autoComplete="off" defaultValue={agent?.email} className={inputClass} /></label>
  </div>;
}

function PasswordFields() {
  return <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm font-medium">Password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={inputClass} /></label>
    <label className="text-sm font-medium">Confirm password<input name="password_confirmation" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={inputClass} /></label>
  </div>;
}

export default async function ManageAgents({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "manager") redirect("/team");
  const params = await searchParams;
  const agents = await getDb()<Agent[]>`select u.id, u.email, u.username, u.active, u.manager_access, p.first_name, p.last_name
    from policyboard.users u join policyboard.roles r on r.id = u.role_id
    join policyboard.profiles p on p.user_id = u.id where r.code = 'agent'
    order by u.active desc, p.first_name, p.last_name, u.id`;
  return <>
    <Link href="/team" className="text-sm font-medium text-emerald-800">← Team</Link>
    <div className="mb-6 mt-3"><h1 className="text-2xl font-semibold">Manage agents</h1>
      <p className="mt-1 text-sm text-zinc-600">Manager only. Agent credentials belong to PolicyBoard, not Supabase Auth.</p></div>
    {params.error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errors[params.error] ?? errors.save}</p>}
    {params.saved && <p role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{messages[params.saved] ?? "Changes saved."}</p>}
    <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Create agent</h2>
      <form action={createAgent} className="space-y-4">
        <ProfileFields /><PasswordFields />
        <p className="text-sm text-zinc-600">12–128 characters. Share credentials through a secure channel. The password is never displayed after saving.</p>
        <SubmitButton>Create agent</SubmitButton>
      </form>
    </section>
    <section><h2 className="mb-3 text-lg font-semibold">Agents ({agents.length})</h2>
      {!agents.length && <p className="rounded-xl border bg-white p-5 text-sm text-zinc-600">No agents yet. Create the first agent above.</p>}
      <div className="space-y-4">{agents.map(agent => <article key={`${agent.id}:${agent.username}:${agent.email}:${agent.active}:${agent.manager_access}:${agent.first_name}:${agent.last_name}`} className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="font-semibold">{agent.first_name} {agent.last_name}</h3><p className="break-all text-sm text-zinc-600">{agent.email}</p><p className={`text-sm ${agent.username ? "text-zinc-600" : "text-amber-800"}`}>{agent.username ? `Username: ${agent.username}` : "Assign a username in Edit profile to enable sign-in."}</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${agent.active ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-600"}`}>{agent.active ? "Active" : "Inactive"}</span>
        </div>
        <p className="mt-2 text-sm font-medium text-emerald-800">{agent.manager_access ? "Agent + Manager" : "Agent"}</p>
        <div className="mt-4 flex flex-wrap gap-4"><Link href={`/team/${agent.id}`} className="text-sm font-medium text-emerald-800">View production</Link></div>
        {agent.id !== user.id ? <details className="mt-4 border-t border-zinc-100 pt-4"><summary className="cursor-pointer text-sm font-medium">Manager access</summary>
          <form action={setAgentManagerAccess} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={agent.id} /><input type="hidden" name="access" value={agent.manager_access ? "disabled" : "enabled"} />
            <p className="text-sm text-zinc-600">Full manager permissions: goals, team production and administration of other agents. This account remains an agent in production and ranking.</p>
            <label className="flex items-start gap-2 text-sm text-zinc-600"><input name="confirm" type="checkbox" value="yes" required className="mt-1" />I confirm changing manager permissions and signing out this agent on all devices.</label>
            {!agent.active && !agent.manager_access && <p className="text-sm text-amber-800">Activate this agent before enabling manager access.</p>}
            <SubmitButton danger={agent.manager_access} disabled={!agent.active && !agent.manager_access}>{agent.manager_access ? "Remove manager access" : "Enable manager access"}</SubmitButton>
          </form>
        </details> : <p className="mt-3 text-sm text-zinc-500">Another manager must change your manager access.</p>}
        <details className="mt-4 border-t border-zinc-100 pt-4"><summary className="cursor-pointer text-sm font-medium">Edit profile</summary>
          <form action={updateAgent} className="mt-4 space-y-4"><input type="hidden" name="id" value={agent.id} /><ProfileFields agent={agent} /><SubmitButton>Save profile</SubmitButton></form>
        </details>
        <details className="mt-4 border-t border-zinc-100 pt-4"><summary className="cursor-pointer text-sm font-medium">Reset password</summary>
          <form action={resetAgentPassword} className="mt-4 space-y-4"><input type="hidden" name="id" value={agent.id} /><PasswordFields />
            <label className="flex items-start gap-2 text-sm text-zinc-600"><input name="confirm" type="checkbox" value="yes" required className="mt-1" />I confirm replacing the password and signing out this agent on all devices.</label>
            <SubmitButton>Reset password</SubmitButton>
          </form>
        </details>
        <form action={setAgentStatus} className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          <input type="hidden" name="id" value={agent.id} /><input type="hidden" name="status" value={agent.active ? "inactive" : "active"} />
          {agent.active && <label className="flex items-start gap-2 text-sm text-zinc-600"><input name="confirm" type="checkbox" value="yes" required className="mt-1" />I confirm disabling access and revoking existing sessions. Historical sales will not be deleted.</label>}
          <SubmitButton danger={agent.active}>{agent.active ? "Deactivate agent" : "Activate agent"}</SubmitButton>
        </form>
      </article>)}</div>
    </section>
  </>;
}
