-- Category slugs remain stable; only the database-managed display names change.
update public.categories
set name = '健康'
where slug = 'beauty-health';

update public.categories
set name = '誰かへ'
where slug = 'for-others';
