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
    -- beauty-health
    (
      'human-dock',
      '人間ドックを受ける',
      '自分の体とじっくり向き合い、これからの健康を考える。',
      'beauty-health',
      '/experiences/human-dock.webp',
      270,
      'outing',
      'half_day',
      'over_10000',
      1::smallint,
      1::smallint
    ),
    (
      'try-yoga',
      'ヨガを体験する',
      '呼吸と体の動きに意識を向けて、心地よく体を整える。',
      'beauty-health',
      '/experiences/try-yoga.webp',
      280,
      'either',
      'within_1h',
      'within_10000',
      1::smallint,
      null::smallint
    ),
    (
      'try-pilates',
      'ピラティスを体験する',
      'ゆっくりと体を動かしながら、姿勢や体幹を意識してみる。',
      'beauty-health',
      '/experiences/try-pilates.webp',
      290,
      'outing',
      'within_1h',
      'within_10000',
      1::smallint,
      null::smallint
    ),
    (
      'sauna-rock-bath',
      '岩盤浴やサウナでととのう',
      '温かな空間でゆっくり汗を流し、心と体をリフレッシュする。',
      'beauty-health',
      '/experiences/sauna-rock-bath.webp',
      300,
      'outing',
      'half_day',
      'within_10000',
      1::smallint,
      null::smallint
    ),
    -- learning
    (
      'one-off-culture-class',
      'カルチャーセンターの単発講座に出てみる',
      '気になっていたテーマを、まずは一度気軽に学んでみる。',
      'learning',
      '/experiences/one-off-culture-class.webp',
      230,
      'outing',
      'half_day',
      'within_10000',
      1::smallint,
      null::smallint
    ),
    (
      'library-serendipitous-book',
      '図書館で偶然の一冊に出会う',
      '書棚をゆっくり眺めて、思いがけない一冊との出会いを楽しむ。',
      'learning',
      '/experiences/library-serendipitous-book.webp',
      240,
      'outing',
      'within_1h',
      'free',
      1::smallint,
      1::smallint
    ),
    -- for-others
    (
      'fulfill-someones-wish',
      '誰かが「やりたかったこと」を叶える',
      '大切な人の願いに耳を傾け、その実現をそっと後押しする。',
      'for-others',
      '/experiences/fulfill-someones-wish.webp',
      350,
      'either',
      'full_day',
      'over_10000',
      2::smallint,
      null::smallint
    ),
    (
      'join-volunteer-activity',
      'ボランティアに参加する',
      '自分にできることを持ち寄って、誰かや地域のために活動する。',
      'for-others',
      '/experiences/join-volunteer-activity.webp',
      360,
      'outing',
      'half_day',
      'free',
      2::smallint,
      null::smallint
    ),
    -- hobby
    (
      'sell-handmade-creation',
      '趣味で作ったものを出品する',
      '心を込めて作ったものを、誰かに届ける一歩を踏み出す。',
      'hobby',
      '/experiences/sell-handmade-creation.webp',
      150,
      'outing',
      'full_day',
      'within_10000',
      1::smallint,
      null::smallint
    ),
    -- making-experience (共通条件: outing / half_day / within_10000 / 1人以上)
    (
      'make-silver-ring',
      'シルバーリングを作る',
      '金属を叩いたり磨いたりしながら、自分だけの指輪を作る。',
      'making-experience',
      '/experiences/make-silver-ring.webp',
      250,
      'outing',
      'half_day',
      'within_10000',
      1::smallint,
      null::smallint
    ),
    (
      'try-kintsugi',
      '金継ぎを体験する',
      '欠けたり割れたりした器を、自分の手で美しくよみがえらせる。',
      'making-experience',
      '/experiences/try-kintsugi.webp',
      260,
      'outing',
      'half_day',
      'within_10000',
      1::smallint,
      null::smallint
    ),
    (
      'try-indigo-dyeing',
      '藍染めを体験する',
      '布を藍に染めて、色や模様が生まれる瞬間を楽しむ。',
      'making-experience',
      '/experiences/try-indigo-dyeing.webp',
      270,
      'outing',
      'half_day',
      'within_10000',
      1::smallint,
      null::smallint
    ),
    (
      'make-food-sample',
      '食品サンプルを作る',
      '本物そっくりの料理を、自分の手で形にしてみる。',
      'making-experience',
      '/experiences/make-food-sample.webp',
      280,
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

do $$
declare
  new_template_count integer;
begin
  select count(*) into new_template_count
  from public.templates template
  join public.categories category on category.id = template.category_id
  where template.slug in (
      'human-dock',
      'try-yoga',
      'try-pilates',
      'sauna-rock-bath',
      'one-off-culture-class',
      'library-serendipitous-book',
      'fulfill-someones-wish',
      'join-volunteer-activity',
      'sell-handmade-creation',
      'make-silver-ring',
      'try-kintsugi',
      'try-indigo-dyeing',
      'make-food-sample'
    )
    and template.publication_status = 'published'
    and template.image_path like '/experiences/%.webp'
    and category.slug in ('beauty-health', 'learning', 'for-others', 'hobby', 'making-experience');

  if new_template_count <> 13 then
    raise exception 'Expected 13 new published templates with WebP images, found %', new_template_count;
  end if;
end
$$;

commit;
