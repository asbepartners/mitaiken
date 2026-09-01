begin;

-- Add broad shelves for everyday-life experiences and experiences motivated
-- by doing something for another person. A template may still belong to a
-- different category when that is the more useful way to find it.
insert into public.categories (slug, name, display_order, is_active)
values
  ('lifestyle', '暮らし', 70, true),
  ('for-others', '誰かのために', 80, true)
on conflict (slug) do update set
  name = excluded.name,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

commit;
