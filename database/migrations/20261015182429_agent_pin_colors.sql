alter table policyboard.profiles add column if not exists pin_color smallint;

do $$
declare
  agent_total integer;
begin
  select count(*)::int into agent_total
  from policyboard.users u
  join policyboard.roles r on r.id = u.role_id
  where r.code = 'agent';

  if agent_total > 30 then
    raise exception 'Cannot assign unique pin colors: % agents exceed the 30-color palette.', agent_total;
  end if;
end $$;

with numbered_agents as (
  select p.user_id, row_number() over (order by p.created_at, p.user_id)::smallint as pin_color
  from policyboard.profiles p
  join policyboard.users u on u.id = p.user_id
  join policyboard.roles r on r.id = u.role_id
  where r.code = 'agent' and p.pin_color is null
)
update policyboard.profiles p
set pin_color = numbered_agents.pin_color,
    updated_at = now()
from numbered_agents
where p.user_id = numbered_agents.user_id;

alter table policyboard.profiles
  drop constraint if exists profiles_pin_color_check;
alter table policyboard.profiles
  add constraint profiles_pin_color_check check (pin_color between 1 and 30);

create unique index if not exists profiles_agent_pin_color_unique
  on policyboard.profiles (pin_color)
  where pin_color is not null;
