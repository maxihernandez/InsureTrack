# PolicyBoard

Internal sales performance MVP for one insurance agency. It tracks monthly goals, production, team ranking, commercial activity, and history. It does not store customer or policy records.

## Local development

Requires Node.js 22 and the existing `policyboard` PostgreSQL schema in the MaxiProjects Supabase project.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to the Supabase transaction pooler URI. Keep this file private.
3. Run `npm run dev` and open `http://localhost:3000`.
4. If `policyboard.users` is empty, open `/setup` to create the first manager. Subsequent visits cannot create another manager.

The application connects to PostgreSQL only from Next.js server code. Password hashes and session token hashes are stored in `policyboard`; sessions are delivered with an HttpOnly cookie. Do not expose `DATABASE_URL` as a `NEXT_PUBLIC_` variable.

## Deployment

Set `DATABASE_URL` in Vercel's server environment variables. The database schema currently exists in the configured Supabase project; its migrations are not yet checked into this repository, so a new database cannot be initialized from Git alone.

## Checks

Run `npm run lint` and `npm run build` before deployment. The manifest and icons prepare the UI for installation; offline caching and push notifications are not implemented.
