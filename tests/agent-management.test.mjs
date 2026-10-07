import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const testModule = { exports: {} };
  vm.runInNewContext(outputText, { module: testModule, exports: testModule.exports, Buffer, process,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name) });
  return testModule.exports;
}
const identityValidation = load("../lib/validation.ts");
const validation = load("../lib/agent-validation.ts", { "@/lib/validation": identityValidation });
const id = "12345678-1234-1234-1234-123456789012";
function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ id, username: " Ana.Perez ", first_name: " Ana ", last_name: " Pérez ", email: " ANA@EXAMPLE.COM ",
    password: "LongPassword-2026", password_confirmation: "LongPassword-2026", ...overrides })) data.set(key, value);
  return data;
}
class Redirect extends Error { constructor(path) { super(path); this.path = path; } }
const to = path => error => error instanceof Redirect && error.path === path;
function harness({ user = { role: "manager" }, results = [], error } = {}) {
  const queries = [], hashes = [], invalidations = [];
  let committed = false, rolledBack = false;
  const sql = async (parts, ...values) => {
    queries.push({ text: parts.join("?").replace(/\s+/g, " "), values });
    if (error) throw error;
    return results.shift() ?? [];
  };
  sql.begin = async callback => {
    try { const value = await callback(sql); committed = true; return value; }
    catch (err) { rolledBack = true; throw err; }
  };
  const actions = load("../app/(authenticated)/team/manage/actions.ts", {
    "next/navigation": { redirect: path => { throw new Redirect(path); } },
    "next/cache": { revalidatePath: path => invalidations.push(path) },
    "@/lib/auth": { getCurrentUser: async () => user, hashPassword: async value => { hashes.push(value); return "hashed-password"; } },
    "@/lib/db": { withTransaction: callback => sql.begin(callback) },
    "@/lib/validation": { isUuid: value => /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value) },
    "@/lib/agent-validation": validation,
  });
  return { actions, queries, hashes, invalidations, get committed() { return committed; }, get rolledBack() { return rolledBack; } };
}
test("profile validation trims names, normalizes email and rejects invalid fields", () => {
  const p = validation.readAgentProfile(form());
  assert.equal(p.firstName, "Ana"); assert.equal(p.lastName, "Pérez"); assert.equal(p.email, "ana@example.com"); assert.equal(p.username, "Ana.Perez");
  for (const input of [{ email: "invalid" }, { username: "" }, { username: "bad name" }, { first_name: " " }, { last_name: "x".repeat(101) }]) {
    assert.equal(validation.readAgentProfile(form(input)), null);
  }
});
test("password validation checks length and confirmation without trimming", () => {
  for (const input of [{ password: "short" }, { password_confirmation: "wrong" }, { password: "x".repeat(129), password_confirmation: "x".repeat(129) }]) {
    assert.equal(validation.readAgentPassword(form(input)), null);
  }
  assert.equal(validation.readAgentPassword(form({ password: " 1234567890 ", password_confirmation: " 1234567890 " })), " 1234567890 ");
});
test("every mutation rejects agents and anonymous requests before hashing or querying", async () => {
  for (const user of [null, { role: "agent" }]) {
    for (const action of ["createAgent", "updateAgent", "setAgentStatus", "resetAgentPassword"]) {
      const h = harness({ user });
      await assert.rejects(h.actions[action](form()), to(user ? "/team" : "/login"));
      assert.equal(h.queries.length, 0); assert.equal(h.hashes.length, 0);
    }
  }
});
test("creation commits user and profile together, stores only hash and refreshes production", async () => {
  const h = harness({ results: [[{ id }], []] });
  await assert.rejects(h.actions.createAgent(form()), to("/team/manage?saved=created"));
  assert.equal(h.committed, true); assert.equal(h.queries.length, 2);
  assert.match(h.queries[0].text, /code = 'agent'/);
  assert.ok(h.queries[0].values.includes("hashed-password"));
  assert.ok(h.queries.every(q => !q.values.includes("LongPassword-2026")));
  assert.ok(h.invalidations.includes("/production"));
});
test("duplicate email rolls back without exposing SQL details", async () => {
  const h = harness({ error: { code: "23505" } });
  await assert.rejects(h.actions.createAgent(form()), to("/team/manage?error=duplicate"));
  assert.equal(h.rolledBack, true);
});
test("editing profile locks an agent and revokes sessions when email changes", async () => {
  const h = harness({ results: [[{ email: "old@example.com" }], [], [], []] });
  await assert.rejects(h.actions.updateAgent(form()), to("/team/manage?saved=updated"));
  assert.match(h.queries[0].text, /code = 'agent'.*for update of u/);
  assert.ok(h.queries.some(q => q.text.includes("user_sessions set revoked_at")));
  assert.equal(h.committed, true);
});
test("missing or non-agent targets are not changed", async () => {
  const h = harness();
  await assert.rejects(h.actions.updateAgent(form()), to("/team/manage?error=missing"));
  assert.equal(h.queries.length, 1); assert.equal(h.rolledBack, true);
});
test("deactivation requires confirmation, revokes sessions and never deletes sales", async () => {
  const rejected = harness();
  await assert.rejects(rejected.actions.setAgentStatus(form({ status: "inactive" })), to("/team/manage?error=invalid"));
  assert.equal(rejected.queries.length, 0);
  const h = harness({ results: [[{ id }], []] });
  await assert.rejects(h.actions.setAgentStatus(form({ status: "inactive", confirm: "yes" })), to("/team/manage?saved=deactivated"));
  assert.match(h.queries[0].text, /r.code = 'agent'/); assert.ok(h.queries[0].values.includes(false));
  assert.match(h.queries[1].text, /user_sessions set revoked_at/);
  assert.ok(h.queries.every(q => !q.text.includes("delete")));
});
test("activation does not restore revoked sessions", async () => {
  const h = harness({ results: [[{ id }]] });
  await assert.rejects(h.actions.setAgentStatus(form({ status: "active" })), to("/team/manage?saved=activated"));
  assert.equal(h.queries.length, 1); assert.ok(h.queries[0].values.includes(true));
});
test("password reset checks confirmation, hashes, clears lockout and revokes sessions", async () => {
  const rejected = harness();
  await assert.rejects(rejected.actions.resetAgentPassword(form()), to("/team/manage?error=invalid"));
  assert.equal(rejected.hashes.length, 0);
  const h = harness({ results: [[{ id }], []] });
  await assert.rejects(h.actions.resetAgentPassword(form({ confirm: "yes" })), to("/team/manage?saved=password"));
  assert.match(h.queries[0].text, /failed_login_count = 0, locked_until = null/);
  assert.match(h.queries[0].text, /r.code = 'agent'/);
  assert.match(h.queries[1].text, /user_sessions set revoked_at/);
  assert.ok(h.queries[0].values.includes("hashed-password"));
});
test("real password hashes are salted and reject wrong passwords", async () => {
  const auth = load("../lib/auth.ts", { "server-only": {}, "next/headers": {}, "react": { cache: fn => fn }, "@/lib/db": {} });
  const hash = await auth.hashPassword("LongPassword-2026");
  assert.notEqual(hash, await auth.hashPassword("LongPassword-2026"));
  assert.match(hash, /^pbkdf2_sha512\$600000\$/);
  assert.equal(await auth.verifyPassword("LongPassword-2026", hash), true);
  assert.equal(await auth.verifyPassword("WrongPassword-2026", hash), false);
});

