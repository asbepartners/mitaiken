begin;

-- テンプレートからコピーした項目も、ユーザーが追加した項目も同じ形で保持する。
-- id はブラウザで先に発行するため text とし、オフライン操作後も同じ項目として同期できるようにする。
create table if not exists public.user_experience_items (
  id text primary key,
  user_experience_id uuid not null references public.user_experiences(id) on delete cascade,
  title text not null check (char_length(btrim(title)) > 0),
  memo text,
  related_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.experience_logs
  add column if not exists user_experience_item_id text
    references public.user_experience_items(id) on delete set null;

create index if not exists user_experience_items_parent_order_idx
  on public.user_experience_items(user_experience_id, sort_order, created_at);
create index if not exists experience_logs_item_idx
  on public.experience_logs(user_experience_item_id);

drop trigger if exists user_experience_items_set_updated_at on public.user_experience_items;
create trigger user_experience_items_set_updated_at
  before update on public.user_experience_items
  for each row execute function public.set_updated_at();

alter table public.user_experience_items enable row level security;

create policy "user_experience_items_select_own" on public.user_experience_items
  for select to authenticated
  using (exists (
    select 1 from public.user_experiences ue
    where ue.id = user_experience_items.user_experience_id
      and ue.user_id = (select auth.uid())
  ));
create policy "user_experience_items_insert_own" on public.user_experience_items
  for insert to authenticated
  with check (exists (
    select 1 from public.user_experiences ue
    where ue.id = user_experience_items.user_experience_id
      and ue.user_id = (select auth.uid())
  ));
create policy "user_experience_items_update_own" on public.user_experience_items
  for update to authenticated
  using (exists (
    select 1 from public.user_experiences ue
    where ue.id = user_experience_items.user_experience_id
      and ue.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.user_experiences ue
    where ue.id = user_experience_items.user_experience_id
      and ue.user_id = (select auth.uid())
  ));
create policy "user_experience_items_delete_own" on public.user_experience_items
  for delete to authenticated
  using (exists (
    select 1 from public.user_experiences ue
    where ue.id = user_experience_items.user_experience_id
      and ue.user_id = (select auth.uid())
  ));

grant select, insert, update, delete on public.user_experience_items to authenticated;

commit;
