begin;

insert into public.categories (slug, name, display_order)
values
  ('food', '食べる', 10),
  ('outing', 'おでかけ', 20),
  ('hobby-learning', '趣味・学ぶ', 30),
  ('lifestyle', '暮らし', 40),
  ('beauty-health', '美容・健康', 50)
on conflict (slug) do update set name=excluded.name, display_order=excluded.display_order;

insert into public.tags (slug, name, display_order)
values
  ('at-home', '家でできる', 10),
  ('solo-ok', 'ひとりOK', 20)
on conflict (slug) do update set name=excluded.name, display_order=excluded.display_order;

with seed(slug,title,description,category_slug,image_path,display_order) as (
 values
 ('pottery-bowl','陶芸で自分のお茶碗を作る','土をこねて、世界にひとつのお茶碗を。','hobby-learning','/experiences/pottery-bowl.png',10),
 ('spice-curry','スパイスからカレーを作る','香りを重ねて、いつもと違う台所の時間。','food','/experiences/spice-curry.png',20),
 ('solo-ferry','一人でフェリーに乗る','潮風とエンジン音を楽しむ、小さな旅。','outing','/experiences/solo-ferry.png',30),
 ('planetarium','プラネタリウムへ行く','暗闇に浮かぶ星空を見上げる静かな時間。','outing','/experiences/planetarium.png',40),
 ('watercolor','水彩で風景を描く','紙の上に色がにじんでいく瞬間を楽しむ。','hobby-learning',null,50),
 ('solo-kissaten','一人で喫茶店に行く','誰にも急かされない、自分だけの午後。','food',null,60),
 ('sento-tour','銭湯めぐりをする','知らない銭湯の扉を開けてみる。','outing',null,70),
 ('night-market','夜市・朝市をのぞきに行く','知らない匂いと活気に出会う。','outing',null,80),
 ('handmade-bread','パンを一から手ごねで焼く','焼きたての香りまで楽しむ。','food',null,90),
 ('letterpress','活版印刷でカードを刷る','紙に沈む文字の手ざわりを味わう。','hobby-learning',null,100),
 ('night-hike','夜の山でナイトハイクをする','夜道と星空をいつもと違う感覚で歩く。','outing',null,110),
 ('sake-tasting','日本酒の利き酒をしてみる','香りや味の違いを楽しんでみる。','food',null,120),
 ('leather-craft','革小物を自分の手で作る','使うほどになじむものを自分の手で。','hobby-learning',null,130),
 ('unfamiliar-cuisine','食べたことのない国の料理店に入る','知らない味との出会いを小さな旅に。','food',null,140),
 ('stargazing','天体観測に出かける','教科書の星を自分の目で見てみる。','outing',null,150),
 ('calligraphy','書道で好きな言葉を書く','墨と一筆に集中する静かな時間。','hobby-learning',null,160),
 ('day-trip-onsen','日帰り温泉でひとり旅気分を味わう','湯につかって帰るだけの小さな旅行。','outing',null,170),
 ('terrarium','テラリウムで小さな庭を作る','机の上に自分だけの景色を作る。','hobby-learning',null,180)
)
insert into public.templates(slug,title,description,category_id,image_path,publication_status,display_order)
select s.slug,s.title,s.description,c.id,s.image_path,'published',s.display_order
from seed s join public.categories c on c.slug=s.category_slug
on conflict(slug) do update set
 title=excluded.title, description=excluded.description, category_id=excluded.category_id,
 image_path=excluded.image_path, publication_status=excluded.publication_status,
 display_order=excluded.display_order;

with assignments(template_slug,tag_slug) as (
 values
 ('pottery-bowl','solo-ok'),('spice-curry','at-home'),('spice-curry','solo-ok'),
 ('solo-ferry','solo-ok'),('planetarium','solo-ok'),('watercolor','at-home'),
 ('watercolor','solo-ok'),('solo-kissaten','solo-ok'),('sento-tour','solo-ok'),
 ('handmade-bread','at-home'),('handmade-bread','solo-ok'),('letterpress','solo-ok'),
 ('sake-tasting','solo-ok'),('leather-craft','solo-ok'),('unfamiliar-cuisine','solo-ok'),
 ('calligraphy','at-home'),('calligraphy','solo-ok'),('day-trip-onsen','solo-ok'),
 ('terrarium','at-home'),('terrarium','solo-ok')
)
insert into public.template_tags(template_id,tag_id)
select t.id,tg.id from assignments a
join public.templates t on t.slug=a.template_slug
join public.tags tg on tg.slug=a.tag_slug
on conflict do nothing;

-- 「まとめる」型紙の最初のサンプル。
insert into public.templates(slug,title,description,category_id,publication_status,display_order)
select 'prefecture-collection','都道府県を制覇する',
       '行ってみたい都道府県をひとつずつ体験として管理して、まとめて眺める型紙。',
       c.id,'published',190
from public.categories c where c.slug='outing'
on conflict(slug) do update set
 title=excluded.title, description=excluded.description, category_id=excluded.category_id,
 publication_status=excluded.publication_status, display_order=excluded.display_order;

with items(title,display_order) as (
 values ('北海道に行く',10),('青森県に行く',20),('東京都に行く',30),
        ('京都府に行く',40),('福岡県に行く',50),('沖縄県に行く',60)
)
insert into public.template_items(template_id,title,category_id,display_order)
select t.id,i.title,c.id,i.display_order
from items i
cross join public.templates t
cross join public.categories c
where t.slug='prefecture-collection' and c.slug='outing'
and not exists (
 select 1 from public.template_items x
 where x.template_id=t.id and x.title=i.title
);

commit;
