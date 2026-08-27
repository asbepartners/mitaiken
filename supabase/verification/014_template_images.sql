select
  count(*) filter (where publication_status = 'published') as published_templates,
  count(*) filter (
    where publication_status = 'published'
      and image_path like '/experiences/%.webp'
  ) as published_templates_with_images,
  count(*) filter (
    where publication_status = 'published'
      and (image_path is null or image_path not like '/experiences/%.webp')
  ) as published_templates_without_images
from public.templates;

select slug, title, image_path
from public.templates
where publication_status = 'published'
order by display_order;
