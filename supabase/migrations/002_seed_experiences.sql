begin;

insert into public.categories (slug, name, display_order)
values
  ('food', '食べる', 10),
  ('outing', 'おでかけ', 20),
  ('hobby-learning', '趣味・学ぶ', 30),
  ('lifestyle', '暮らし', 40),
  ('beauty-health', '美容・健康', 50)
on conflict (slug) do update
set
  name = excluded.name,
  display_order = excluded.display_order;

insert into public.tags (slug, name, display_order)
values
  ('at-home', '家でできる', 10),
  ('solo-ok', 'ひとりOK', 20)
on conflict (slug) do update
set
  name = excluded.name,
  display_order = excluded.display_order;

with seed (
  slug,
  title,
  description,
  category_slug,
  image_path,
  place_label,
  duration_label,
  duration_minutes,
  cost_label,
  cost_level,
  display_order
) as (
  values
    ('pottery-bowl', '陶芸で自分のお茶碗を作る', '土をこねて、世界にひとつのお茶碗を。焼き上がりを待つ時間もまた楽しい。', 'hobby-learning', '/experiences/pottery-bowl.png', '陶芸教室', '2〜3時間', 150, '4,000〜6,000円', 2, 10),
    ('spice-curry', 'スパイスからカレーを作る', 'クミン、コリアンダー、ターメリック。香りを重ねていく、いつもと違う台所の時間。', 'food', '/experiences/spice-curry.png', '自宅', '1〜2時間', 90, '1,500円ほど', 1, 20),
    ('solo-ferry', '一人でフェリーに乗る', '行き先を決めずに、ただ海を渡る。潮風とエンジン音だけの数時間。', 'outing', '/experiences/solo-ferry.png', '港', '半日〜1日', 360, '3,000〜8,000円', 2, 30),
    ('planetarium', 'プラネタリウムへ行く', '暗闇に浮かぶ星空を見上げる、静かな1時間。何も考えなくていい贅沢。', 'outing', '/experiences/planetarium.png', '科学館', '1時間ほど', 60, '〜1,500円', 1, 40),
    ('watercolor', '水彩で風景を描く', '上手さは関係ない。紙の上に色がにじんでいく、その瞬間を楽しむだけでいい。', 'hobby-learning', null, '自宅・屋外', '1〜2時間', 90, '〜2,000円', 1, 50),
    ('solo-kissaten', '一人で喫茶店に行く', '分厚いメニューとナポリタン。誰にも急かされない、自分だけの午後。', 'food', null, '喫茶店', '1時間ほど', 60, '〜1,500円', 1, 60),
    ('sento-tour', '銭湯めぐりをする', '近所にある知らない銭湯の扉を開けてみる。湯上がりのコーヒー牛乳まで含めて完成。', 'outing', null, '銭湯', '1〜2時間', 90, '〜1,000円', 1, 70),
    ('night-market', '夜市・朝市をのぞきに行く', '普段の生活時間とずれた場所に行ってみる。知らない匂いと知らない活気。', 'outing', null, '市場', '1〜2時間', 90, '〜2,000円', 1, 80),
    ('handmade-bread', 'パンを一から手ごねで焼く', '発酵を待つあいだの時間もレシピのうち。焼きたての香りが部屋いっぱいに広がる。', 'food', null, '自宅', '3〜4時間', 210, '1,000円ほど', 1, 90),
    ('letterpress', '活版印刷でカードを刷る', 'インクの匂いと紙に沈む文字の凹凸。デジタルにはない手ざわりを味わう。', 'hobby-learning', null, '印刷工房', '2時間ほど', 120, '3,000〜5,000円', 2, 100),
    ('night-hike', '夜の山でナイトハイクをする', '懐中電灯の光だけを頼りに歩く夜道。虫の声と星空がいつもより近い。', 'outing', null, '山・森', '2〜3時間', 150, '〜3,000円', 1, 110),
    ('sake-tasting', '日本酒の利き酒をしてみる', '香り、口当たり、余韻。同じ米から生まれる味の違いを言葉にしてみる。', 'food', null, '酒蔵・バー', '1〜2時間', 90, '3,000〜5,000円', 2, 120),
    ('leather-craft', '革小物を自分の手で作る', '型を抜き、穴をあけ、糸を通す。使うほどに手になじんでいく道具を自分で。', 'hobby-learning', null, 'レザークラフト教室', '3時間ほど', 180, '5,000円〜', 3, 130),
    ('unfamiliar-cuisine', '食べたことのない国の料理店に入る', 'メニューの読み方すら分からない店へ。知らない味との出会いは、小さな旅になる。', 'food', null, 'レストラン', '1〜2時間', 90, '2,000〜4,000円', 2, 140),
    ('stargazing', '天体観測に出かける', '望遠鏡越しに見る土星の輪。教科書の中の存在が、目の前の光になる夜。', 'outing', null, '天文台・高原', '2〜3時間', 150, '〜3,000円', 1, 150),
    ('calligraphy', '書道で好きな言葉を書く', '墨をすり、呼吸を整え、一筆で決める。静けさそのものが目的になる時間。', 'hobby-learning', null, '自宅・書道教室', '1時間ほど', 60, '〜2,000円', 1, 160),
    ('day-trip-onsen', '日帰り温泉でひとり旅気分を味わう', '電車に揺られて、湯につかって、帰る。それだけで小さな旅行になる。', 'outing', null, '温泉', '半日', 300, '3,000〜6,000円', 2, 170),
    ('terrarium', 'テラリウムで小さな庭を作る', 'ガラス瓶の中に、苔と石で風景を組む。机の上に自分だけの景色を置く。', 'hobby-learning', null, '自宅', '1時間ほど', 60, '2,000〜4,000円', 2, 180)
)
insert into public.experiences (
  slug,
  title,
  description,
  category_id,
  image_path,
  place_label,
  duration_label,
  duration_minutes,
  cost_label,
  cost_level,
  publication_status,
  display_order
)
select
  seed.slug,
  seed.title,
  seed.description,
  categories.id,
  seed.image_path,
  seed.place_label,
  seed.duration_label,
  seed.duration_minutes,
  seed.cost_label,
  seed.cost_level,
  'published',
  seed.display_order
