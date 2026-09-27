-- 0018: Maqsadlar hisob-kitobi (saqlanmaydi — har safar hisoblanadi). Barcha *_amount maqsad valyutasida,
-- *_uzs — so'mda (USD maqsad bugungi CBU kursida).
--
-- Jamg'arma (saving):
--   saved     = start_amount + ajratmalar                      (progress uchun)
--   reserved  = max(ajratmalar − maqsadga bog'langan xarajatlar, 0)   (xavfsiz puldan ayriladi;
--               maqsaddan ishlatilgan pul ajratmani o'z-o'zidan bo'shatadi, progress kamaymaydi)
-- Qarz (debt):
--   paid      = start_amount + maqsadga bog'langan xarajatlar (qarz to'lovlari)
-- Hammasi:
--   remaining       = max(target − saved|paid, 0)
--   months_left     = muddat oyigacha qolgan oylar (joriy oy ham, kamida 1)
--   monthly_needed  = remaining ÷ months_left            (muddat bo'lmasa — null)
--   plan            = monthly_plan, bo'lmasa monthly_needed, bo'lmasa 0   (faqat faol maqsadlar)
--   month_contrib   = shu oy ajratilgan (saving) / to'langan (debt)
--   month_left      = max(plan − month_contrib, 0)       → kunlik limitdagi "maqsad ajratmalari"
--   avg_3m          = oxirgi 3 oydagi hissa ÷ 3
--   real_date       = bugun + ceil(remaining ÷ avg_3m) oy
--   late            = faol, muddat bor, qolgan > 0 va (avg_3m = 0 yoki real_date > muddat)
--   extra_needed    = late bo'lsa max(monthly_needed − avg_3m, 0) — "oyiga yana X kerak"
--   status          = closed → 'closed', remaining = 0 → 'done', aks holda 'active'

create view public.goal_summary
with (security_invoker = on)
as
with today as (
  select (now() at time zone 'Asia/Tashkent')::date as d,
         date_trunc('month', (now() at time zone 'Asia/Tashkent'))::date as m
),
rate as (
  select r.usd_to_uzs
  from public.exchange_rates r, today
  where r.date <= today.d
  order by r.date desc
  limit 1
),
alloc as (
  select a.goal_id,
         sum(a.amount) as total,
         coalesce(sum(a.amount) filter (where a.date >= (select m from today)), 0) as month,
         coalesce(sum(a.amount) filter (where a.date > (select d from today) - interval '3 months'), 0) as last3
  from public.goal_allocations a
  group by a.goal_id
),
spend as (
  -- maqsadga bog'langan xarajatlar maqsad valyutasida (0014 dagi qoida)
  select x.goal_id,
         sum(x.amt) as total,
         coalesce(sum(x.amt) filter (where x.date >= (select m from today)), 0) as month,
         coalesce(sum(x.amt) filter (where x.date > (select d from today) - interval '3 months'), 0) as last3
  from (
    select t.goal_id, t.date,
           case when t.currency = g.currency then t.amount
                when g.currency = 'UZS' then t.amount * t.rate_to_uzs
                else t.amount / coalesce(
                  (select r.usd_to_uzs from public.exchange_rates r
                   where r.date <= t.date order by r.date desc limit 1),
                  (select usd_to_uzs from rate))
           end as amt
    from public.transactions t
    join public.categories c on c.id = t.category_id and c.kind = 'expense'
    join public.goals g on g.id = t.goal_id
    where t.goal_id is not null
  ) x
  group by x.goal_id
),
base as (
  select g.*,
         coalesce(a.total, 0) as alloc_total,
         coalesce(s.total, 0) as spent_total,
         case when g.kind = 'saving' then g.start_amount + coalesce(a.total, 0)
              else g.start_amount + coalesce(s.total, 0) end as done_amount,
         case when g.kind = 'saving' then coalesce(a.month, 0) else coalesce(s.month, 0) end as month_contrib,
         case when g.kind = 'saving' then coalesce(a.last3, 0) else coalesce(s.last3, 0) end as last3,
         case when g.currency = 'UZS' then 1 else (select usd_to_uzs from rate) end as to_uzs,
         case when g.deadline is null then null
              else greatest(
                (extract(year from g.deadline) * 12 + extract(month from g.deadline))
                - (extract(year from (select d from today)) * 12 + extract(month from (select d from today))) + 1,
                1)::int end as months_left
  from public.goals g
  left join alloc a on a.goal_id = g.id
  left join spend s on s.goal_id = g.id
),
calc as (
  select b.*,
         greatest(b.target_amount - b.done_amount, 0) as remaining,
         case when b.kind = 'saving' then greatest(b.alloc_total - b.spent_total, 0) else 0 end as reserved,
         b.last3 / 3 as avg_3m
  from base b
),
calc2 as (
  select c.*,
         case when c.closed then 'closed' when c.remaining = 0 then 'done' else 'active' end as status,
         case when c.months_left is null then null else c.remaining / c.months_left end as monthly_needed
  from calc c
),
calc3 as (
  select c.*,
         case when c.status = 'active' then coalesce(c.monthly_plan, c.monthly_needed, 0) else 0 end as plan,
         case when c.avg_3m > 0 and c.remaining > 0
              then ((select d from today) + make_interval(months => ceil(c.remaining / c.avg_3m)::int))::date
         end as real_date
  from calc2 c
),
calc4 as (
  select c.*,
         (c.status = 'active' and c.deadline is not null and c.remaining > 0
          and (c.real_date is null or c.real_date > c.deadline)) as late
  from calc3 c
)
select
  c.id,
  c.user_id,
  c.name,
  c.kind,
  c.target_amount,
  c.currency,
  c.start_amount,
  c.deadline,
  c.priority,
  c.monthly_plan,
  c.closed,
  c.note,
  c.created_at,
  c.status,
  round(c.done_amount, 2) as done_amount,
  round(c.remaining, 2) as remaining_amount,
  round(least(c.done_amount / c.target_amount, 1) * 100, 1) as progress,
  round(c.reserved, 2) as reserved_amount,
  round(c.reserved * c.to_uzs, 2) as reserved_uzs,
  c.months_left,
  round(c.monthly_needed, 2) as monthly_needed,
  round(c.plan, 2) as plan_amount,
  round(c.month_contrib, 2) as month_contrib,
  round(greatest(c.plan - c.month_contrib, 0), 2) as month_left_amount,
  round(greatest(c.plan - c.month_contrib, 0) * c.to_uzs, 2) as month_left_uzs,
  round(c.avg_3m, 2) as avg_3m,
  c.real_date,
  c.late,
  case when c.late then round(greatest(coalesce(c.monthly_needed, 0) - c.avg_3m, 0), 2) end as extra_needed,
  round(c.remaining * c.to_uzs, 2) as remaining_uzs
from calc4 c;

grant select on public.goal_summary to authenticated;
