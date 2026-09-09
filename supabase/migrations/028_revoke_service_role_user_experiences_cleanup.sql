begin;

-- Reverts 027: the E2E test suite's automated cleanup isn't worth giving
-- service_role standing SELECT/DELETE access to every user's
-- user_experiences row. The dedicated test account's leftover rows are
-- harmless (never surfaced in the app UI) and can be cleaned up manually.
revoke select, delete on public.user_experiences from service_role;

commit;