test("username format rejects emails, spaces, punctuation and out-of-range lengths", () => {
  assert.equal(identityValidation.parseUsername(" Mhernandez "), "Mhernandez");
  assert.equal(identityValidation.parseUsername("Agent_01-test.name"), "Agent_01-test.name");
  for (const value of [null, "", "ab", "x".repeat(33), "ana@example.com", "ana perez", ".username", "usuarioñ", "<script>"]) {
    assert.equal(identityValidation.parseUsername(value), null);
  }
});

function loginHarness({ user, valid = true } = {}) {
  const queries = [], sessions = [];
  const sql = async (parts, ...values) => {
    const text = parts.join("?").replace(/\s+/g, " ");
    queries.push({ text, values });
    return text.includes("select id,") ? (user ? [user] : []) : [];
  };
  const actions = load("../app/login/actions.ts", {
    "next/navigation": { redirect: path => { throw new Redirect(path); } },
    "@/lib/db": { getDb: () => sql },
    "@/lib/auth": { verifyPassword: async () => valid, createSession: async id => sessions.push(id) },
    "@/lib/validation": identityValidation,
  });
  return { actions, queries, sessions };
}
test("login uses case-insensitive username, never email, and creates a session", async () => {
  const h = loginHarness({ user: { id, active: true, password_hash: "existing-hash", locked_until: null } });
  await assert.rejects(h.actions.login(form({ username: " MHernandez " })), to("/"));
  assert.match(h.queries[0].text, /lower\(username\)/);
  assert.deepEqual(h.queries[0].values, ["mhernandez"]);
  assert.equal(h.sessions[0], id);
});
test("login rejects email-only requests and invalid username without DB lookup", async () => {
  const h = loginHarness();
  const data = form(); data.delete("username");
  await assert.rejects(h.actions.login(data), to("/login?error=1"));
  await assert.rejects(h.actions.login(form({ username: "ana@example.com" })), to("/login?error=1"));
  assert.equal(h.queries.length, 0); assert.equal(h.sessions.length, 0);
});
test("inactive, unknown, locked accounts and wrong passwords cannot create sessions", async () => {
  for (const options of [ {}, { user: { id, active: false, password_hash: "hash" } },
    { user: { id, active: true, password_hash: "hash", locked_until: new Date(Date.now() + 60000) } },
    { user: { id, active: true, password_hash: "hash", locked_until: null }, valid: false } ]) {
    const h = loginHarness(options);
    await assert.rejects(h.actions.login(form()), to("/login?error=1"));
    assert.equal(h.sessions.length, 0);
  }
});

