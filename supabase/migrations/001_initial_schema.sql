begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
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

-- 運営が提供する「管理方式の型紙」。
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  image_path text,
  publication_status text not null default 'draft'
    check (publication_status in ('draft','published','archived')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 型紙にあらかじめ含める体験。0件なら単独型紙。
create table public.template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  title text not null,
  category_id uuid references public.categories(id) on delete set null,
  image_path text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.template_tags (
  template_id uuid not null references public.templates(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (template_id, tag_id)
);

-- コピー後は完全にユーザー所有。テンプレートへのFKは持たない。
create table public.user_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category_id uuid references public.categories(id) on delete set null,
  image_path text,
  wishlisted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experience_logs (
  id uuid primary key default gen_random_uuid(),
  user_experience_id uuid not null references public.user_experiences(id) on delete cascade,
  experienced_year smallint not null check (experienced_year between 1900 and 9998),
  experienced_month smallint check (experienced_month between 1 and 12),
  experienced_day smallint check (experienced_day between 1 and 31),
  is_estimated boolean not null default false,
  memo text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (experienced_day is null or experienced_month is not null)
);

create table public.experience_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experience_group_items (
  group_id uuid not null references public.experience_groups(id) on delete cascade,
  user_experience_id uuid not null references public.user_experiences(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (group_id, user_experience_id)
);

create index templates_publication_order_idx on public.templates(publication_status, display_order, id);
create index template_items_template_idx on public.template_items(template_id, display_order, id);
create index template_tags_tag_idx on public.template_tags(tag_id, template_id);
create index user_experiences_user_idx on public.user_experiences(user_id, created_at desc);
create index experience_logs_parent_date_idx on public.experience_logs(user_experience_id, experienced_year, experienced_month, experienced_day, created_at);
create index experience_groups_user_idx on public.experience_groups(user_id, created_at desc);
create index experience_group_items_experience_idx on public.experience_group_items(user_experience_id);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger tags_set_updated_at before update on public.tags for each row execute function public.set_updated_at();
create trigger templates_set_updated_at before update on public.templates for each row execute function public.set_updated_at();
create trigger template_items_set_updated_at before update on public.template_items for each row execute function public.set_updated_at();
create trigger user_experiences_set_updated_at before update on public.user_experiences for each row execute function public.set_updated_at();
create trigger experience_logs_set_updated_at before update on public.experience_logs for each row execute function public.set_updated_at();
create trigger experience_groups_set_updated_at before update on public.experience_groups for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.templates enable row level security;
alter table public.template_items enable row level security;
alter table public.template_tags enable row level security;
alter table public.user_experiences enable row level security;
alter table public.experience_logs enable row level security;
alter table public.experience_groups enable row level security;
alter table public.experience_group_items enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "categories_read_public" on public.categories for select to anon, authenticated using (true);
create policy "tags_read_public" on public.tags for select to anon, authenticated using (true);
create policy "published_templates_read_public" on public.templates for select to anon, authenticated using (publication_status = 'published');
create policy "published_template_items_read_public" on public.template_items for select to anon, authenticated
using (exists (select 1 from public.templates t where t.id = template_items.template_id and t.publication_status = 'published'));
create policy "published_template_tags_read_public" on public.template_tags for select to anon, authenticated
using (exists (select 1 from public.templates t where t.id = template_tags.template_id and t.publication_status = 'published'));

create policy "user_experiences_select_own" on public.user_experiences for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_experiences_insert_own" on public.user_experiences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_experiences_update_own" on public.user_experiences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_experiences_delete_own" on public.user_experiences for delete to authenticated using ((select auth.uid()) = user_id);

create policy "experience_logs_select_own" on public.experience_logs for select to authenticated
using (exists (select 1 from public.user_experiences ue where ue.id = experience_logs.user_experience_id and ue.user_id = (select auth.uid())));
create policy "experience_logs_insert_own" on public.experience_logs for insert to authenticated
with check (exists (select 1 from public.user_experiences ue where ue.id = experience_logs.user_experience_id and ue.user_id = (select auth.uid())));
create policy "experience_logs_update_own" on public.experience_logs for update to authenticated
using (exists (select 1 from public.user_experiences ue where ue.id = experience_logs.user_experience_id and ue.user_id = (select auth.uid())))
with check (exists (select 1 from public.user_experiences ue where ue.id = experience_logs.user_experience_id and ue.user_id = (select auth.uid())));
create policy "experience_logs_delete_own" on public.experience_logs for delete to authenticated
using (exists (select 1 from public.user_experiences ue where ue.id = experience_logs.user_experience_id and ue.user_id = (select auth.uid())));

create policy "experience_groups_select_own" on public.experience_groups for select to authenticated using ((select auth.uid()) = user_id);
create policy "experience_groups_insert_own" on public.experience_groups for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "experience_groups_update_own" on public.experience_groups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "experience_groups_delete_own" on public.experience_groups for delete to authenticated using ((select auth.uid()) = user_id);

create policy "experience_group_items_select_own" on public.experience_group_items for select to authenticated
using (exists (select 1 from public.experience_groups g where g.id = experience_group_items.group_id and g.user_id = (select auth.uid())));
create policy "experience_group_items_insert_own" on public.experience_group_items for insert to authenticated
with check (
  exists (select 1 from public.experience_groups g where g.id = experience_group_items.group_id and g.user_id = (select auth.uid()))
  and exists (select 1 from public.user_experiences ue where ue.id = experience_group_items.user_experience_id and ue.user_id = (select auth.uid()))
);
create policy "experience_group_items_update_own" on public.experience_group_items for update to authenticated
using (exists (select 1 from public.experience_groups g where g.id = experience_group_items.group_id and g.user_id = (select auth.uid())))
with check (
  exists (select 1 from public.experience_groups g where g.id = experience_group_items.group_id and g.user_id = (select auth.uid()))
  and exists (select 1 from public.user_experiences ue where ue.id = experience_group_items.user_experience_id and ue.user_id = (select auth.uid()))
);
create policy "experience_group_items_delete_own" on public.experience_group_items for delete to authenticated
using (exists (select 1 from public.experience_groups g where g.id = experience_group_items.group_id and g.user_id = (select auth.uid())));

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.tags, public.templates, public.template_items, public.template_tags to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.user_experiences, public.experience_logs, public.experience_groups, public.experience_group_items to authenticated;

commit;
