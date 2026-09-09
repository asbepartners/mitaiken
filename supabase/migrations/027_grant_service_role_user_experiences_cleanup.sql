begin;

-- service_role bypasses RLS but still needs an explicit table-level grant,
-- same as anon/authenticated do elsewhere in this schema. Needed so the
-- Playwright E2E global-teardown (tests/e2e/global-teardown.ts) can clean up
-- the dedicated test account's rows between runs. experience_logs and
-- user_experience_items cascade-delete via their existing FKs, so no
-- separate grant is needed there.
grant select, delete on public.user_experiences to service_role;

commit;
