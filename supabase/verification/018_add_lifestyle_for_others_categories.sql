-- Run after 018_add_lifestyle_for_others_categories.sql.
-- Expected: exactly the following two rows, both active and in this order.
select slug, name, display_order, is_active
from public.categories
where slug in ('lifestyle', 'for-others')
order by display_order, slug;

-- Expected: 8 active categories in total.
select count(*) as active_category_count
from public.categories
where is_active;
