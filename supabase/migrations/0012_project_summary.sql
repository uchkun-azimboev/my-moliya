-- 0012: Loyiha hisob-kitobi (saqlanmaydi — har safar hisoblanadi)
--
-- received_uzs   = bog'langan daromadlar − bog'langan xarajatlar (qaytarilgan pul), har biri o'z kursida
-- ratio          = progress_percent / 100 yoki units_done / units_total (aniq nisbat)
-- status         = 'done' (closed yoki ratio = 1) | 'obligation' (ratio = 0) | 'partial'
-- earned_uzs     = received × ratio   (done bo'lsa = received)
-- obligation_uzs = max(received − earned, 0)   (done bo'lsa 0)
-- total_uzs      = umumiy summa so'mda (USD — oxirgi CBU kursida)
-- expected_uzs   = max(total_uzs − received, 0) — kutilayotgan to'lov
-- overdue        = tugallanmagan va tugash sanasi o'tgan

create view public.project_summary
with (security_invoker = on)
as
with today as (
  select (now() at time zone 'Asia/Tashkent')::date as d
),
rate as (
  select r.usd_to_uzs
  from public.exchange_rates r, today
  where r.date <= today.d
  order by r.date desc
  limit 1
),
pay as (
  select t.project_id,
         sum(case when c.kind = 'income' then t.amount * t.rate_to_uzs else -t.amount * t.rate_to_uzs end) as received,
         count(*) as payments
  from public.transactions t
  join public.categories c on c.id = t.category_id
  where t.project_id is not null
  group by t.project_id
),
base as (
  select p.*,
         cl.name as client_name,
         coalesce(pay.received, 0) as received,
         coalesce(pay.payments, 0) as payments,
         case when p.progress_mode = 'units' then p.units_done::numeric / p.units_total
              else p.progress_percent / 100 end as ratio
  from public.projects p
  join public.clients cl on cl.id = p.client_id
  left join pay on pay.project_id = p.id
),
calc as (
  select b.*,
         (b.closed or b.ratio >= 1) as is_done,
         case when b.currency = 'UZS' then b.total_amount
              else b.total_amount * (select usd_to_uzs from rate) end as total_in_uzs
  from base b
)
select
  c.id,
  c.user_id,
  c.client_id,
  c.client_name,
  c.name,
  c.total_amount,
  c.currency,
  c.start_date,
  c.end_date,
  c.progress_mode,
  c.progress_percent,
  c.units_total,
  c.units_done,
  c.is_retainer,
  c.previous_project_id,
  c.closed,
  c.note,
  c.created_at,
  c.payments::int as payments,
  round(c.ratio * 100, 1) as progress,
  case when c.is_done then 'done' when c.ratio <= 0 then 'obligation' else 'partial' end as status,
  round(c.received, 2) as received_uzs,
  round(case when c.is_done then c.received else c.received * c.ratio end, 2) as earned_uzs,
  case when c.is_done then 0
       else round(greatest(c.received - c.received * c.ratio, 0), 2) end as obligation_uzs,
  round(c.total_in_uzs, 2) as total_uzs,
  round(greatest(c.total_in_uzs - c.received, 0), 2) as expected_uzs,
  (not c.is_done and c.end_date is not null and c.end_date < (select d from today)) as overdue
from calc c;

grant select on public.project_summary to authenticated;
