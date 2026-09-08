select
  template.slug,
  template.title,
  category.name as category,
  template.image_path,
  location.code as location_code,
  duration.code as duration_code,
  budget.code as budget_code,
  template.min_people,
  template.max_people,
  template.publication_status,
  template.display_order
from public.templates template
join public.categories category on category.id = template.category_id
left join public.location_options location on location.id = template.location_option_id
left join public.duration_options duration on duration.id = template.duration_option_id
left join public.budget_options budget on budget.id = template.budget_option_id
where template.slug in (
  'live-concert',
  'bungee-jump',
  'skydiving',
  'scuba-diving',
  'camping',
  'dream-mountain-climb'
)
order by template.display_order;

select
  template.slug as template_slug,
  item.title,
  item.display_order
from public.template_items item
join public.templates template on template.id = item.template_id
where template.slug = 'dream-mountain-climb'
order by item.display_order;
