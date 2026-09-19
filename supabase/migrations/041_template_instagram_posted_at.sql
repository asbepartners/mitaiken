begin;

-- Lets the operator record when a template's Instagram post went out, so
-- "which masters haven't been posted yet" is a simple filter instead of a
-- guess. Filled in by hand via the Supabase table editor -- no app write
-- path is exposed, since the instagram-studio tool ships the public anon
-- key to every environment regardless of NODE_ENV.
alter table public.templates
  add column if not exists instagram_posted_at date;

commit;
