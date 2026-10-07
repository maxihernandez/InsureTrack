"use server";

import { redirect } from "next/navigation";
import { getDb, withTransaction } from "@/lib/db";
import { createSession, endSession, hashPassword, verifyPassword } from "@/lib/auth";
import { parseUsername } from "@/lib/validation";

export async function logout() {
  await endSession();
  redirect("/login");
}

export async function login(data: FormData) {
  const username = parseUsername(data.get("username"));
  const password = String(data.get("password") ?? "");
  if (!username || !password) redirect("/login?error=1");
  const sql = getDb();
  const rows = await sql<{ id: string; password_hash: string | null; active: boolean; locked_until: Date | null }[]>`
    select id, password_hash, active, locked_until from policyboard.users
    where username is not null and lower(username) = ${username.toLowerCase()}
  `;
  const user = rows[0];
  const valid = !!user && user.active && !!user.password_hash &&
    (!user.locked_until || user.locked_until <= new Date()) && await verifyPassword(password, user.password_hash);
  if (!valid) {
    if (user) await sql`update policyboard.users set failed_login_count = least(failed_login_count + 1, 5),
      locked_until = case when failed_login_count + 1 >= 5 then now() + interval '15 minutes' else locked_until end
      where id = ${user.id}`;
    redirect("/login?error=1");
  }
  await sql`update policyboard.users set failed_login_count = 0, locked_until = null, last_login_at = now() where id = ${user.id}`;
  await createSession(user.id);
  redirect("/");
}

export async function setupManager(data: FormData) {
  const first = String(data.get("firstName") ?? "").trim();
  const last = String(data.get("lastName") ?? "").trim();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const username = parseUsername(data.get("username"));
  const password = String(data.get("password") ?? "");
  if (!first || first.length > 100 || !last || last.length > 100 || !username ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128) {
    redirect("/setup?error=1");
  }
  const hash = await hashPassword(password);
  const id = await withTransaction(async tx => {
    await tx`select pg_advisory_xact_lock(918227)`;
    const c = await tx<{ count: number }[]>`select count(*)::int count from policyboard.users`;
    if (c[0].count) return null;
    const users = await tx<{ id: string }[]>`insert into policyboard.users
      (email, username, password_hash, password_updated_at, must_change_password, role_id)
      values (${email}, ${username}, ${hash}, now(), false, 1) returning id`;
    await tx`insert into policyboard.profiles (user_id, first_name, last_name) values (${users[0].id}, ${first}, ${last})`;
    return users[0].id;
  });
  if (!id) redirect("/login");
  await createSession(id);
  redirect("/");
}
