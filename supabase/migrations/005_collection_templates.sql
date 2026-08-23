begin;

with seed(slug,title,description,category_slug,display_order) as (
  values
    ('goshuin-collection','御朱印を集める','行きたい神社やお寺を追加して、お参りの記録をひとつずつ残す。','outing',200),
    ('restaurant-collection','気になっているレストランに行く','気になるお店を見つけたら、いつか行きたい場所として残しておく。','food',210)
)
insert into public.templates(slug,title,description,category_id,publication_status,display_order)
select s.slug,s.title,s.description,c.id,'published',s.display_order
from seed s join public.categories c on c.slug=s.category_slug
on conflict(slug) do update set
  title=excluded.title,
  description=excluded.description,
  category_id=excluded.category_id,
  publication_status=excluded.publication_status,
  display_order=excluded.display_order;

with items(template_slug,title,category_slug,display_order) as (
  values
    ('goshuin-collection','出雲大社','outing',10),
    ('goshuin-collection','伊勢神宮','outing',20),
    ('restaurant-collection','○○ダイニング','food',10),
    ('restaurant-collection','○○鮨','food',20)
)
insert into public.template_items(template_id,title,category_id,display_order)
select t.id,i.title,c.id,i.display_order
from items i
join public.templates t on t.slug=i.template_slug
join public.categories c on c.slug=i.category_slug
where not exists (
  select 1 from public.template_items existing
  where existing.template_id=t.id and existing.title=i.title
);

commit;
