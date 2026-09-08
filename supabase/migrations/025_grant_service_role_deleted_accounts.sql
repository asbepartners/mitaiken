begin;

-- service_role bypasses RLS but still needs an explicit table-level grant,
-- same as anon/authenticated do elsewhere in this schema. Select is included
-- for the future disaster-recovery cross-check described in
-- docs/privacy-data-inventory.md.
grant select, insert on public.deleted_accounts to service_role;

commit;
