-- Cover the policy lifecycle foreign keys used by status changes and history lookups.

begin;

create index if not exists policy_status_history_sale_id_idx
  on policyboard.policy_status_history (sale_id);
create index if not exists policy_status_history_changed_by_idx
  on policyboard.policy_status_history (changed_by);
create index if not exists sales_policy_status_updated_by_idx
  on policyboard.sales (policy_status_updated_by);

commit;