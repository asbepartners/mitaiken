begin;

alter table public.user_experiences
  add column if not exists client_key text,
  add column if not exists description text not null default '';

create unique index if not exists user_experiences_user_client_key_idx
  on public.user_experiences(user_id, client_key);

commit;
