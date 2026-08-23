begin;

alter table public.user_experiences
  add column if not exists related_url text,
  add column if not exists experience_memo text;

alter table public.experience_logs
  add column if not exists place text,
  add column if not exists companion text;

commit;
