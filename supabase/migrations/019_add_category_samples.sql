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
    ('milestone-birthday', '大切な人の節目の誕生日をお祝いする', 'これまでの感謝を込めて、大切な人の節目の誕生日をお祝いする。', 'for-others', '/experiences/milestone-birthday.webp', 300, 'either', 'half_day', 'over_10000', 2::smallint, null::smallint),
    ('surprise-party', 'サプライズパーティをする', '大切な人の喜ぶ顔を思い浮かべながら、内緒でお祝いを準備する。', 'for-others', '/experiences/surprise-party.webp', 310, 'either', 'half_day', 'within_10000', 2::smallint, null::smallint),
    ('cook-for-someone-special', '大切な人に手料理をふるまう', '相手の好きなものを考えて、心を込めた料理を作る。', 'for-others', '/experiences/cook-for-someone-special.webp', 320, 'home', 'half_day', 'within_10000', 2::smallint, null::smallint),
    ('gift-family-trip', '家族に旅行をプレゼントする', '行き先を考えるところから楽しんで、家族に旅の思い出を贈る。', 'for-others', '/experiences/gift-family-trip.webp', 330, 'outing', 'multiple_days', 'over_10000', 2::smallint, null::smallint),
    ('write-thank-you-letter', '誰かに感謝の手紙を書く', '普段は言葉にできない感謝を、自分の文字で伝える。', 'for-others', '/experiences/write-thank-you-letter.webp', 340, 'either', 'within_1h', 'within_2000', 1::smallint, null::smallint),
    ('first-pet-at-home', '初めてペットと暮らす', '新しい家族を迎えて、一緒に過ごす暮らしを始める。', 'lifestyle', '/experiences/first-pet-at-home.webp', 350, 'home', 'multiple_days', 'over_10000', 1::smallint, null::smallint),
    ('home-vegetable-garden', '家庭菜園を始める', '小さな苗を植えて、育てて味わう楽しみを暮らしに加える。', 'lifestyle', '/experiences/home-vegetable-garden.webp', 360, 'home', 'half_day', 'within_10000', 1::smallint, null::smallint),
    ('first-solo-living', '一人暮らしを始める', '自分で選んだものに囲まれて、自分らしい暮らしを始める。', 'lifestyle', '/experiences/first-solo-living.webp', 370, 'home', 'multiple_days', 'over_10000', 1::smallint, 1::smallint),
    ('workation', 'ワーケーションをする', 'いつもと違う場所に滞在しながら、仕事と旅の時間を楽しむ。', 'lifestyle', '/experiences/workation.webp', 380, 'outing', 'multiple_days', 'over_10000', 1::smallint, null::smallint)
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
  sample_count integer;
begin
  select count(*) into sample_count
  from public.templates template
  join public.categories category on category.id = template.category_id
  where template.slug in (
      'milestone-birthday',
      'surprise-party',
      'cook-for-someone-special',
      'gift-family-trip',
      'write-thank-you-letter',
      'first-pet-at-home',
      'home-vegetable-garden',
      'first-solo-living',
      'workation'
    )
    and template.publication_status = 'published'
    and template.image_path like '/experiences/%.webp'
    and (
      (category.slug = 'for-others' and template.slug in (
        'milestone-birthday',
        'surprise-party',
        'cook-for-someone-special',
        'gift-family-trip',
        'write-thank-you-letter'
      ))
      or
      (category.slug = 'lifestyle' and template.slug in (
        'first-pet-at-home',
        'home-vegetable-garden',
        'first-solo-living',
        'workation'
      ))
    );

  if sample_count <> 9 then
    raise exception 'Expected 9 published category samples with WebP images, found %', sample_count;
  end if;
end
$$;

commit;
