begin;

grant usage on schema public to anon, authenticated;

grant select on table public.categories to anon, authenticated;
grant select on table public.tags to anon, authenticated;
grant select on table public.experiences to anon, authenticated;
grant select on table public.experience_tags to anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_experiences to authenticated;
grant select, insert, update, delete on table public.experience_logs to authenticated;

commit;
