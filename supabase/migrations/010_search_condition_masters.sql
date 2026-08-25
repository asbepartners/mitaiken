begin;

-- Categories already exist as a public master. Extend it instead of creating a
-- second source of truth, then split the old combined category.
alter table public.categories
  add column if not exists is_active boolean not null default true;

insert into public.categories (slug, name, display_order, is_active)
values
  ('outing', 'おでかけ', 10, true),
  ('food', '食べる', 20, true),
  ('hobby', '趣味', 30, true),
  ('learning', '学ぶ', 40, true),
  ('lifestyle', '暮らし', 50, true),
  ('beauty-health', '美容・健康', 60, true)
on conflict (slug) do update set
  name = excluded.name,
  display_order = excluded.display_order,
  is_active = excluded.is_active;

update public.categories
set is_active = false
where slug = 'hobby-learning';

-- Existing hobby-learning records cannot be split mechanically. Current
-- catalog entries are hobby activities, so migrate them to hobby. Learning is
-- available for new and manually reclassified experiences.
update public.templates
set category_id = (select id from public.categories where slug = 'hobby')
where category_id = (select id from public.categories where slug = 'hobby-learning');

update public.template_items
set category_id = (select id from public.categories where slug = 'hobby')
where category_id = (select id from public.categories where slug = 'hobby-learning');

update public.user_experiences
set category_id = (select id from public.categories where slug = 'hobby')
where category_id = (select id from public.categories where slug = 'hobby-learning');

create table public.location_options (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  supports_home boolean not null,
  supports_outing boolean not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (supports_home or supports_outing)
);

create table public.duration_options (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  min_minutes integer not null check (min_minutes >= 0),
  max_minutes integer,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_minutes is null or max_minutes >= min_minutes)
);

create table public.budget_options (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  min_yen integer not null check (min_yen >= 0),
  max_yen integer,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_yen is null or max_yen >= min_yen)
);

-- People are stored as numeric ranges on each experience. This table only
-- drives the user-facing search choices and their range-intersection query.
create table public.people_search_options (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  query_min_people smallint not null check (query_min_people >= 1),
  query_max_people smallint,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (query_max_people is null or query_max_people >= query_min_people)
);

insert into public.location_options
  (code, label, supports_home, supports_outing, sort_order)
values
  ('home', '自宅でできる', true, false, 10),
  ('outing', '外出する', false, true, 20),
  ('either', 'どちらでも', true, true, 30);

insert into public.duration_options
  (code, label, min_minutes, max_minutes, sort_order)
values
  ('within_1h', '1時間以内', 0, 60, 10),
  ('half_day', '半日くらい', 61, 360, 20),
  ('full_day', '1日くらい', 361, 1440, 30),
  ('multiple_days', '2日以上', 1441, null, 40);

insert into public.budget_options
  (code, label, min_yen, max_yen, sort_order)
values
  ('free', '無料', 0, 0, 10),
  ('within_2000', '2,000円以内', 1, 2000, 20),
  ('within_10000', '1万円以内', 2001, 10000, 30),
  ('over_10000', '1万円超', 10001, null, 40);

insert into public.people_search_options
  (code, label, query_min_people, query_max_people, sort_order)
values
  ('solo', 'ひとりでできる', 1, 1, 10),
  ('with_others', '誰かと楽しむ', 2, null, 20);

alter table public.templates
  add column if not exists location_option_id uuid references public.location_options(id) on delete set null,
  add column if not exists duration_option_id uuid references public.duration_options(id) on delete set null,
  add column if not exists budget_option_id uuid references public.budget_options(id) on delete set null,
  add column if not exists min_people smallint,
  add column if not exists max_people smallint,
  add constraint templates_min_people_check check (min_people is null or min_people >= 1),
  add constraint templates_people_pair_check check (max_people is null or min_people is not null),
  add constraint templates_people_range_check check (max_people is null or max_people >= min_people);

alter table public.user_experiences
  add column if not exists location_option_id uuid references public.location_options(id) on delete set null,
  add column if not exists duration_option_id uuid references public.duration_options(id) on delete set null,
  add column if not exists budget_option_id uuid references public.budget_options(id) on delete set null,
  add column if not exists min_people smallint,
  add column if not exists max_people smallint,
  add constraint user_experiences_min_people_check check (min_people is null or min_people >= 1),
  add constraint user_experiences_people_pair_check check (max_people is null or min_people is not null),
  add constraint user_experiences_people_range_check check (max_people is null or max_people >= min_people);

