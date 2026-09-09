begin;

alter table public.user_experiences
  add column if not exists planned_date date,
  add column if not exists place text,
  add column if not exists companion text;

commit;
