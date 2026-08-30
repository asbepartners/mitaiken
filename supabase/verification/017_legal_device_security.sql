select
  lr.release_no,
  lr.requires_reconsent,
  lr.effective_at,
  t.version as terms_version,
  p.version as privacy_version
from public.legal_releases lr
join public.legal_documents t on t.id = lr.terms_document_id
join public.legal_documents p on p.id = lr.privacy_document_id
where t.version = '2026-08-30'
  and p.version = '2026-08-30';
