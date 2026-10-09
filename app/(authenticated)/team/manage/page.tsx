import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getManagedAgents } from "@/lib/agents/repository";
import { resetAgentPassword, setAgentStatus, setAgentManagerAccess, updateAgent } from "./actions";
import { SubmitButton } from "./submit-button";
import { ProfileFields } from "./profile-fields";
import { CreateAgentStepper } from "./create-agent-stepper";

export const instant = false;

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
  const { agents, reserved } = await getManagedAgents();
  return <>
    <Link href="/team" className="text-sm font-medium text-emerald-800">← Team</Link>
    <div className="mb-6 mt-3"><h1 className="text-2xl font-semibold">Manage agents</h1>
      <p className="mt-1 text-sm text-zinc-600">Manager only. Agent credentials belong to PolicyBoard, not Supabase Auth.</p></div>
    {params.error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errors[params.error] ?? errors.save}</p>}
    {params.saved && <p role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{messages[params.saved] ?? "Changes saved."}</p>}
    <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Create agent</h2>
      <CreateAgentStepper key={reserved.length} reservedUsernames={reserved.map(row => row.username)} />
    </section>
    <section><h2 className="mb-3 text-lg font-semibold">Agents ({agents.length})</h2>
      {!agents.length && <p className="rounded-xl border bg-white p-5 text-sm text-zinc-600">No agents yet. Create the first agent above.</p>}
      <div className="space-y-3">{agents.map(agent => <details key={`${agent.id}:${agent.username}:${agent.email}:${agent.active}:${agent.manager_access}:${agent.first_name}:${agent.last_name}`} className="group rounded-xl border border-zinc-200 bg-white">
        <summary className="cursor-pointer list-none p-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-700">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="font-semibold">{agent.first_name} {agent.last_name}</h3><p className="break-all text-sm text-zinc-600">{agent.email}</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${agent.active ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-600"}`}>{agent.active ? "Active" : "Inactive"}</span><span aria-hidden="true" className="text-lg leading-none text-zinc-500 transition-transform group-open:rotate-180">⌄</span>
        </div>
        <p className="mt-2 text-sm font-medium text-emerald-800">{agent.manager_access ? "Agent + Manager" : "Agent"}</p>
        </summary>
        <div className="border-t border-zinc-100 p-4 pt-4">
        <p className={`text-sm ${agent.username ? "text-zinc-600" : "text-amber-800"}`}>{agent.username ? `Username: ${agent.username}` : "Assign a username in Profile details to enable sign-in."}</p>
        <div className="mt-4 flex flex-wrap gap-4"><Link href={`/team/${agent.id}`} className="text-sm font-medium text-emerald-800">View production</Link></div>
        {agent.id !== user.id ? <details className="mt-4 border-t border-zinc-100 pt-4"><summary className="cursor-pointer text-sm font-medium">Access & permissions</summary>
          <form action={setAgentManagerAccess} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={agent.id} /><input type="hidden" name="access" value={agent.manager_access ? "disabled" : "enabled"} />
            <p className="text-sm text-zinc-600">Full manager permissions: goals, team production and administration of other agents. This account remains an agent in production and ranking.</p>
            <label className="flex items-start gap-2 text-sm text-zinc-600"><input name="confirm" type="checkbox" value="yes" required className="mt-1" />I confirm changing manager permissions and signing out this agent on all devices.</label>
            {!agent.active && !agent.manager_access && <p className="text-sm text-amber-800">Activate this agent before enabling manager access.</p>}
            <SubmitButton danger={agent.manager_access} disabled={!agent.active && !agent.manager_access}>{agent.manager_access ? "Remove manager access" : "Enable manager access"}</SubmitButton>
          </form>
        </details> : <p className="mt-3 text-sm text-zinc-500">Another manager must change your manager access.</p>}
        <details className="mt-4 border-t border-zinc-100 pt-4"><summary className="cursor-pointer text-sm font-medium">Profile details</summary>
          <form action={updateAgent} className="mt-4 space-y-4"><input type="hidden" name="id" value={agent.id} /><ProfileFields agent={agent} /><SubmitButton>Save profile</SubmitButton></form>
        </details>
        <details className="mt-4 border-t border-zinc-100 pt-4"><summary className="cursor-pointer text-sm font-medium">Password & sessions</summary>
          <form action={resetAgentPassword} className="mt-4 space-y-4"><input type="hidden" name="id" value={agent.id} /><PasswordFields />
            <label className="flex items-start gap-2 text-sm text-zinc-600"><input name="confirm" type="checkbox" value="yes" required className="mt-1" />I confirm replacing the password and signing out this agent on all devices.</label>
            <SubmitButton>Reset password</SubmitButton>
          </form>
        </details>
        <form action={setAgentStatus} className="mt-4 space-y-3 border-t border-zinc-100 pt-4" aria-label="Account status">
          <input type="hidden" name="id" value={agent.id} /><input type="hidden" name="status" value={agent.active ? "inactive" : "active"} />
          {agent.active && <label className="flex items-start gap-2 text-sm text-zinc-600"><input name="confirm" type="checkbox" value="yes" required className="mt-1" />I confirm disabling access and revoking existing sessions. Historical sales will not be deleted.</label>}
          <SubmitButton danger={agent.active}>{agent.active ? "Deactivate agent" : "Activate agent"}</SubmitButton>
        </form>
        </div>
      </details>)}</div>
    </section>
  </>;
}