from seed
join public.categories on categories.slug = seed.category_slug
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  category_id = excluded.category_id,
  image_path = excluded.image_path,
  place_label = excluded.place_label,
  duration_label = excluded.duration_label,
  duration_minutes = excluded.duration_minutes,
  cost_label = excluded.cost_label,
  cost_level = excluded.cost_level,
  publication_status = excluded.publication_status,
  display_order = excluded.display_order;

delete from public.experience_tags
where experience_id in (
  select id
  from public.experiences
  where slug in (
    'pottery-bowl',
    'spice-curry',
    'solo-ferry',
    'planetarium',
    'watercolor',
    'solo-kissaten',
    'sento-tour',
    'night-market',
    'handmade-bread',
    'letterpress',
    'night-hike',
    'sake-tasting',
    'leather-craft',
    'unfamiliar-cuisine',
    'stargazing',
    'calligraphy',
    'day-trip-onsen',
    'terrarium'
  )
);

with assignments (experience_slug, tag_slug) as (
  values
    ('pottery-bowl', 'solo-ok'),
    ('spice-curry', 'at-home'),
    ('spice-curry', 'solo-ok'),
    ('solo-ferry', 'solo-ok'),
    ('planetarium', 'solo-ok'),
    ('watercolor', 'at-home'),
    ('watercolor', 'solo-ok'),
    ('solo-kissaten', 'solo-ok'),
    ('sento-tour', 'solo-ok'),
    ('handmade-bread', 'at-home'),
    ('handmade-bread', 'solo-ok'),
    ('letterpress', 'solo-ok'),
    ('sake-tasting', 'solo-ok'),
    ('leather-craft', 'solo-ok'),
    ('unfamiliar-cuisine', 'solo-ok'),
    ('calligraphy', 'at-home'),
    ('calligraphy', 'solo-ok'),
    ('day-trip-onsen', 'solo-ok'),
    ('terrarium', 'at-home'),
    ('terrarium', 'solo-ok')
)
insert into public.experience_tags (experience_id, tag_id)
select experiences.id, tags.id
from assignments
join public.experiences on experiences.slug = assignments.experience_slug
join public.tags on tags.slug = assignments.tag_slug
on conflict do nothing;

commit;
