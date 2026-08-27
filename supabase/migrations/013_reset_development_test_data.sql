begin;

create temporary table reset_target_account on commit drop as
select id
from auth.users
where lower(email) = lower('yuuken.mac@gmail.com');

do $$
declare
  target_count integer;
begin
  select count(*) into target_count from reset_target_account;
  if target_count <> 1 then
    raise exception 'Reset stopped: expected exactly one target account, found %', target_count;
  end if;
end
$$;

-- Groups and their membership are user-owned test data.
delete from public.experience_groups group_row
using reset_target_account target
where group_row.user_id = target.id;

-- Items, logs, photos and collection children cascade from user experiences.
delete from public.user_experiences experience
using reset_target_account target
where experience.user_id = target.id;

do $$
declare
  remaining_experiences integer;
  remaining_groups integer;
begin
  select count(*) into remaining_experiences
  from public.user_experiences experience
  join reset_target_account target on target.id = experience.user_id;

  select count(*) into remaining_groups
  from public.experience_groups group_row
  join reset_target_account target on target.id = group_row.user_id;

  if remaining_experiences <> 0 or remaining_groups <> 0 then
    raise exception 'Reset verification failed: experiences %, groups %',
      remaining_experiences,
      remaining_groups;
  end if;
end
$$;

commit;

select
  'development test data reset complete' as result,
  (select count(*) from auth.users where lower(email) = lower('yuuken.mac@gmail.com')) as account_kept,
  (select count(*)
   from public.profiles profile
   join auth.users account on account.id = profile.id
   where lower(account.email) = lower('yuuken.mac@gmail.com')) as profile_kept,
  (select count(*) from public.templates where publication_status = 'published') as published_templates_kept;
