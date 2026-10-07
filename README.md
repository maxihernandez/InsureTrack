# PolicyBoard

Internal sales performance MVP for one insurance agency. It tracks monthly goals, production, team ranking, commercial activity, and history. It does not store customer or policy records.

## Local development

Requires Node.js 22 and the existing `policyboard` PostgreSQL schema in the MaxiProjects Supabase project.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to the Supabase transaction pooler URI. Keep this file private.
3. Run `npm run dev` and open `http://localhost:3000`.
4. If `policyboard.users` is empty, open `/setup` to create the first manager. Subsequent visits cannot create another manager.

The application connects to PostgreSQL only from Next.js server code. Password hashes and session token hashes are stored in `policyboard`; sessions are delivered with an HttpOnly cookie. Do not expose `DATABASE_URL` as a `NEXT_PUBLIC_` variable.

Sign-in uses a unique, case-insensitive **username**, not email. Usernames contain 3–32 ASCII letters/digits, dots, underscores or hyphens and start with a letter/digit. Email remains a contact field. The existing manager uses `Mhernandez`. Legacy agents without a username need one assigned in Manage agents before they can sign in; passwords are unchanged. The additive `policyboard_add_usernames` migration is recorded in the configured Supabase project.

## Deployment

Set `DATABASE_URL` in Vercel's server environment variables. The database schema currently exists in the configured Supabase project; its migrations are not yet checked into this repository, so a new database cannot be initialized from Git alone.

## Checks

Run `npm run lint` and `npm run build` before deployment. The manifest and icons prepare the UI for installation; offline caching and push notifications are not implemented.

## Historical reports

**Reports** (`/history`, existing URL preserved) summarizes the 12 months ending in the selected month; by default it ends in the previous month. It shows sales versus goals, monthly premium, product mix, agent contribution, summary cards and exact monthly values with dashboard drill-down links. Inactive agents/products remain included in historical sales. Months with no sales are represented as zero; missing goals remain null. Goal achievement only counts sales from product/month pairs with positive targets. Sales after today are excluded, and incomplete/future ranges are explicitly labeled. Existing team-report visibility is unchanged. Goals reflect the currently stored values: this MVP does not preserve immutable snapshots of edited historical goals. Charts are server-rendered SVG/HTML with no new browser library or database schema change.

## Agent management

Managers open **Team → Manage agents** (`/team/manage`) to create agents, edit their username/names/email, activate/deactivate them, or reset passwords. Active agents appear in Production automatically. All mutations check the manager role server-side and restrict targets to the agent role.

New agents receive an automatic username: first initial + full last name, normalized to lowercase ASCII without accents/spaces. Existing names are checked case-insensitively; collisions receive numeric suffixes (`mhernandez1`, `mhernandez2`). The unique index and insert retries also protect concurrent creations. Names are limited to 32 characters including the suffix; exceptionally short names are padded to three characters. Existing usernames are not regenerated when editing a profile; managers can explicitly edit them.

Passwords require 12–128 characters and confirmation, and are stored as salted PBKDF2 hashes. Credentials are not emailed; share them through a secure channel. Initial/reset passwords are not one-time passwords, and this MVP does not yet force a first-login password change. Username/email changes, deactivation and password resets revoke existing sessions. Deactivation preserves historical production.

**Manager access** can be enabled or removed for another agent from their account card, with explicit confirmation. The additive remote migration `policyboard_agent_manager_access` adds `users.manager_access` (not null, default false). The base agent role is unchanged, preserving production eligibility, ranking and history; session authorization resolves the effective manager role from the database on every request. Permission changes revoke sessions atomically and require signing in again. Only active agents can receive this permission; inactive agents can have it revoked. Managers cannot change their own manager access or modify the original manager's role through this form. Delegated managers have full manager permissions, including administration of other agents.

Run `npm test` for validation, permission, transaction-flow and hashing tests. The real database lifecycle test is opt-in and rolls back its test data:

```powershell
$env:POLICYBOARD_DB_TEST = '1'
node --env-file=.env.local --test tests/agent-management.test.mjs
Remove-Item Env:POLICYBOARD_DB_TEST
```

The database client disables pipelining for the transaction pooler. Use `withTransaction` from `lib/db.ts`, not the driver's `begin()`: it reserves one connection and handles commit/rollback with this configuration.
