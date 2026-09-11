begin;

-- Contact form submissions ("お問い合わせ"). Anyone (logged in or not) can
-- submit one; nobody can read them back through anon/authenticated -- the
-- operator checks submissions from the Supabase dashboard directly, so no
-- select policy is needed yet.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  message text not null check (char_length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "anyone can submit a contact message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

commit;