test("integration: real agent lifecycle, duplicates and revoked sessions, rolled back", {
  skip: process.env.POLICYBOARD_DB_TEST !== "1", timeout: 60000,
}, async () => {
  const database = load("../lib/db.ts", { "server-only": {} });
  const sql = database.getDb();
  const auth = load("../lib/auth.ts", { "server-only": {}, "next/headers": {}, "react": { cache: fn => fn }, "@/lib/db": {} });
  const email = `policyboard-test-${require("node:crypto").randomUUID()}@example.invalid`;
  const username = `test_${require("node:crypto").randomBytes(8).toString("hex")}`;
  const rollback = new Error("intentional-test-rollback");
  try {
    await assert.rejects(database.withTransaction(async tx => {
      const actions = load("../app/(authenticated)/team/manage/actions.ts", {
        "next/navigation": { redirect: path => { throw new Redirect(path); } },
        "next/cache": { revalidatePath: () => {} },
        "@/lib/auth": { getCurrentUser: async () => ({ role: "manager" }), hashPassword: auth.hashPassword },
        "@/lib/db": { withTransaction: async callback => {
          await tx`savepoint agent_test`;
          try {
            const value = await callback(tx);
            await tx`release savepoint agent_test`;
            return value;
          } catch (error) {
            await tx`rollback to savepoint agent_test`;
            await tx`release savepoint agent_test`;
            throw error;
          }
        } },
        "@/lib/validation": { isUuid: value => /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value) },
        "@/lib/agent-validation": validation,
      });
      const input = form({ email, username });
      await assert.rejects(actions.createAgent(input), to("/team/manage?saved=created"));
      const [agent] = await tx`select u.id, u.password_hash, u.active, p.first_name, r.code from policyboard.users u
        join policyboard.profiles p on p.user_id = u.id join policyboard.roles r on r.id = u.role_id where u.email = ${email}`;
      assert.equal(agent.code, "agent"); assert.equal(agent.active, true); assert.equal(agent.first_name, "Ana");
      assert.equal(await auth.verifyPassword("LongPassword-2026", agent.password_hash), true);
      await assert.rejects(actions.createAgent(input), to("/team/manage?error=duplicate"));
      await assert.rejects(actions.createAgent(form({ email: `other-${email}`, username: username.toUpperCase() })), to("/team/manage?error=duplicate"));
      const [lookup] = await tx`select id from policyboard.users where lower(username) = ${username.toUpperCase().toLowerCase()}`;
      assert.equal(lookup.id, agent.id);
      await assert.rejects(actions.updateAgent(form({ id: agent.id, email, username, first_name: "Updated" })), to("/team/manage?saved=updated"));
      const [profile] = await tx`select first_name from policyboard.profiles where user_id = ${agent.id}`;
      assert.equal(profile.first_name, "Updated");
      await tx`insert into policyboard.user_sessions (user_id, token_hash, expires_at)
        values (${agent.id}, ${require("node:crypto").randomBytes(32).toString("hex")}, now() + interval '1 hour')`;
      await assert.rejects(actions.setAgentStatus(form({ id: agent.id, status: "inactive", confirm: "yes" })), to("/team/manage?saved=deactivated"));
      const [inactive] = await tx`select active from policyboard.users where id = ${agent.id}`;
      assert.equal(inactive.active, false);
      const [sessions] = await tx`select count(*)::int as count from policyboard.user_sessions where user_id = ${agent.id} and revoked_at is null`;
      assert.equal(sessions.count, 0);
      await assert.rejects(actions.setAgentStatus(form({ id: agent.id, status: "active" })), to("/team/manage?saved=activated"));
      await tx`insert into policyboard.user_sessions (user_id, token_hash, expires_at)
        values (${agent.id}, ${require("node:crypto").randomBytes(32).toString("hex")}, now() + interval '1 hour')`;
      await tx`update policyboard.users set failed_login_count = 5, locked_until = now() + interval '15 minutes' where id = ${agent.id}`;
      const newPassword = "NewPassword-2026!";
      await assert.rejects(actions.resetAgentPassword(form({ id: agent.id, password: newPassword, password_confirmation: newPassword, confirm: "yes" })), to("/team/manage?saved=password"));
      const [updated] = await tx`select password_hash, active, failed_login_count, locked_until from policyboard.users where id = ${agent.id}`;
      assert.equal(updated.active, true);
      assert.equal(await auth.verifyPassword(newPassword, updated.password_hash), true);
      assert.equal(await auth.verifyPassword("LongPassword-2026", updated.password_hash), false);
      assert.equal(updated.failed_login_count, 0);
      assert.equal(updated.locked_until, null);
      const [resetSessions] = await tx`select count(*)::int as count from policyboard.user_sessions where user_id = ${agent.id} and revoked_at is null`;
      assert.equal(resetSessions.count, 0);
      throw rollback;
    }), error => error === rollback);
    const [remaining] = await sql`select count(*)::int as count from policyboard.users where email = ${email}`;
    assert.equal(remaining.count, 0);
    await database.withTransaction(async tx => { const [row] = await tx`select 1 as value`; assert.equal(row.value, 1); });
  } finally { await sql.end({ timeout: 2 }); }
});
