-- Preserve the invariant used by the application: a policy cannot be in force without an effective date.

begin;

alter table policyboard.sales drop constraint if exists sales_in_force_effective_date_check;
alter table policyboard.sales add constraint sales_in_force_effective_date_check
  check (policy_status <> 'in_force' or effective_date is not null);

commit;