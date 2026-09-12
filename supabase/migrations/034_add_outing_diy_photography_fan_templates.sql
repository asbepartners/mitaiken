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
      'visit-factory-night-view',
      '工場夜景を見に行く',
      '光に包まれた工場地帯を眺めて、昼間とは違う景色を楽しんでみよう。',
      'outing',
      '/experiences/visit-factory-night-view.webp',
      450,
      'outing',
      'half_day',
      'within_10000',
      1::smallint,
      null::smallint
    ),
    (
      'join-sightseeing-bus-tour',
      '観光バスツアーに参加する',
      '観光バスに乗って、いつもと違う目線から街や名所を巡ってみよう。',
      'outing',
      '/experiences/join-sightseeing-bus-tour.webp',
      460,
      'outing',
      'full_day',
      'within_10000',
      1::smallint,
      null::smallint
    ),
    (
      'watch-fireworks-from-boat',
      '船の上から花火を見る',
      '船の上から夜空と水面を彩る花火を眺めて、特別なひとときを楽しもう。',
      'outing',
      '/experiences/watch-fireworks-from-boat.webp',
      470,
      'outing',
      'half_day',
      'over_10000',
      1::smallint,
      null::smallint
    ),
    (
      'try-diy',
      'DIYに挑戦する',
      '自分の手で住まいや家具にひと工夫。暮らしを少しずつ心地よくしてみよう。',
      'lifestyle',
      '/experiences/try-diy.webp',
      480,
      'home',
      'full_day',
      'within_10000',
      1::smallint,
      1::smallint
    ),
    (
      'start-photography',
      'カメラを始める',
      '気になった景色や大切な瞬間を、自分のカメラで残してみよう。',
      'hobby',
      '/experiences/start-photography.webp',
      490,
      'either',
      'within_1h',
      'over_10000',
      1::smallint,
      1::smallint
    ),
    (
      'try-fan-activities',
      '推し活をしてみる',
      '好きな人や作品、キャラクターを、自分らしい方法で応援してみよう。',
      'hobby',
      '/experiences/try-fan-activities.webp',
      500,
      'either',
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

-- DIY is a collection template. These starter items are suggestions users can
-- record separately, while still allowing them to add their own DIY projects.
with items(template_slug, title, category_slug, display_order) as (
  values
    ('try-diy', '壁紙を張り替える', 'lifestyle', 10),
    ('try-diy', '壁を塗る', 'lifestyle', 20),
    ('try-diy', '棚を取り付ける', 'lifestyle', 30),
    ('try-diy', '家具をリメイクする', 'lifestyle', 40)
)
insert into public.template_items (template_id, title, category_id, display_order)
select template.id, item.title, category.id, item.display_order
from items item
join public.templates template on template.slug = item.template_slug
join public.categories category on category.slug = item.category_slug
where not exists (
  select 1
  from public.template_items existing
  where existing.template_id = template.id
    and existing.title = item.title
);

do $$
declare
  new_template_count integer;
  diy_item_count integer;
begin
  select count(*) into new_template_count
  from public.templates template
  where template.slug in (
      'visit-factory-night-view',
      'join-sightseeing-bus-tour',
      'watch-fireworks-from-boat',
      'try-diy',
      'start-photography',
      'try-fan-activities'
    )
    and template.publication_status = 'published'
    and template.description is not null
    and btrim(template.description) <> ''
    and template.image_path like '/experiences/%.webp';

  select count(*) into diy_item_count
  from public.template_items item
  join public.templates template on template.id = item.template_id
  where template.slug = 'try-diy'
    and item.title in (
      '壁紙を張り替える',
      '壁を塗る',
      '棚を取り付ける',
      '家具をリメイクする'
    );

  if new_template_count <> 6 then
    raise exception 'Expected 6 new published templates with descriptions and WebP images, found %', new_template_count;
  end if;
  if diy_item_count <> 4 then
    raise exception 'Expected 4 DIY starter items, found %', diy_item_count;
  end if;
end
$$;

commit;
