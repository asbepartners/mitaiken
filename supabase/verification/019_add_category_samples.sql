-- Run after 019_add_category_samples.sql.
-- Expected: the nine agreed samples in display order, under
-- 「誰かのために」 or 「暮らし」 and all with WebP images.
select
  template.title,
  category.name as category,
  template.image_path,
  location.label as location,
  duration.label as duration,
  budget.label as budget,
  template.min_people,
  template.max_people
from public.templates template
join public.categories category on category.id = template.category_id
join public.location_options location on location.id = template.location_option_id
join public.duration_options duration on duration.id = template.duration_option_id
join public.budget_options budget on budget.id = template.budget_option_id
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
order by template.display_order;
