begin;

set local lock_timeout = '5s';

alter table policyboard.sales
  drop column if exists amount;

alter table policyboard.goals
  drop column if exists target_amount;

alter table policyboard.annual_goals
  drop column if exists target_amount;

commit;
