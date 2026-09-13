begin;

-- Client-side unexpected errors (caught by src/app/error.tsx and
-- global-error.tsx), logged so the operator can see and get notified about
-- real crashes instead of only console.error, which nobody sees in
-- production (see mitaiken#25).
create table public.client_error_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  digest text,
  path text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.client_error_log enable row level security;

create policy "anyone can log a client error"
  on public.client_error_log for insert
  to anon, authenticated
  with check (true);

-- Matches 033's lesson for contact_messages: RLS policy alone isn't
-- enough, the base table-level GRANT is also required for anon/authenticated
-- inserts from the public site to succeed.
grant insert on public.client_error_log to anon, authenticated;

-- Reuses the same ntfy_topic already configured in notify_secrets
-- (031/032) -- no new secret needed.
create or replace function public.notify_client_error()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ntfy_topic text;
  summary text := left(new.message, 200)
    || case when new.path is not null then E'\npath: ' || new.path else '' end;
begin
  select value into ntfy_topic from public.notify_secrets where key = 'ntfy_topic';

  if ntfy_topic is not null and ntfy_topic <> '' then
    begin
      perform net.http_post(
        url := 'https://ntfy.sh/',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'topic', ntfy_topic,
          'title', 'わたしのはじめて帖：クライアントエラー発生',
          'message', summary,
          'tags', jsonb_build_array('warning')
        )
      );
    exception when others then
      -- A notification hiccup must never block the actual error log insert.
      null;
    end;
  end if;
  return new;
end;
$$;

create trigger client_error_log_notify
  after insert on public.client_error_log
  for each row execute function public.notify_client_error();

commit;
