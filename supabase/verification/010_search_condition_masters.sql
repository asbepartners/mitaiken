-- Run after 010_search_condition_masters.sql.
-- This file is read-only and is not a migration.

-- 1. Active category master: expected 6 rows.
select slug, name, display_order, is_active
from public.categories
where is_active
order by display_order, slug;

-- 2. Search masters and their numeric/search metadata.
select 'location' as master, code, label, sort_order, is_active,
       jsonb_build_object('supports_home', supports_home, 'supports_outing', supports_outing) as rules
from public.location_options
union all
select 'duration', code, label, sort_order, is_active,
       jsonb_build_object('min_minutes', min_minutes, 'max_minutes', max_minutes)
from public.duration_options
union all
select 'budget', code, label, sort_order, is_active,
       jsonb_build_object('min_yen', min_yen, 'max_yen', max_yen)
from public.budget_options
union all
select 'people', code, label, sort_order, is_active,
       jsonb_build_object('query_min_people', query_min_people, 'query_max_people', query_max_people)
from public.people_search_options
order by master, sort_order;

-- 3. Published templates that still lack any migrated search condition.
-- Expected: 0 rows for the current seeded catalog.
select slug, title,
       location_option_id,
       duration_option_id,
       budget_option_id,
       min_people,
       max_people
from public.templates
where publication_status = 'published'
  and (
    location_option_id is null
    or duration_option_id is null
    or budget_option_id is null
    or min_people is null
  )
order by display_order, slug;

-- 4. Migrated template values with readable labels.
select template.slug,
       template.title,
       category.name as category,
       location.label as location,
       duration.label as duration,
       budget.label as budget,
       template.min_people,
       template.max_people
from public.templates template
left join public.categories category on category.id = template.category_id
left join public.location_options location on location.id = template.location_option_id
left join public.duration_options duration on duration.id = template.duration_option_id
left join public.budget_options budget on budget.id = template.budget_option_id
where template.publication_status = 'published'
order by template.display_order, template.slug;

-- 5. Custom experiences must remain unset until the user chooses conditions.
-- Review only: rows returned here are originals with their new nullable fields.
select id, user_id, client_key, title,
       location_option_id,
       duration_option_id,
       budget_option_id,
       min_people,
       max_people
from public.user_experiences
where source_template_id is null
  and source_template_slug is null
order by created_at;

-- 6. Old combined category should no longer be referenced.
-- Expected: all three counts are 0.
select
  (select count(*) from public.templates t
   join public.categories c on c.id = t.category_id
   where c.slug = 'hobby-learning') as templates_count,
  (select count(*) from public.template_items ti
   join public.categories c on c.id = ti.category_id
   where c.slug = 'hobby-learning') as template_items_count,
  (select count(*) from public.user_experiences ue
   join public.categories c on c.id = ue.category_id
   where c.slug = 'hobby-learning') as user_experiences_count;
