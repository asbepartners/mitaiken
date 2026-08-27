select
  count(*) filter (where account.id is not null) as account_kept,
  count(*) filter (where profile.id is not null) as profile_kept,
  count(experience.id) as user_experiences,
  count(distinct group_row.id) as experience_groups
from auth.users account
left join public.profiles profile on profile.id = account.id
left join public.user_experiences experience on experience.user_id = account.id
left join public.experience_groups group_row on group_row.user_id = account.id
where lower(account.email) = lower('yuuken.mac@gmail.com');

select
  count(*) filter (where publication_status = 'published') as published_templates,
  count(*) filter (where publication_status = 'published' and image_path is not null) as published_templates_with_images
from public.templates;
