begin;

with asset(slug, image_path) as (
  values
    ('pottery-bowl', '/experiences/pottery-bowl.webp'),
    ('spice-curry', '/experiences/spice-curry.webp'),
    ('solo-ferry', '/experiences/solo-ferry.webp'),
    ('planetarium', '/experiences/planetarium.webp'),
    ('watercolor', '/experiences/watercolor.webp'),
    ('solo-kissaten', '/experiences/solo-kissaten.webp'),
    ('night-market', '/experiences/night-market.webp'),
    ('handmade-bread', '/experiences/handmade-bread.webp'),
    ('night-hike', '/experiences/night-hike.webp'),
    ('sake-tasting', '/experiences/sake-tasting.webp'),
    ('leather-craft', '/experiences/leather-craft.webp'),
    ('unfamiliar-cuisine', '/experiences/unfamiliar-cuisine.webp'),
    ('stargazing', '/experiences/stargazing.webp'),
    ('calligraphy', '/experiences/calligraphy.webp'),
    ('day-trip-onsen', '/experiences/day-trip-onsen.webp'),
    ('terrarium', '/experiences/terrarium.webp'),
    ('unvisited-prefectures', '/experiences/unvisited-prefectures.webp'),
    ('goshuin-collection', '/experiences/goshuin-collection.webp'),
    ('restaurant-collection', '/experiences/restaurant-collection.webp'),
    ('learn-english', '/experiences/learn-english.webp'),
    ('fp-qualification', '/experiences/fp-qualification.webp'),
    ('learn-guitar', '/experiences/learn-guitar.webp'),
    ('tin-sake-cup', '/experiences/tin-sake-cup.webp'),
    ('glass-craft', '/experiences/glass-craft.webp'),
    ('try-tai-chi', '/experiences/try-tai-chi.webp'),
    ('join-gym', '/experiences/join-gym.webp')
)
update public.templates template
set image_path = asset.image_path,
    updated_at = now()
from asset
where template.slug = asset.slug;

do $$
declare
  published_count integer;
  published_with_image_count integer;
begin
  select count(*)
  into published_count
  from public.templates
  where publication_status = 'published';

  select count(*)
  into published_with_image_count
  from public.templates
  where publication_status = 'published'
    and image_path like '/experiences/%.webp';

  if published_count <> 26 or published_with_image_count <> 26 then
    raise exception 'Expected 26 published templates with WebP images, found % published and % with images',
      published_count,
      published_with_image_count;
  end if;
end
$$;

commit;
