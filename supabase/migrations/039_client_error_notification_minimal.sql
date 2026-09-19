begin;

-- Same treatment as 037 for contact messages: stop forwarding error
-- message content to the external ntfy.sh service. The push alone was
-- never enough for root-cause investigation anyway (no stack trace, no
-- component info, path is one of only 6 fixed routes) -- it only serves
-- as an alert that something broke, so the operator can go check the
-- full record (message, digest, user_agent) in the dashboard. See
-- asbepartners/mitaiken#67.
create or replace function public.notify_client_error()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ntfy_topic text;
  summary text := 'クライアントエラーが発生しました。管理画面でご確認ください。'
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

commit;
