begin;

-- Contact form submissions ("お問い合わせ"). Anyone (logged in or not) can
-- submit one; nobody can read them back through anon/authenticated -- the
-- operator checks submissions from the Supabase dashboard directly, so no
-- select policy is needed yet.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  category text not null check (category in ('feedback', 'bug', 'request', 'other')),
  message text not null check (char_length(message) between 1 and 4000),
  -- Same convention as custom_experiences.image_path: a browser-resized
  -- (max 1200px) JPEG data URL stored directly, no Storage bucket.
  image text,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "anyone can submit a contact message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

-- Push a notification to the operator's phone via ntfy.sh (https://ntfy.sh)
-- whenever a message comes in, so they don't have to poll this table.
--
-- The ntfy topic name is the only "auth" ntfy has, so it must NOT be
-- committed to this (potentially public) repository. Run this migration as
-- it is, then separately -- in the SQL editor, and don't commit this
-- anywhere -- run:
--   alter database postgres set app.settings.ntfy_topic = '<your-secret-topic>';
-- Until that's set, current_setting() below returns null and the
-- notification is silently skipped rather than blocking the insert.
create extension if not exists pg_net;

create or replace function public.notify_contact_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ntfy_topic text := current_setting('app.settings.ntfy_topic', true);
  summary text := left(new.message, 200) || case when new.image is not null then E'\n（画像添付あり）' else '' end;
begin
  if ntfy_topic is not null and ntfy_topic <> '' then
    begin
      perform net.http_post(
        url := 'https://ntfy.sh/',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'topic', ntfy_topic,
          'title', 'わたしのはじめて帖：新しいお問い合わせ',
          'message', summary,
          'tags', jsonb_build_array('incoming_envelope')
        )
      );
    exception when others then
      -- A notification hiccup must never block the actual submission.
      null;
    end;
  end if;
  return new;
end;
$$;

create trigger contact_messages_notify
  after insert on public.contact_messages
  for each row execute function public.notify_contact_message();

commit;
