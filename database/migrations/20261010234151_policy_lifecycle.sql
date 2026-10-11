-- Apply in the Supabase SQL Editor as the schema owner before deploying this application change.
-- Existing sales are preserved as legacy records because their policy number and effective status are unknown.

begin;

alter table policyboard.sales add column if not exists policy_number text;
alter table policyboard.sales add column if not exists policy_status text;
alter table policyboard.sales add column if not exists effective_date date;
alter table policyboard.sales add column if not exists policy_status_updated_at timestamptz;
alter table policyboard.sales add column if not exists policy_status_updated_by uuid references policyboard.users(id) on delete set null;

update policyboard.sales
set policy_status = 'legacy',
    policy_status_updated_at = coalesce(policy_status_updated_at, created_at, now())
where policy_status is null;

alter table policyboard.sales alter column policy_status set default 'recorded';
alter table policyboard.sales alter column policy_status set not null;
alter table policyboard.sales alter column policy_status_updated_at set default now();
alter table policyboard.sales alter column policy_status_updated_at set not null;

alter table policyboard.sales drop constraint if exists sales_policy_status_check;
alter table policyboard.sales add constraint sales_policy_status_check
  check (policy_status in ('legacy', 'recorded', 'issued', 'in_force', 'not_issued', 'cancelled'));

alter table policyboard.sales drop constraint if exists sales_policy_number_status_check;
alter table policyboard.sales add constraint sales_policy_number_status_check
  check (
    (policy_status = 'legacy' and policy_number is null)
    or (
      policy_status <> 'legacy'
      and policy_number is not null
      and char_length(btrim(policy_number)) between 1 and 100
    )
  );

create index if not exists sales_recorded_status_date_idx
  on policyboard.sales (sale_date, policy_status);
create index if not exists sales_in_force_effective_date_idx
  on policyboard.sales (effective_date)
  where policy_status = 'in_force';

create table if not exists policyboard.policy_status_history (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references policyboard.sales(id) on delete cascade,
  previous_status text not null check (previous_status in ('recorded', 'issued', 'in_force', 'not_issued', 'cancelled')),
  next_status text not null check (next_status in ('recorded', 'issued', 'in_force', 'not_issued', 'cancelled')),
  effective_date date,
  changed_by uuid not null references policyboard.users(id),
  changed_at timestamptz not null default now()
);

revoke all on table policyboard.policy_status_history from public, anon, authenticated;
grant select, insert on table policyboard.policy_status_history to policyboard_app;
alter table policyboard.policy_status_history enable row level security;

drop policy if exists "policyboard app reads policy history" on policyboard.policy_status_history;
create policy "policyboard app reads policy history"
  on policyboard.policy_status_history for select to policyboard_app using (true);
drop policy if exists "policyboard app writes policy history" on policyboard.policy_status_history;
create policy "policyboard app writes policy history"
  on policyboard.policy_status_history for insert to policyboard_app with check (true);

grant update (policy_status, effective_date, policy_status_updated_at, policy_status_updated_by)
  on policyboard.sales to policyboard_app;
drop policy if exists "policyboard app updates policy status" on policyboard.sales;
create policy "policyboard app updates policy status"
  on policyboard.sales for update to policyboard_app using (true) with check (true);

commit;