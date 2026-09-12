begin;

-- 031 created contact_messages via a raw SQL migration. Unlike a table
-- created through the Table Editor, that doesn't pick up this project's
-- default privilege grants to anon/authenticated. RLS alone isn't enough:
-- without the base table-level GRANT, every insert from the public site
-- (which always authenticates as anon or authenticated, never postgres)
-- fails with "permission denied for table contact_messages" (42501),
-- no matter how permissive the RLS policy is.
grant insert on public.contact_messages to anon, authenticated;

commit;
