"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { withTransaction } from "@/lib/db";
import { isUuid } from "@/lib/validation";
import { readAgentPassword, readAgentProfile } from "@/lib/agent-validation";

const path = "/team/manage";

async function requireManager() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "manager") redirect("/team");
}

function fail(error: unknown): never {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  const reason = code === "23505" ? "duplicate" : error instanceof Error && error.message === "agent-not-found" ? "missing" : "save";
  // Never expose SQL errors, parameters or password hashes to the client/logs.
  redirect(`${path}?error=${reason}`);
}

function finish(message: string) {
  revalidatePath(path);
  revalidatePath("/team");
  revalidatePath("/team/[id]", "page");
  revalidatePath("/production");
  revalidatePath("/");
  redirect(`${path}?saved=${message}`);
}

export async function createAgent(form: FormData) {
  await requireManager();
  const profile = readAgentProfile(form);
  const password = readAgentPassword(form);
  if (!profile || !password) redirect(`${path}?error=invalid`);
  try {
    const hash = await hashPassword(password);
    await withTransaction(async tx => {
      const rows = await tx<{ id: string }[]>`
        insert into policyboard.users (email, username, role_id, password_hash, password_updated_at, must_change_password, active)
        select ${profile.email}, ${profile.username}, id, ${hash}, now(), false, true from policyboard.roles where code = 'agent'
        returning id
      `;
      if (!rows[0]) throw new Error("agent-role-missing");
      await tx`insert into policyboard.profiles (user_id, first_name, last_name)
        values (${rows[0].id}, ${profile.firstName}, ${profile.lastName})`;
    });
  } catch (error) { fail(error); }
  finish("created");
}

export async function updateAgent(form: FormData) {
  await requireManager();
  const id = String(form.get("id") ?? "");
  const profile = readAgentProfile(form);
  if (!isUuid(id) || !profile) redirect(`${path}?error=invalid`);
  try {
    await withTransaction(async tx => {
      const rows = await tx<{ email: string; username: string | null }[]>`
        select u.email, u.username from policyboard.users u join policyboard.roles r on r.id = u.role_id
        where u.id = ${id} and r.code = 'agent' for update of u
      `;
      if (!rows[0]) throw new Error("agent-not-found");
      await tx`update policyboard.users set email = ${profile.email}, username = ${profile.username} where id = ${id}`;
      await tx`insert into policyboard.profiles (user_id, first_name, last_name)
        values (${id}, ${profile.firstName}, ${profile.lastName})
        on conflict (user_id) do update set first_name = excluded.first_name, last_name = excluded.last_name, updated_at = now()`;
      if (rows[0].email !== profile.email || rows[0].username?.toLowerCase() !== profile.username.toLowerCase()) {
        await tx`update policyboard.user_sessions set revoked_at = now() where user_id = ${id} and revoked_at is null`;
      }
    });
  } catch (error) { fail(error); }
  finish("updated");
}

export async function setAgentStatus(form: FormData) {
  await requireManager();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!isUuid(id) || !["active", "inactive"].includes(status) ||
      (status === "inactive" && form.get("confirm") !== "yes")) redirect(`${path}?error=invalid`);
  try {
    await withTransaction(async tx => {
      const rows = await tx`update policyboard.users u set active = ${status === "active"}
        from policyboard.roles r where u.id = ${id} and r.id = u.role_id and r.code = 'agent' returning u.id`;
      if (!rows.length) throw new Error("agent-not-found");
      if (status === "inactive") {
        await tx`update policyboard.user_sessions set revoked_at = now() where user_id = ${id} and revoked_at is null`;
      }
    });
  } catch (error) { fail(error); }
  finish(status === "active" ? "activated" : "deactivated");
}

export async function resetAgentPassword(form: FormData) {
  await requireManager();
  const id = String(form.get("id") ?? "");
  const password = readAgentPassword(form);
  if (!isUuid(id) || !password || form.get("confirm") !== "yes") redirect(`${path}?error=invalid`);
  try {
    const hash = await hashPassword(password);
    await withTransaction(async tx => {
      const rows = await tx`update policyboard.users u
        set password_hash = ${hash}, password_updated_at = now(), must_change_password = false,
            failed_login_count = 0, locked_until = null
        from policyboard.roles r where u.id = ${id} and r.id = u.role_id and r.code = 'agent' returning u.id`;
      if (!rows.length) throw new Error("agent-not-found");
      await tx`update policyboard.user_sessions set revoked_at = now() where user_id = ${id} and revoked_at is null`;
    });
  } catch (error) { fail(error); }
  finish("password");
}
