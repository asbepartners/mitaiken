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
where template.slug = 'seasonal-flower-spots';

select
  item.title,
  item.display_order
from public.template_items item
join public.templates template on template.id = item.template_id
where template.slug = 'seasonal-flower-spots'
order by item.display_order, item.title;
