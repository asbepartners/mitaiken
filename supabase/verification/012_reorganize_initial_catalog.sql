-- Run after 012_reorganize_initial_catalog.sql.
-- This file is read-only and is not a migration.

-- 1. Exactly six active categories, in the agreed order.
select slug, name, display_order
from public.categories
where is_active
order by display_order, slug;

-- 2. Exactly 26 published templates with all agreed search conditions.
select
  template.display_order,
  template.slug,
  template.title,
  category.name as category,
  location.label as location,
  duration.label as duration,
  budget.label as budget,
  template.min_people,
  template.max_people,
  template.image_path
from public.templates template
join public.categories category on category.id = template.category_id
join public.location_options location on location.id = template.location_option_id
join public.duration_options duration on duration.id = template.duration_option_id
join public.budget_options budget on budget.id = template.budget_option_id
where template.publication_status = 'published'
order by template.display_order, template.slug;

-- 3. The three collection templates and their six starter items.
select
  template.slug as template_slug,
  template.title as template_title,
  item.display_order,
  item.title as starter_title
from public.templates template
join public.template_items item on item.template_id = template.id
where template.slug in (
  'unvisited-prefectures',
  'goshuin-collection',
  'restaurant-collection'
)
order by template.display_order, item.display_order, item.title;

-- 4. Compact count check: expected 6 / 26 / 3 / 6 / 0 / 0.
select
  (select count(*) from public.categories where is_active) as active_categories,
  (select count(*) from public.templates where publication_status = 'published') as published_templates,
  (select count(*) from public.templates
   where publication_status = 'published'
     and slug in ('unvisited-prefectures', 'goshuin-collection', 'restaurant-collection')) as collection_templates,
  (select count(*) from public.template_items item
   join public.templates template on template.id = item.template_id
   where template.slug in ('unvisited-prefectures', 'goshuin-collection', 'restaurant-collection')) as starter_items,
  (select count(*) from public.templates where slug in ('sento-tour', 'letterpress')) as removed_templates,
  (select count(*) from public.templates where slug = 'prefecture-collection') as old_prefecture_slug;

-- 5. Expected: no rows. Every published template has a complete category and
-- search-condition assignment.
select template.slug, template.title
from public.templates template
where template.publication_status = 'published'
  and (
    template.category_id is null
    or template.location_option_id is null
    or template.duration_option_id is null
    or template.budget_option_id is null
    or template.min_people is null
  )
order by template.display_order, template.slug;
