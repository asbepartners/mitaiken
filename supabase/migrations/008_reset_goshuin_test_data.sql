begin;

-- Test-only reset requested by the account owner. Cascades to its items and logs.
delete from public.user_experiences ue
using auth.users account
where ue.user_id = account.id
  and lower(account.email) = lower('yuuken.mac@gmail.com')
  and ue.source_template_slug = 'goshuin-collection';

commit;
