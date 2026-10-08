import "server-only";
import { getDb } from "@/lib/db";
export type ManagedAgent = { id: string; email: string | null; username: string | null; active: boolean; manager_access: boolean; first_name: string; last_name: string };
export async function getManagedAgents() {
  const sql = getDb();
  const [agents, reserved] = await Promise.all([
    sql<ManagedAgent[]>`select u.id, u.email, u.username, u.active, u.manager_access, p.first_name, p.last_name from policyboard.users u join policyboard.roles r on r.id = u.role_id join policyboard.profiles p on p.user_id = u.id where r.code = 'agent' order by u.active desc, p.first_name, p.last_name, u.id`,
    sql<{ username: string }[]>`select lower(username) as username from policyboard.users where username is not null`,
  ]);
  return { agents, reserved };
}