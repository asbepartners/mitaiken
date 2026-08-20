begin;

-- Phase 1: keep the existing app compatible while giving user_experiences
-- its own copied fields ("my experience").
alter table public.user_experiences
  add column if not exists title text,
  add column if not exists category_id uuid references public.categories(id) on delete restrict,
  add column if not exists image_path text,
  add column if not exists source_template_id uuid references public.experiences(id) on delete set null;

-- Backfill existing rows from the current operation template/master.
update public.user_experiences ue
set
  title = coalesce(ue.title, e.title),
  category_id = coalesce(ue.category_id, e.category_id),
  image_path = coalesce(ue.image_path, e.image_path),
  source_template_id = coalesce(ue.source_template_id, e.id)
from public.experiences e
where ue.experience_id = e.id
  and (
    ue.title is null
    or ue.category_id is null
    or ue.source_template_id is null
  );

-- Existing rows are now self-contained enough for the new UI.
-- Do NOT make these NOT NULL yet: the old UI still inserts rows in the old shape.
create index if not exists user_experiences_source_template_idx
  on public.user_experiences (source_template_id);

-- A user-owned "summary/group".
create table if not exists public.experience_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experience_group_items (
  group_id uuid not null references public.experience_groups(id) on delete cascade,
  user_experience_id uuid not null references public.user_experiences(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (group_id, user_experience_id)
);

create index if not exists experience_groups_user_idx
  on public.experience_groups (user_id, created_at desc);

create index if not exists experience_group_items_experience_idx
  on public.experience_group_items (user_experience_id);

drop trigger if exists experience_groups_set_updated_at on public.experience_groups;
create trigger experience_groups_set_updated_at
before update on public.experience_groups
for each row execute function public.set_updated_at();

alter table public.experience_groups enable row level security;
alter table public.experience_group_items enable row level security;

-- Re-runnable policy creation.
drop policy if exists "experience_groups_select_own" on public.experience_groups;
create policy "experience_groups_select_own"
on public.experience_groups for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "experience_groups_insert_own" on public.experience_groups;
create policy "experience_groups_insert_own"
on public.experience_groups for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "experience_groups_update_own" on public.experience_groups;
create policy "experience_groups_update_own"
on public.experience_groups for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "experience_groups_delete_own" on public.experience_groups;
create policy "experience_groups_delete_own"
on public.experience_groups for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "experience_group_items_select_own" on public.experience_group_items;
create policy "experience_group_items_select_own"
on public.experience_group_items for select
to authenticated
using (
  exists (
    select 1
    from public.experience_groups g
    where g.id = experience_group_items.group_id
      and g.user_id = (select auth.uid())
  )
);

drop policy if exists "experience_group_items_insert_own" on public.experience_group_items;
create policy "experience_group_items_insert_own"
on public.experience_group_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.experience_groups g
    where g.id = experience_group_items.group_id
      and g.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.user_experiences ue
    where ue.id = experience_group_items.user_experience_id
      and ue.user_id = (select auth.uid())
  )
);

drop policy if exists "experience_group_items_update_own" on public.experience_group_items;
create policy "experience_group_items_update_own"
on public.experience_group_items for update
to authenticated
using (
  exists (
    select 1
    from public.experience_groups g
    where g.id = experience_group_items.group_id
      and g.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.experience_groups g
    where g.id = experience_group_items.group_id
      and g.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.user_experiences ue
    where ue.id = experience_group_items.user_experience_id
      and ue.user_id = (select auth.uid())
  )
);

drop policy if exists "experience_group_items_delete_own" on public.experience_group_items;
create policy "experience_group_items_delete_own"
on public.experience_group_items for delete
to authenticated
using (
  exists (
    select 1
    from public.experience_groups g
    where g.id = experience_group_items.group_id
      and g.user_id = (select auth.uid())
  )
);

commit;
