-- Publish the shared-device and local-storage security clarification.

insert into public.legal_documents (
  document_type,
  version,
  effective_at,
  path
)
values
  ('terms', '2026-08-30', '2026-08-30 00:00:00+09', '/terms'),
  ('privacy', '2026-08-30', '2026-08-30 00:00:00+09', '/privacy');

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
  '2026-08-30 00:00:00+09'
from public.legal_documents t
cross join public.legal_documents p
where t.document_type = 'terms'
  and t.version = '2026-08-30'
  and p.document_type = 'privacy'
  and p.version = '2026-08-30';
