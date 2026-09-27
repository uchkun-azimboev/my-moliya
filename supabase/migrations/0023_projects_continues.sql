-- 0023: Retainer loyihaga "davom etadi" belgisi (prognoz uchun)
-- continues = true (standart): faol retainer keyingi davrlarda ham shu summa bilan har davr boshida
-- to'lov qiladi deb hisoblanadi. Loyiha sahifasida o'chirish mumkin.
-- project_summary view'ga continues ustuni oxiridan qo'shiladi (boshqa ustunlar o'zgarmagan).

alter table public.projects add column continues boolean not null default true;

create or replace view public.project_summary
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
         sum(case when c.kind = 'income' then 1 else -1 end * t.amount * t.rate_to_uzs) as received,
         -- loyiha valyutasida: bir xil valyuta — summa o'zi; USD to'lov → so'm loyiha — o'z kursida;
         -- so'm to'lov → USD loyiha — to'lov kunidagi CBU kursida (bo'lmasa oxirgi kurs)
         sum(case when c.kind = 'income' then 1 else -1 end *
             case when t.currency = p.currency then t.amount
                  when p.currency = 'UZS' then t.amount * t.rate_to_uzs
                  else t.amount / coalesce(
                    (select r.usd_to_uzs from public.exchange_rates r
                     where r.date <= t.date order by r.date desc limit 1),
                    (select usd_to_uzs from rate))
             end) as received_ccy,
         count(*) as payments
  from public.transactions t
  join public.categories c on c.id = t.category_id
  join public.projects p on p.id = t.project_id
  where t.project_id is not null
  group by t.project_id
),
base as (
  select p.*,
         cl.name as client_name,
         coalesce(pay.received, 0) as received,
         coalesce(pay.received_ccy, 0) as received_ccy,
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
              else b.total_amount * (select usd_to_uzs from rate) end as total_in_uzs,
         greatest(b.total_amount - b.received_ccy, 0) as expected_ccy
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
  -- faqat qolgan qism (loyiha valyutasida) bugungi kursda so'mga o'giriladi
  round(case when c.currency = 'UZS' then c.expected_ccy
             else c.expected_ccy * (select usd_to_uzs from rate) end, 2) as expected_uzs,
  (not c.is_done and c.end_date is not null and c.end_date < (select d from today)) as overdue,
  -- 0014: yangi ustunlar (view'ga faqat oxiridan qo'shish mumkin)
  round(c.received_ccy, 2) as received_amount,
  round(c.expected_ccy, 2) as expected_amount,
  -- 0023: retainer keyingi davrlarda ham davom etadimi (prognoz uchun)
  c.continues
from calc c;

grant select on public.project_summary to authenticated;
