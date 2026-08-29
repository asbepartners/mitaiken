begin;

with seed(
  slug,
  title,
  description,
  category_slug,
  image_path,
  display_order,
  location_code,
  duration_code,
  budget_code,
  min_people,
  max_people
) as (
  values (
    'seasonal-flower-spots',
    '季節の花の名所を見に行く',
    '季節ごとに出会える花の名所を追加して、色とりどりの思い出を残す。',
    'outing',
    '/experiences/seasonal-flower-spots.webp',
    290,
    'outing',
    'half_day',
    'within_10000',
    1::smallint,
    null::smallint
  )
)
insert into public.templates as current_template (
  slug,
  title,
  description,
  category_id,
  image_path,
  publication_status,
  display_order,
  location_option_id,
  duration_option_id,
  budget_option_id,
  min_people,
  max_people
)
select
  seed.slug,
  seed.title,
  seed.description,
  category.id,
  seed.image_path,
  'published',
  seed.display_order,
  location.id,
  duration.id,
  budget.id,
  seed.min_people,
  seed.max_people
from seed
join public.categories category on category.slug = seed.category_slug
join public.location_options location on location.code = seed.location_code
join public.duration_options duration on duration.code = seed.duration_code
join public.budget_options budget on budget.code = seed.budget_code
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  category_id = excluded.category_id,
  image_path = excluded.image_path,
  publication_status = excluded.publication_status,
  display_order = excluded.display_order,
  location_option_id = excluded.location_option_id,
  duration_option_id = excluded.duration_option_id,
  budget_option_id = excluded.budget_option_id,
  min_people = excluded.min_people,
  max_people = excluded.max_people,
  updated_at = now();

with starter(title, display_order) as (
  values
    ('藤棚の名所に行く', 10),
    ('あじさいの名所に行く', 20)
)
insert into public.template_items (template_id, title, category_id, display_order)
select template.id, starter.title, category.id, starter.display_order
from starter
join public.templates template on template.slug = 'seasonal-flower-spots'
join public.categories category on category.slug = 'outing'
where not exists (
  select 1
  from public.template_items existing
  where existing.template_id = template.id
    and existing.title = starter.title
);

do $$
declare
  flower_template_count integer;
  starter_item_count integer;
begin
  select count(*) into flower_template_count
  from public.templates
  where slug = 'seasonal-flower-spots'
    and publication_status = 'published'
    and image_path = '/experiences/seasonal-flower-spots.webp';

  select count(*) into starter_item_count
  from public.template_items item
  join public.templates template on template.id = item.template_id
  where template.slug = 'seasonal-flower-spots'
    and item.title in ('藤棚の名所に行く', 'あじさいの名所に行く');

  if flower_template_count <> 1 then
    raise exception 'Expected the published seasonal flower template with its WebP image, found %', flower_template_count;
  end if;
  if starter_item_count <> 2 then
    raise exception 'Expected 2 seasonal flower starter items, found %', starter_item_count;
  end if;
end
$$;

commit;
