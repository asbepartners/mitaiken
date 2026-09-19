begin;

-- Publish the follow-up privacy policy wording change: the ntfy.sh
-- client-error notification no longer forwards the error message itself
-- (039_client_error_notification_minimal.sql), so 第4条's description of
-- what that notification contains is narrowed to match. Same
-- requires_reconsent = false rationale as 038: this only tightens
-- disclosure to match a reduction in what's actually sent, no new
-- obligation on users. See asbepartners/mitaiken#67.
insert into public.legal_documents (
  document_type,
  version,
  effective_at,
  path
)
values
  ('privacy', '2026-09-19b', '2026-09-19 12:00:00+09', '/privacy');

insert into public.legal_releases (
  terms_document_id,
  privacy_document_id,
  requires_reconsent,
  effective_at
)
select
  t.id,
  p.id,
  false,
  '2026-09-19 12:00:00+09'
from public.legal_documents t
cross join public.legal_documents p
where t.document_type = 'terms'
  and t.version = '2026-08-30'
  and p.document_type = 'privacy'
  and p.version = '2026-09-19b';

commit;
