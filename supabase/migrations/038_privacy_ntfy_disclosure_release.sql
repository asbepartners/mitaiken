begin;

-- Publish the privacy policy revision disclosing ntfy.sh as an external
-- service (used to notify the operator of client-side errors) and
-- clarifying that the contact-form notification no longer forwards
-- inquiry content (see 037_contact_message_notification_minimal.sql).
--
-- requires_reconsent = false: this change reduces what's sent to a third
-- party (contact notifications) and adds disclosure of an existing,
-- unchanged data flow (error notifications) -- it doesn't add new
-- obligations for users or change what's collected from them, so per
-- docs/legal-consent-policy.md this doesn't need re-consent. See
-- asbepartners/mitaiken#67.
insert into public.legal_documents (
  document_type,
  version,
  effective_at,
  path
)
values
  ('privacy', '2026-09-19', '2026-09-19 00:00:00+09', '/privacy');

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
  '2026-09-19 00:00:00+09'
from public.legal_documents t
cross join public.legal_documents p
where t.document_type = 'terms'
  and t.version = '2026-08-30'
  and p.document_type = 'privacy'
  and p.version = '2026-09-19';

commit;
