begin;

-- Reduce the contact-form notification to a bare fact. Previously this
-- forwarded the first 200 chars of the inquiry body and whether a photo
-- was attached to the external ntfy.sh service (031/032) -- the operator
-- only needs to know to go check the dashboard, so forwarding
-- user-submitted inquiry content to a third party wasn't justified by
-- that need. See docs/privacy-data-inventory.md.
create or replace function public.notify_contact_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ntfy_topic text;
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
          'message', '新しいお問い合わせが届きました。管理画面でご確認ください。',
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
