begin;

-- Final pre-release category catalog: six active categories.
insert into public.categories (slug, name, display_order, is_active)
values
  ('outing', 'おでかけ', 10, true),
  ('food', '食べる', 20, true),
  ('hobby', '趣味', 30, true),
  ('learning', '学ぶ', 40, true),
  ('making-experience', 'ものづくり体験', 50, true),
  ('beauty-health', '美容・健康', 60, true)
on conflict (slug) do update set
  name = excluded.name,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

update public.categories
set is_active = false,
    updated_at = now()
where slug not in (
  'outing',
  'food',
  'hobby',
  'learning',
  'making-experience',
  'beauty-health'
)
and is_active;

-- Keep the existing prefecture template ID, while adopting the final slug.
-- User-owned copies retain their records; only their provenance slug follows
-- the renamed master. Test data itself is reset in a later migration.
update public.user_experiences
set source_template_slug = 'unvisited-prefectures',
    updated_at = now()
where source_template_slug = 'prefecture-collection';

update public.templates
set slug = 'unvisited-prefectures',
    updated_at = now()
where slug = 'prefecture-collection';

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
    ('pottery-bowl', '陶芸で自分のお茶碗を作る', '土をこねて、世界にひとつのお茶碗を。', 'making-experience', '/experiences/pottery-bowl.png', 10, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint),
    ('spice-curry', 'スパイスからカレーを作る', '香りを重ねて、いつもと違う台所の時間。', 'food', '/experiences/spice-curry.png', 20, 'home', 'half_day', 'within_2000', 1::smallint, null::smallint),
    ('solo-ferry', '一人でフェリーに乗る', '潮風とエンジン音を楽しむ、小さな旅。', 'outing', '/experiences/solo-ferry.png', 30, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint),
    ('planetarium', 'プラネタリウムへ行く', '暗闇に浮かぶ星空を見上げる静かな時間。', 'outing', '/experiences/planetarium.png', 40, 'outing', 'within_1h', 'within_2000', 1::smallint, null::smallint),
    ('watercolor', '水彩で風景を描く', '紙の上に色がにじんでいく瞬間を楽しむ。', 'hobby', null, 50, 'either', 'half_day', 'within_2000', 1::smallint, null::smallint),
    ('solo-kissaten', '一人で喫茶店に行く', '誰にも急かされない、自分だけの午後。', 'food', null, 60, 'outing', 'within_1h', 'within_2000', 1::smallint, null::smallint),
    ('night-market', '夜市・朝市をのぞきに行く', '知らない匂いと活気に出会う。', 'outing', null, 70, 'outing', 'half_day', 'within_2000', 2::smallint, null::smallint),
    ('handmade-bread', 'パンを一から手ごねで焼く', '焼きたての香りまで楽しむ。', 'food', null, 80, 'home', 'half_day', 'within_2000', 1::smallint, null::smallint),
    ('night-hike', '夜の山でナイトハイクをする', '夜道と星空をいつもと違う感覚で歩く。', 'outing', null, 90, 'outing', 'half_day', 'within_10000', 2::smallint, null::smallint),
    ('sake-tasting', '日本酒の利き酒をしてみる', '香りや味の違いを楽しんでみる。', 'food', null, 100, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint),
    ('leather-craft', '革小物を自分の手で作る', '使うほどになじむものを自分の手で。', 'making-experience', null, 110, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint),
    ('unfamiliar-cuisine', '食べたことのない国の料理店に入る', '知らない味との出会いを小さな旅に。', 'food', null, 120, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint),
    ('stargazing', '天体観測に出かける', '教科書の星を自分の目で見てみる。', 'outing', null, 130, 'outing', 'half_day', 'within_10000', 2::smallint, null::smallint),
    ('calligraphy', '書道で好きな言葉を書く', '墨と一筆に集中する静かな時間。', 'hobby', null, 140, 'either', 'within_1h', 'within_2000', 1::smallint, null::smallint),
    ('day-trip-onsen', '日帰り温泉でひとり旅気分を味わう', '湯につかって帰るだけの小さな旅行。', 'outing', null, 150, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint),
    ('terrarium', 'テラリウムで小さな庭を作る', '机の上に自分だけの景色を作る。', 'making-experience', null, 160, 'home', 'within_1h', 'within_10000', 1::smallint, null::smallint),
    ('unvisited-prefectures', 'まだ行ったことのない都道府県に行く', '未訪問の都道府県を追加して、訪れた記録をひとつずつ残す。', 'outing', null, 170, 'outing', 'multiple_days', 'over_10000', 1::smallint, null::smallint),
    ('goshuin-collection', '御朱印を集める', '行きたい神社やお寺を追加して、お参りの記録をひとつずつ残す。', 'outing', null, 180, 'outing', 'within_1h', 'within_2000', 1::smallint, null::smallint),
    ('restaurant-collection', '気になっているレストランに行く', '気になるお店を見つけたら、いつか行きたい場所として残しておく。', 'food', null, 190, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint),
    ('learn-english', '英会話を学ぶ', '知っている単語をつないで、英語で気持ちが通じる楽しさを味わう。', 'learning', null, 200, 'either', 'within_1h', 'within_10000', 1::smallint, null::smallint),
    ('fp-qualification', 'ファイナンシャルプランナーの資格を取る', '暮らしとお金の知識を学び、資格という形に残す。', 'learning', null, 210, 'home', 'multiple_days', 'over_10000', 1::smallint, null::smallint),
    ('learn-guitar', 'ギターを習う', '好きな曲の最初の一音を、自分の手で鳴らしてみる。', 'learning', null, 220, 'either', 'within_1h', 'within_10000', 1::smallint, null::smallint),
    ('tin-sake-cup', '錫（すず）のぐい呑み作りを体験する', '錫を型に流し、刻印を入れて自分だけのぐい呑みに仕上げる。', 'making-experience', null, 230, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint),
    ('glass-craft', 'ガラス工芸を体験する', '熱いガラスを形づくり、光を通す自分だけの作品を作る。', 'making-experience', null, 240, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint),
    ('try-tai-chi', '太極拳をやってみる', 'ゆっくりした動きと呼吸に集中し、体を心地よく動かしてみる。', 'beauty-health', null, 250, 'outing', 'within_1h', 'within_2000', 1::smallint, null::smallint),
    ('join-gym', 'ジムに通う', '自分に合う運動を見つけるため、まずはジムの扉を開けてみる。', 'beauty-health', null, 260, 'outing', 'half_day', 'within_10000', 1::smallint, null::smallint)
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
  image_path = coalesce(excluded.image_path, current_template.image_path),
  publication_status = excluded.publication_status,
  display_order = excluded.display_order,
  location_option_id = excluded.location_option_id,
  duration_option_id = excluded.duration_option_id,
  budget_option_id = excluded.budget_option_id,
  min_people = excluded.min_people,
  max_people = excluded.max_people,
  updated_at = now();

