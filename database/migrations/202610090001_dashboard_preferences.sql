-- Apply in the Supabase SQL Editor as the schema owner before deploying this application change.
-- The application connects as policyboard_app; browser clients never access this table directly.

begin;

create table if not exists policyboard.dashboard_preferences (
  user_id uuid primary key references policyboard.users(id) on delete cascade,
  product_order uuid[] not null default '{}'::uuid[],
  hidden_product_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on table policyboard.dashboard_preferences from public, anon, authenticated;
grant select, insert, update on table policyboard.dashboard_preferences to policyboard_app;

alter table policyboard.dashboard_preferences enable row level security;

drop policy if exists "policyboard app manages dashboard preferences" on policyboard.dashboard_preferences;
create policy "policyboard app manages dashboard preferences"
  on policyboard.dashboard_preferences
  for all
  to policyboard_app
  using (true)
  with check (true);

commit;