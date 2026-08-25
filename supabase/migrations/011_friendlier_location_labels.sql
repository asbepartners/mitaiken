begin;

update public.location_options
set label = case code
  when 'home' then 'おうちでできる'
  when 'outing' then '外で楽しむ'
  when 'either' then 'どちらでも'
  else label
end,
updated_at = now()
where code in ('home', 'outing', 'either');

commit;
