-- 0026: Loyiha majburiyati formulasi tuzatildi (qisman to'lovli loyihalar uchun)
-- Avval: ishlab_topilgan = olingan × bajarilish — faqat to'liq oldindan to'langan loyihada to'g'ri edi.
-- Endi hammasi loyiha valyutasida:
--   bajarilgan_ish = total_amount × bajarilish (done/closed — 100%)
--   majburiyat     = max(olingan − bajarilgan_ish, 0)   (done bo'lsa 0)
--   mijoz_qarzi    = max(bajarilgan_ish − olingan, 0)   (yangi)
-- So'mga: UZS loyiha — o'zi; USD loyiha — bugungi CBU kursida (kurs bo'lmasa to'lovlardagi o'rtacha kurs).
-- earned_uzs ustuni endi "bajarilgan ish" (so'mda). kutilayotgan_to'lov o'zgarmadi.
-- dashboard_summary() va forecast() majburiyatni shu view'dan oladi — ularni o'zgartirish shart emas.

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
         greatest(b.total_amount - b.received_ccy, 0) as expected_ccy,
         case when b.closed or b.ratio >= 1 then b.total_amount
              else b.total_amount * greatest(b.ratio, 0) end as work_ccy,
         -- loyiha valyutasidan so'mga: bugungi kurs, bo'lmasa to'lovlardagi o'rtacha kurs
         case when b.currency = 'UZS' then 1
              else coalesce((select usd_to_uzs from rate),
                            b.received / nullif(b.received_ccy, 0), 0) end as to_uzs
  from base b
),
fin as (
  select c.*,
         case when c.is_done then 0 else greatest(c.received_ccy - c.work_ccy, 0) end as obligation_ccy,
         greatest(c.work_ccy - c.received_ccy, 0) as client_debt_ccy
  from calc c
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
  -- 0026: earned_uzs = bajarilgan ish (so'mda)
  round(c.work_ccy * c.to_uzs, 2) as earned_uzs,
  round(c.obligation_ccy * c.to_uzs, 2) as obligation_uzs,
  round(c.total_in_uzs, 2) as total_uzs,
  -- faqat qolgan qism (loyiha valyutasida) bugungi kursda so'mga o'giriladi
  round(case when c.currency = 'UZS' then c.expected_ccy
             else c.expected_ccy * (select usd_to_uzs from rate) end, 2) as expected_uzs,
  (not c.is_done and c.end_date is not null and c.end_date < (select d from today)) as overdue,
  -- 0014: yangi ustunlar (view'ga faqat oxiridan qo'shish mumkin)
  round(c.received_ccy, 2) as received_amount,
  round(c.expected_ccy, 2) as expected_amount,
  -- 0023: retainer keyingi davrlarda ham davom etadimi (prognoz uchun)
  c.continues,
  -- 0026: loyiha valyutasidagi ko'rsatkichlar va mijoz qarzi
  round(c.work_ccy, 2) as work_amount,
  round(c.obligation_ccy, 2) as obligation_amount,
  round(c.client_debt_ccy, 2) as client_debt_amount,
  round(c.client_debt_ccy * c.to_uzs, 2) as client_debt_uzs
from fin c;

grant select on public.project_summary to authenticated;
