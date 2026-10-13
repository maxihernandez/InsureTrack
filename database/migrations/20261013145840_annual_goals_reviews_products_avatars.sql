alter table policyboard.products
  add column if not exists category text not null default 'Other';

alter table policyboard.products
  drop constraint if exists products_category_check;
alter table policyboard.products
  add constraint products_category_check check (category in ('Vehicle', 'Property', 'Business', 'Personal', 'Other'));

update policyboard.products
set category = case
  when code in ('AUTO', 'PAP', 'BOAT') then 'Vehicle'
  when code in ('FIRE', 'RENTER', 'HO3', 'FLOOD') then 'Property'
  when code in ('LIFE', 'HEALTH', 'PUP') then 'Personal'
  when code in ('BANK', 'CPIC') then 'Business'
  else 'Other'
end
where category = 'Other';

grant insert, update on policyboard.products to policyboard_app;
create policy "policyboard_app_insert" on policyboard.products for insert to policyboard_app with check (true);
create policy "policyboard_app_update" on policyboard.products for update to policyboard_app using (true) with check (true);

create table if not exists policyboard.annual_goals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references policyboard.products(id) on delete restrict,
  year smallint not null check (year between 2020 and 2100),
  target_count integer not null check (target_count >= 0),
  target_amount numeric null check (target_amount is null or target_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, year)
);
create index if not exists annual_goals_year_product_idx on policyboard.annual_goals(year, product_id);
alter table policyboard.annual_goals enable row level security;
grant select, insert, update, delete on policyboard.annual_goals to policyboard_app;
create policy "policyboard_app_select" on policyboard.annual_goals for select to policyboard_app using (true);
create policy "policyboard_app_insert" on policyboard.annual_goals for insert to policyboard_app with check (true);
create policy "policyboard_app_update" on policyboard.annual_goals for update to policyboard_app using (true) with check (true);
create policy "policyboard_app_delete" on policyboard.annual_goals for delete to policyboard_app using (true);

create table if not exists policyboard.google_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references policyboard.users(id) on delete restrict,
  reviewed_on date not null,
  rating smallint not null check (rating between 1 and 5),
  excerpt text null check (char_length(excerpt) <= 1000),
  review_url text null check (char_length(review_url) <= 2048),
  created_by uuid not null references policyboard.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists google_reviews_user_date_idx on policyboard.google_reviews(user_id, reviewed_on desc);
alter table policyboard.google_reviews enable row level security;
grant select, insert, update, delete on policyboard.google_reviews to policyboard_app;
create policy "policyboard_app_select" on policyboard.google_reviews for select to policyboard_app using (true);
create policy "policyboard_app_insert" on policyboard.google_reviews for insert to policyboard_app with check (true);
create policy "policyboard_app_update" on policyboard.google_reviews for update to policyboard_app using (true) with check (true);
create policy "policyboard_app_delete" on policyboard.google_reviews for delete to policyboard_app using (true);

alter table policyboard.profiles add column if not exists avatar_path text null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marianela-team-board', 'marianela-team-board', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
