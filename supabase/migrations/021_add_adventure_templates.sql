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
    ('live-concert', 'ライブに行く', '好きな音楽を会場いっぱいに感じて、心が動く一日を楽しむ。', 'outing', '/experiences/live-concert.webp', 390, 'outing', 'half_day', 'over_10000', 1::smallint, null::smallint),
    ('bungee-jump', 'バンジージャンプをする', '勇気を出して一歩を踏み出し、空へ飛び出す瞬間を体験する。', 'outing', '/experiences/bungee-jump.webp', 400, 'outing', 'half_day', 'over_10000', 1::smallint, null::smallint),
    ('skydiving', 'スカイダイビングをする', '大空へ飛び出して、雲の上から広がる景色を全身で味わう。', 'outing', '/experiences/skydiving.webp', 410, 'outing', 'half_day', 'over_10000', 1::smallint, null::smallint),
    ('scuba-diving', 'スキューバダイビングをする', '水の中で呼吸しながら、海の景色や生きものとの出会いを楽しむ。', 'outing', '/experiences/scuba-diving.webp', 420, 'outing', 'half_day', 'over_10000', 1::smallint, null::smallint),
    ('camping', 'キャンプに行く', '自然の中に居場所をつくって、いつもと違う一日をゆっくり過ごす。', 'outing', '/experiences/camping.webp', 430, 'outing', 'multiple_days', 'over_10000', 1::smallint, null::smallint),
    ('dream-mountain-climb', '行きたかった山に登る', 'いつか登りたかった山を追加して、山頂まで歩いた思い出をひとつずつ残す。', 'outing', '/experiences/dream-mountain-climb.webp', 440, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint)
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
    ('富士山に登る', 10),
    ('屋久島・宮之浦岳に登る', 20)
)
insert into public.template_items (template_id, title, category_id, display_order)
select template.id, starter.title, category.id, starter.display_order
from starter
join public.templates template on template.slug = 'dream-mountain-climb'
join public.categories category on category.slug = 'outing'
where not exists (
  select 1
  from public.template_items existing
  where existing.template_id = template.id
    and existing.title = starter.title
);

do $$
declare
  template_count integer;
  starter_item_count integer;
begin
  select count(*) into template_count
  from public.templates template
  join public.categories category on category.id = template.category_id
  where template.slug in (
      'live-concert',
      'bungee-jump',
      'skydiving',
      'scuba-diving',
      'camping',
      'dream-mountain-climb'
    )
    and template.publication_status = 'published'
    and template.image_path like '/experiences/%.webp'
    and category.slug = 'outing';

  select count(*) into starter_item_count
  from public.template_items item
  join public.templates template on template.id = item.template_id
  where template.slug = 'dream-mountain-climb'
    and item.title in ('富士山に登る', '屋久島・宮之浦岳に登る');

  if template_count <> 6 then
    raise exception 'Expected 6 published outing templates with WebP images, found %', template_count;
  end if;
  if starter_item_count <> 2 then
    raise exception 'Expected 2 starter mountains, found %', starter_item_count;
  end if;
end
$$;

commit;
