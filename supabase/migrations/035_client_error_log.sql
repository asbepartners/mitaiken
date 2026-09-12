begin;

-- Client-side errors caught by src/app/error.tsx / global-error.tsx (React
-- render errors reaching an error boundary). Same convention as
-- contact_messages: anyone can insert, nobody can read it back through
-- anon/authenticated -- the operator checks entries from the Supabase
-- dashboard directly.
create table public.client_error_log (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  digest text,
  stack text,
  url text,
  created_at timestamptz not null default now()
);

alter table public.client_error_log enable row level security;

create policy "anyone can report a client error"
  on public.client_error_log for insert
  to anon, authenticated
  with check (true);

-- Raw SQL migrations don't pick up this project's default privilege grants
-- (see 033 for the same gotcha with contact_messages) -- without this,
-- every insert fails with 42501 regardless of the RLS policy above.
grant insert on public.client_error_log to anon, authenticated;

-- Reuses the ntfy_topic set up in 032 for contact_messages -- same
-- operator/phone, just a distinct title/tag so it's easy to tell apart from
-- an actual contact form submission.
create or replace function public.notify_client_error()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ntfy_topic text;
  summary text := left(new.message, 300) || case when new.url is not null then E'\n' || new.url else '' end;
begin
  select value into ntfy_topic from public.notify_secrets where key = 'ntfy_topic';

  if ntfy_topic is not null and ntfy_topic <> '' then
    begin
      perform net.http_post(
        url := 'https://ntfy.sh/',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'topic', ntfy_topic,
          'title', 'わたしのはじめて帖：エラー発生',
          'message', summary,
          'tags', jsonb_build_array('warning')
        )
      );
    exception when others then
      -- A notification hiccup must never block the error log insert.
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
