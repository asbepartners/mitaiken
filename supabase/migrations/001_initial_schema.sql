begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  category_id uuid not null references public.categories(id) on delete restrict,
  image_path text,
  place_label text,
  duration_label text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  cost_label text,
  cost_level smallint check (cost_level is null or cost_level between 0 and 3),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experience_tags (
  experience_id uuid not null references public.experiences(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (experience_id, tag_id)
);

create table public.user_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete restrict,
  wishlisted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, experience_id)
);

create table public.experience_logs (
  id uuid primary key default gen_random_uuid(),
  user_experience_id uuid not null
    references public.user_experiences(id) on delete cascade,
  experienced_year smallint not null check (experienced_year between 1900 and 9998),
  experienced_month smallint check (experienced_month between 1 and 12),
  experienced_day smallint check (experienced_day between 1 and 31),
  is_estimated boolean not null default false,
  memo text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (experienced_day is null or experienced_month is not null),
  check (
    case
      when experienced_day is null then true
      else experienced_day <= extract(
        day from (
          make_date(experienced_year, experienced_month, 1)
          + interval '1 month - 1 day'
        )
      )
    end
  )
);

create index experiences_published_order_idx
  on public.experiences (publication_status, display_order, id);
create index experiences_category_idx on public.experiences (category_id);
create index experience_tags_tag_idx on public.experience_tags (tag_id, experience_id);
create index user_experiences_user_idx on public.user_experiences (user_id, created_at desc);
create index user_experiences_experience_idx on public.user_experiences (experience_id);
create index experience_logs_parent_date_idx
  on public.experience_logs (
    user_experience_id,
    experienced_year,
    experienced_month,
    experienced_day,
    created_at
  );

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger tags_set_updated_at
before update on public.tags
for each row execute function public.set_updated_at();

create trigger experiences_set_updated_at
before update on public.experiences
for each row execute function public.set_updated_at();

create trigger user_experiences_set_updated_at
before update on public.user_experiences
for each row execute function public.set_updated_at();

create trigger experience_logs_set_updated_at
before update on public.experience_logs
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.experiences enable row level security;
alter table public.experience_tags enable row level security;
alter table public.user_experiences enable row level security;
alter table public.experience_logs enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "categories_read_public"
on public.categories for select
to anon, authenticated
using (true);

create policy "tags_read_public"
on public.tags for select
to anon, authenticated
using (true);

create policy "published_experiences_read_public"
on public.experiences for select
to anon, authenticated
using (publication_status = 'published');

create policy "published_experience_tags_read_public"
on public.experience_tags for select
to anon, authenticated
using (
  exists (
    select 1
    from public.experiences
    where experiences.id = experience_tags.experience_id
      and experiences.publication_status = 'published'
  )
);

create policy "user_experiences_select_own"
on public.user_experiences for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "user_experiences_insert_own"
on public.user_experiences for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "user_experiences_update_own"
on public.user_experiences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_experiences_delete_own"
on public.user_experiences for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and not exists (
    select 1
    from public.experience_logs
    where experience_logs.user_experience_id = user_experiences.id
  )
);

create policy "experience_logs_select_own"
on public.experience_logs for select
to authenticated
using (
  exists (
    select 1
    from public.user_experiences
    where user_experiences.id = experience_logs.user_experience_id
      and user_experiences.user_id = (select auth.uid())
  )
);

create policy "experience_logs_insert_own"
on public.experience_logs for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_experiences
    where user_experiences.id = experience_logs.user_experience_id
      and user_experiences.user_id = (select auth.uid())
  )
);

create policy "experience_logs_update_own"
on public.experience_logs for update
to authenticated
using (
  exists (
    select 1
    from public.user_experiences
    where user_experiences.id = experience_logs.user_experience_id
      and user_experiences.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.user_experiences
    where user_experiences.id = experience_logs.user_experience_id
      and user_experiences.user_id = (select auth.uid())
  )
);

create policy "experience_logs_delete_own"
on public.experience_logs for delete
to authenticated
using (
  exists (
    select 1
    from public.user_experiences
    where user_experiences.id = experience_logs.user_experience_id
      and user_experiences.user_id = (select auth.uid())
  )
);

commit;
