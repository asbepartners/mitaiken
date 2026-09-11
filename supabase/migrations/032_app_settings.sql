begin;

-- Tiny key/value store for server-side secrets/config that must not be
-- committed to this (potentially public) repository -- currently just the
-- ntfy.sh topic used by notify_contact_message() (031). RLS is enabled with
-- no policies, so anon/authenticated get zero access by default; only a
-- SECURITY DEFINER function owned by postgres (or service_role, which
-- bypasses RLS) can read it.
--
-- Supabase's hosted SQL editor doesn't allow `alter database ... set
-- app.settings.x` (permission denied), which is what 031 originally
-- assumed. This table replaces that plan.
--
-- Named notify_secrets rather than the more obvious app_settings: an
-- unrelated table already named app_settings exists in the project (with a
-- different shape), so app_settings is taken.
create table public.notify_secrets (
  key text primary key,
  value text not null
);

alter table public.notify_secrets enable row level security;

create or replace function public.notify_contact_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ntfy_topic text;
  summary text := left(new.message, 200) || case when new.image is not null then E'\n（画像添付あり）' else '' end;
begin
  select value into ntfy_topic from public.notify_secrets where key = 'ntfy_topic';

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

commit;