-- These two entries were rejected while finalizing the pre-release catalog.
delete from public.templates
where slug in ('sento-tour', 'letterpress');

-- No other published template belongs to the finalized initial catalog.
update public.templates
set publication_status = 'archived',
    updated_at = now()
where publication_status = 'published'
  and slug not in (
    'pottery-bowl', 'spice-curry', 'solo-ferry', 'planetarium',
    'watercolor', 'solo-kissaten', 'night-market', 'handmade-bread',
    'night-hike', 'sake-tasting', 'leather-craft', 'unfamiliar-cuisine',
    'stargazing', 'calligraphy', 'day-trip-onsen', 'terrarium',
    'unvisited-prefectures', 'goshuin-collection', 'restaurant-collection',
    'learn-english', 'fp-qualification', 'learn-guitar', 'tin-sake-cup',
    'glass-craft', 'try-tai-chi', 'join-gym'
  );

-- Reconcile the three collection templates to exactly two starter items each.
update public.template_items item
set title = case item.title
      when '○○ダイニング' then '千疋屋フルーツパーラー'
      when '○○鮨' then '帝国ホテルのレストラン'
      else item.title
    end,
    display_order = case item.title
      when '○○ダイニング' then 10
      when '○○鮨' then 20
      else item.display_order
    end,
    updated_at = now()
