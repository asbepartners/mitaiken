begin;

-- Single-row settings table. The boolean primary key with a check constraint
-- guarantees exactly one row can exist, so the client can always select it
-- without needing an id.
create table public.app_settings (
  id boolean primary key default true check (id),
  maintenance_enabled boolean not null default false,
  maintenance_message text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, maintenance_enabled) values (true, false);

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

-- Read-only from the client. Toggling maintenance is done from Supabase
-- Studio (or a service-role script), not from the app itself.
create policy "app_settings_read_public" on public.app_settings
  for select to anon, authenticated using (true);

grant select on public.app_settings to anon, authenticated;

commit;
