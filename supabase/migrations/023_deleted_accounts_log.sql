begin;

-- Minimal audit trail for account deletion. Holds only the former user's id
-- and when they deleted their account -- no email, no personal data. This
-- lets an operator re-delete accounts that a full database restore would
-- otherwise resurrect (see docs/privacy-data-inventory.md).
--
-- Not readable or writable by anon/authenticated: only the account-deletion
-- Edge Function (via the service role, which bypasses RLS) writes here.
create table public.deleted_accounts (
  user_id uuid primary key,
  deleted_at timestamptz not null default now()
);

alter table public.deleted_accounts enable row level security;

commit;
