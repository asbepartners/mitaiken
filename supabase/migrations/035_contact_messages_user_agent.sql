begin;

-- Captures the submitter's browser/OS automatically so the operator doesn't
-- have to ask "what device were you using?" when following up on a report.
alter table public.contact_messages add column user_agent text;

commit;
