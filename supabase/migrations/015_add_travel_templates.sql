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
  values
    (
      'cruise-experience',
      'クルージングを体験する',
      '船の上で過ごす時間も楽しみながら、いつもと違う旅を体験する。',
      'outing',
      '/experiences/cruise-experience.webp',
      270,
      'outing',
      'multiple_days',
      'over_10000',
      1::smallint,
      null::smallint
    ),
    (
      'dream-country-travel',
      '行きたかった国に旅行する',
      'いつか行ってみたい国を追加して、旅の思い出をひとつずつ残す。',
      'outing',
      '/experiences/dream-country-travel.webp',
      280,
      'outing',
      'multiple_days',
      'over_10000',
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

-- The country template starts with two inspiring examples. Users can add,
-- rename, or remove countries in their own copied list.
with starter(title, display_order) as (
  values
    ('ノルウェーに行く', 10),
    ('スペインに行く', 20)
)
insert into public.template_items (template_id, title, category_id, display_order)
select template.id, starter.title, category.id, starter.display_order
from starter
join public.templates template on template.slug = 'dream-country-travel'
join public.categories category on category.slug = 'outing'
where not exists (
  select 1
  from public.template_items existing
  where existing.template_id = template.id
    and existing.title = starter.title
);

do $$
declare
  new_template_count integer;
  country_starter_count integer;
begin
  select count(*) into new_template_count
  from public.templates
  where publication_status = 'published'
    and slug in ('cruise-experience', 'dream-country-travel')
    and image_path like '/experiences/%.webp';

  select count(*) into country_starter_count
  from public.template_items item
  join public.templates template on template.id = item.template_id
  where template.slug = 'dream-country-travel'
    and item.title in ('ノルウェーに行く', 'スペインに行く');

  if new_template_count <> 2 then
    raise exception 'Expected 2 new published travel templates with WebP images, found %', new_template_count;
  end if;
  if country_starter_count <> 2 then
    raise exception 'Expected 2 starter countries, found %', country_starter_count;
  end if;
end
$$;

commit;
