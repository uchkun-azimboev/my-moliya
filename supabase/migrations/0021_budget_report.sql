-- 0021: budget_report(oy) — tanlangan oy uchun kategoriya bo'yicha reja va fakt (saqlanmaydi)
-- fakt = shu oy xarajatlari, har biri o'z kursida so'mga; qarz to'lovlari (qarz maqsadiga bog'langan) kirmaydi.
-- Qatorlar: rejasi bor yoki shu oy xarajati bor xarajat kategoriyalari.
-- remaining = max(reja − fakt, 0); over = max(fakt − reja, 0) (reja bo'lmasa null).

create function public.budget_report(p_month date)
returns table (
  category_id  uuid,
  name         text,
  icon         text,
  group_type   text,
  archived     boolean,
  planned      numeric,
  actual       numeric,
  remaining    numeric,
  over         numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with m as (
    select date_trunc('month', p_month)::date as start,
           (date_trunc('month', p_month) + interval '1 month')::date as next
  ),
  fact as (
    select t.category_id, sum(t.amount * t.rate_to_uzs) as actual
    from public.transactions t
    left join public.goals g on g.id = t.goal_id
    where t.date >= (select start from m) and t.date < (select next from m)
      and g.kind is distinct from 'debt'
    group by t.category_id
  ),
  plan as (
    select b.category_id, b.planned_amount
    from public.budgets b
    where b.month = (select start from m)
  )
  select c.id, c.name, c.icon, c.group_type, c.archived,
         p.planned_amount,
         round(coalesce(f.actual, 0), 2),
         case when p.planned_amount is null then null else round(greatest(p.planned_amount - coalesce(f.actual, 0), 0), 2) end,
         case when p.planned_amount is null then null else round(greatest(coalesce(f.actual, 0) - p.planned_amount, 0), 2) end
  from public.categories c
  left join plan p on p.category_id = c.id
  left join fact f on f.category_id = c.id
  where c.kind = 'expense' and (p.category_id is not null or coalesce(f.actual, 0) > 0)
  order by c.name;
$$;

revoke execute on function public.budget_report(date) from public, anon;
grant execute on function public.budget_report(date) to authenticated;