from public.templates template
where item.template_id = template.id
  and template.slug = 'restaurant-collection'
  and item.title in ('○○ダイニング', '○○鮨');

delete from public.template_items item
using public.templates template
where item.template_id = template.id
  and template.slug in (
    'unvisited-prefectures',
    'goshuin-collection',
    'restaurant-collection'
  )
  and (template.slug, item.title) not in (
    ('unvisited-prefectures', '北海道に行く'),
    ('unvisited-prefectures', '沖縄県に行く'),
    ('goshuin-collection', '出雲大社'),
    ('goshuin-collection', '伊勢神宮'),
    ('restaurant-collection', '千疋屋フルーツパーラー'),
    ('restaurant-collection', '帝国ホテルのレストラン')
  );

with starter(template_slug, title, category_slug, display_order) as (
  values
    ('unvisited-prefectures', '北海道に行く', 'outing', 10),
    ('unvisited-prefectures', '沖縄県に行く', 'outing', 20),
    ('goshuin-collection', '出雲大社', 'outing', 10),
    ('goshuin-collection', '伊勢神宮', 'outing', 20),
    ('restaurant-collection', '千疋屋フルーツパーラー', 'food', 10),
    ('restaurant-collection', '帝国ホテルのレストラン', 'food', 20)
)
insert into public.template_items (template_id, title, category_id, display_order)
select template.id, starter.title, category.id, starter.display_order
from starter
join public.templates template on template.slug = starter.template_slug
join public.categories category on category.slug = starter.category_slug
where not exists (
  select 1
  from public.template_items existing
  where existing.template_id = template.id
    and existing.title = starter.title
);

with starter(template_slug, title, category_slug, display_order) as (
  values
    ('unvisited-prefectures', '北海道に行く', 'outing', 10),
    ('unvisited-prefectures', '沖縄県に行く', 'outing', 20),
    ('goshuin-collection', '出雲大社', 'outing', 10),
    ('goshuin-collection', '伊勢神宮', 'outing', 20),
    ('restaurant-collection', '千疋屋フルーツパーラー', 'food', 10),
    ('restaurant-collection', '帝国ホテルのレストラン', 'food', 20)
)
update public.template_items item
set category_id = category.id,
    display_order = starter.display_order,
    updated_at = now()
from starter
join public.templates template on template.slug = starter.template_slug
join public.categories category on category.slug = starter.category_slug
where item.template_id = template.id
  and item.title = starter.title;

-- Stop legacy tags from remaining attached to the two removed templates.
-- The template rows are deleted above, so FK cascade normally makes this a
-- no-op; retaining it documents and verifies the intended cleanup.
delete from public.template_tags relation
where not exists (
  select 1 from public.templates template where template.id = relation.template_id
);

do $$
declare
  active_category_count integer;
  published_template_count integer;
  starter_item_count integer;
begin
  select count(*) into active_category_count
  from public.categories
  where is_active;

  select count(*) into published_template_count
  from public.templates
  where publication_status = 'published';

  select count(*) into starter_item_count
  from public.template_items item
  join public.templates template on template.id = item.template_id
  where template.slug in (
    'unvisited-prefectures',
    'goshuin-collection',
    'restaurant-collection'
  );

  if active_category_count <> 6 then
    raise exception 'Expected 6 active categories, found %', active_category_count;
  end if;
  if published_template_count <> 26 then
    raise exception 'Expected 26 published templates, found %', published_template_count;
  end if;
  if starter_item_count <> 6 then
    raise exception 'Expected 6 collection starter items, found %', starter_item_count;
  end if;
end;
$$;

commit;
