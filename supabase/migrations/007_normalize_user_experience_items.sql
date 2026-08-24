begin;

-- Keep template provenance as IDs. User-owned titles remain independently editable.
alter table public.user_experiences
  add column if not exists source_template_id uuid references public.templates(id) on delete set null;

alter table public.user_experience_items
  add column if not exists source_template_item_id uuid references public.template_items(id) on delete set null,
  add column if not exists is_primary boolean not null default false;

update public.user_experiences ue
set source_template_id = t.id
from public.templates t
where ue.source_template_id is null
  and ue.source_template_slug = t.slug;

-- Identify existing copied children once, using the old title only for migration.
update public.user_experience_items uei
set source_template_item_id = ti.id
from public.user_experiences ue
join public.template_items ti on ti.template_id = ue.source_template_id
where uei.user_experience_id = ue.id
  and uei.source_template_item_id is null
  and lower(btrim(uei.title)) = lower(btrim(ti.title));

-- Merge duplicate copies of the same master child without losing their records.
with ranked as (
  select id,
    first_value(id) over (
      partition by user_experience_id, source_template_item_id
      order by created_at, id
    ) as keep_id,
    row_number() over (
      partition by user_experience_id, source_template_item_id
      order by created_at, id
    ) as item_number
  from public.user_experience_items
  where source_template_item_id is not null
)
update public.experience_logs logs
set user_experience_item_id = ranked.keep_id
from ranked
where ranked.item_number > 1
  and logs.user_experience_item_id = ranked.id;

with ranked as (
  select id,
    row_number() over (
      partition by user_experience_id, source_template_item_id
      order by created_at, id
    ) as item_number
  from public.user_experience_items
  where source_template_item_id is not null
)
delete from public.user_experience_items items
using ranked
where ranked.item_number > 1 and items.id = ranked.id;

-- A single experience also has one internal item. This gives every new log a target.
insert into public.user_experience_items(id, user_experience_id, title, is_primary, sort_order)
select 'primary-' || ue.id::text, ue.id, ue.title, true, 0
from public.user_experiences ue
where not exists (
  select 1 from public.template_items ti where ti.template_id = ue.source_template_id
)
and not exists (
  select 1 from public.user_experience_items uei
  where uei.user_experience_id = ue.id and uei.is_primary
);

update public.experience_logs logs
set user_experience_item_id = uei.id
from public.user_experience_items uei
where logs.user_experience_item_id is null
  and uei.user_experience_id = logs.user_experience_id
  and uei.is_primary;

create unique index if not exists user_experiences_user_source_template_id_uidx
  on public.user_experiences(user_id, source_template_id)
  where source_template_id is not null;
create unique index if not exists user_experience_items_source_uidx
  on public.user_experience_items(user_experience_id, source_template_item_id)
  ;
create unique index if not exists user_experience_items_primary_uidx
  on public.user_experience_items(user_experience_id)
  where is_primary;

commit;
