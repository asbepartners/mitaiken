begin;

-- 運営テンプレート由来のユーザー体験を、FKで縛らずslugだけ記録する。
-- コピー後はユーザー所有という既存設計を保ちつつ、画面のマスターと対応付けるための出自情報。
alter table public.user_experiences
  add column if not exists source_template_slug text,
  add column if not exists hidden_at timestamptz;

create unique index if not exists user_experiences_user_source_template_uidx
  on public.user_experiences(user_id, source_template_slug);

commit;
