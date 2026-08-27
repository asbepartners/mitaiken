do $$
declare
  target_id uuid;
  target_count integer;
  remaining_experiences integer;
  remaining_groups integer;
begin
  select count(*), (array_agg(id))[1]
  into target_count, target_id
  from auth.users
  where lower(email) = lower('yuuken.mac@gmail.com');

  if target_count <> 1 then
    raise exception 'Reset stopped: expected exactly one target account, found %', target_count;
  end if;

  -- Groups and their membership are user-owned test data.
  delete from public.experience_groups
  where user_id = target_id;

  -- Items, logs, photos and collection children cascade from user experiences.
  delete from public.user_experiences
  where user_id = target_id;

  select count(*) into remaining_experiences
  from public.user_experiences
  where user_id = target_id;

  select count(*) into remaining_groups
  from public.experience_groups
  where user_id = target_id;

  if remaining_experiences <> 0 or remaining_groups <> 0 then
    raise exception 'Reset verification failed: experiences %, groups %',
      remaining_experiences,
      remaining_groups;
  end if;
end
$$;

select
  'development test data reset complete' as result,
  (select count(*) from auth.users where lower(email) = lower('yuuken.mac@gmail.com')) as account_kept,
  (select count(*)
   from public.profiles profile
   join auth.users account on account.id = profile.id
   where lower(account.email) = lower('yuuken.mac@gmail.com')) as profile_kept,
  (select count(*) from public.templates where publication_status = 'published') as published_templates_kept;
