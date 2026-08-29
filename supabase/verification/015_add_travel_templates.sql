select
  template.display_order,
  template.slug,
  template.title,
  template.description,
  category.name as category,
  location.label as location,
  duration.label as duration,
  budget.label as budget,
  template.min_people,
  template.max_people,
  template.image_path
from public.templates template
join public.categories category on category.id = template.category_id
join public.location_options location on location.id = template.location_option_id
join public.duration_options duration on duration.id = template.duration_option_id
join public.budget_options budget on budget.id = template.budget_option_id
where template.slug in ('cruise-experience', 'dream-country-travel')
order by template.display_order;

select
  template.slug as template_slug,
  item.title,
  item.display_order
from public.template_items item
join public.templates template on template.id = item.template_id
where template.slug = 'dream-country-travel'
order by item.display_order, item.title;

select
  count(*) filter (where publication_status = 'published') as published_templates,
  count(*) filter (
    where publication_status = 'published'
      and image_path like '/experiences/%.webp'
  ) as published_templates_with_images
from public.templates;