-- Migrate the current operated catalog from its source-code metadata. Values
-- are stored on parent templates; collection children inherit the parent.
with mapping(slug, location_code, duration_code, budget_code, min_people, max_people) as (
  values
    ('goshuin-collection', 'outing', 'within_1h', 'within_2000', 1, null::smallint),
    ('restaurant-collection', 'outing', 'half_day', 'within_10000', 1, null::smallint),
    ('prefecture-collection', 'outing', 'multiple_days', 'over_10000', 1, null::smallint),
    ('pottery-bowl', 'outing', 'half_day', 'within_10000', 1, null::smallint),
    ('spice-curry', 'home', 'half_day', 'within_2000', 1, null::smallint),
    ('solo-ferry', 'outing', 'half_day', 'within_10000', 1, null::smallint),
    ('planetarium', 'outing', 'within_1h', 'within_2000', 1, null::smallint),
    ('watercolor', 'either', 'half_day', 'within_2000', 1, null::smallint),
    ('solo-kissaten', 'outing', 'within_1h', 'within_2000', 1, null::smallint),
    ('sento-tour', 'outing', 'half_day', 'within_2000', 1, null::smallint),
    ('night-market', 'outing', 'half_day', 'within_2000', 2, null::smallint),
    ('handmade-bread', 'home', 'half_day', 'within_2000', 1, null::smallint),
    ('letterpress', 'outing', 'half_day', 'within_10000', 1, null::smallint),
    ('night-hike', 'outing', 'half_day', 'within_10000', 2, null::smallint),
    ('sake-tasting', 'outing', 'half_day', 'within_10000', 1, null::smallint),
    ('leather-craft', 'outing', 'half_day', 'within_10000', 1, null::smallint),
    ('unfamiliar-cuisine', 'outing', 'half_day', 'within_10000', 1, null::smallint),
    ('stargazing', 'outing', 'half_day', 'within_10000', 2, null::smallint),
    ('calligraphy', 'either', 'within_1h', 'within_2000', 1, null::smallint),
    ('day-trip-onsen', 'outing', 'half_day', 'within_10000', 1, null::smallint),
    ('terrarium', 'home', 'within_1h', 'within_10000', 1, null::smallint)
)
update public.templates template
set
  location_option_id = location.id,
  duration_option_id = duration.id,
  budget_option_id = budget.id,
  min_people = mapping.min_people,
  max_people = mapping.max_people
from mapping
join public.location_options location on location.code = mapping.location_code
join public.duration_options duration on duration.code = mapping.duration_code
join public.budget_options budget on budget.code = mapping.budget_code
where template.slug = mapping.slug;

-- Existing user-owned copies inherit their source template's conditions.
-- Originals have no source template, so their new optional fields remain NULL.
update public.user_experiences user_experience
set
  location_option_id = template.location_option_id,
  duration_option_id = template.duration_option_id,
  budget_option_id = template.budget_option_id,
  min_people = template.min_people,
  max_people = template.max_people
from public.templates template
where template.id = user_experience.source_template_id;

-- Compatibility for copies made before source_template_id was populated.
update public.user_experiences user_experience
set
  location_option_id = template.location_option_id,
  duration_option_id = template.duration_option_id,
  budget_option_id = template.budget_option_id,
  min_people = template.min_people,
  max_people = template.max_people
from public.templates template
where user_experience.source_template_id is null
  and user_experience.source_template_slug = template.slug;

create index location_options_active_order_idx
  on public.location_options(is_active, sort_order, id);
create index duration_options_active_order_idx
  on public.duration_options(is_active, sort_order, id);
create index budget_options_active_order_idx
  on public.budget_options(is_active, sort_order, id);
create index people_search_options_active_order_idx
  on public.people_search_options(is_active, sort_order, id);

create index templates_location_option_idx on public.templates(location_option_id);
create index templates_duration_option_idx on public.templates(duration_option_id);
create index templates_budget_option_idx on public.templates(budget_option_id);
create index user_experiences_location_option_idx on public.user_experiences(location_option_id);
create index user_experiences_duration_option_idx on public.user_experiences(duration_option_id);
create index user_experiences_budget_option_idx on public.user_experiences(budget_option_id);
create index user_experiences_people_idx on public.user_experiences(min_people, max_people);

create trigger location_options_set_updated_at
  before update on public.location_options
  for each row execute function public.set_updated_at();
create trigger duration_options_set_updated_at
  before update on public.duration_options
  for each row execute function public.set_updated_at();
create trigger budget_options_set_updated_at
  before update on public.budget_options
  for each row execute function public.set_updated_at();
create trigger people_search_options_set_updated_at
  before update on public.people_search_options
  for each row execute function public.set_updated_at();

alter table public.location_options enable row level security;
alter table public.duration_options enable row level security;
alter table public.budget_options enable row level security;
alter table public.people_search_options enable row level security;

create policy "location_options_read_public" on public.location_options
  for select to anon, authenticated using (true);
create policy "duration_options_read_public" on public.duration_options
  for select to anon, authenticated using (true);
create policy "budget_options_read_public" on public.budget_options
  for select to anon, authenticated using (true);
create policy "people_search_options_read_public" on public.people_search_options
  for select to anon, authenticated using (true);

grant select on
  public.location_options,
  public.duration_options,
  public.budget_options,
  public.people_search_options
to anon, authenticated;

commit;
