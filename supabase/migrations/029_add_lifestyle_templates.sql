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
      'use-housekeeping-service',
      '家事代行サービスを利用する',
      '家のことをプロに任せて、時間と気持ちにゆとりをつくる。',
      'lifestyle',
      '/experiences/use-housekeeping-service.webp',
      390,
      'home',
      'half_day',
      'within_10000',
      1::smallint,
      1::smallint
    ),
    (
      'declutter-home',
      '思い切って断捨離する',
      '持ち物をひとつずつ見直して、今の自分に必要なものだけを残す。',
      'lifestyle',
      '/experiences/declutter-home.webp',
      400,
      'home',
      'full_day',
      'free',
      1::smallint,
      1::smallint
    ),
    (
      'live-in-dream-city',
      '住んでみたかった街で暮らす',
      '憧れていた街に住まいを移して、新しい暮らしを始める。',
      'lifestyle',
      '/experiences/live-in-dream-city.webp',
      410,
      'home',
      'multiple_days',
      'over_10000',
      1::smallint,
      1::smallint
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

do $$
declare
  new_template_count integer;
begin
  select count(*) into new_template_count
  from public.templates template
  join public.categories category on category.id = template.category_id
  where template.slug in (
      'use-housekeeping-service',
      'declutter-home',
      'live-in-dream-city'
    )
    and template.publication_status = 'published'
    and template.image_path like '/experiences/%.webp'
    and category.slug = 'lifestyle';

  if new_template_count <> 3 then
    raise exception 'Expected 3 new published lifestyle templates with WebP images, found %', new_template_count;
  end if;
end
$$;

commit;
