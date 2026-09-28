-- 0027: Bonus (shartnomadan ortiq to'lov) va loyiha to'lovini keyingi davrga bo'lish
--
-- project_summary (loyiha valyutasida):
--   shartnoma_doirasida = min(olingan, total_amount)
--   majburiyat = max(shartnoma_doirasida − bajarilgan_ish, 0)   (done bo'lsa 0)
--   bonus      = max(olingan − total_amount, 0) — darhol ishlab topilgan, majburiyatga kirmaydi
--   mijoz_qarzi va kutilayotgan o'zgarmadi. Yangi ustunlar: bonus_amount, bonus_uzs.
--
-- project_payment_preview(): daromad loyiha qoldig'idan (kutilayotgan) oshadimi — ogohlantirish uchun.
-- split_project_income(): to'lovni ikkiga bo'ladi — qoldiq shu loyihaga, ortig'i shu mijozning
--   keyingi ochiq davriga (sana, hamyon, kurs bir xil; yig'indi asl summaga teng).

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
         -- 0027: majburiyat faqat shartnoma doirasidagi to'lovdan; ortig'i — bonus (darhol ishlab topilgan)
         case when c.is_done then 0
              else greatest(least(c.received_ccy, c.total_amount) - c.work_ccy, 0) end as obligation_ccy,
         greatest(c.work_ccy - c.received_ccy, 0) as client_debt_ccy,
         greatest(c.received_ccy - c.total_amount, 0) as bonus_ccy
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
  round(c.client_debt_ccy * c.to_uzs, 2) as client_debt_uzs,
  -- 0027: shartnomadan ortiq to'lov
  round(c.bonus_ccy, 2) as bonus_amount,
  round(c.bonus_ccy * c.to_uzs, 2) as bonus_uzs
from fin c;


grant select on public.project_summary to authenticated;

-- To'lov summasini loyiha valyutasiga o'girish qoidasi (view'dagidek):
--   bir xil valyuta — summa o'zi; USD to'lov → so'm loyiha — tranzaksiya kursida;
--   so'm to'lov → USD loyiha — to'lov kunidagi CBU kursida (bo'lmasa oxirgi kurs)
create or replace function public.project_payment_preview(
  p_project uuid, p_wallet uuid, p_amount numeric, p_rate numeric, p_date date
)
returns table (
  project_currency text,
  remaining numeric,        -- kutilayotgan, loyiha valyutasida
  payment numeric,          -- to'lov, loyiha valyutasida
  excess numeric,           -- ortiqcha qism, loyiha valyutasida
  remaining_tx numeric,     -- qoldiq to'lov valyutasida (yuqoriga yaxlitlangan — qoldiq to'liq yopiladi)
  next_project_id uuid,
  next_name text,
  next_start date
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_ps public.project_summary%rowtype;
  v_wcur text;
  v_rate numeric;
  v_cbu numeric;
  v_pay numeric;
  v_rem_tx numeric;
begin
  select * into v_ps from public.project_summary where id = p_project;
  if not found then raise exception 'Loyiha topilmadi'; end if;
  select currency into v_wcur from public.wallets where id = p_wallet;
  if v_wcur is null then raise exception 'Hamyon topilmadi'; end if;

  v_rate := case when v_wcur = 'UZS' then 1 else p_rate end;
  select r.usd_to_uzs into v_cbu from public.exchange_rates r
  where r.date <= p_date order by r.date desc limit 1;
  if v_cbu is null then
    select r.usd_to_uzs into v_cbu from public.exchange_rates r order by r.date desc limit 1;
  end if;

  if v_wcur = v_ps.currency then
    v_pay := p_amount;
    v_rem_tx := v_ps.expected_amount;
  elsif v_ps.currency = 'UZS' then           -- USD to'lov → so'm loyiha
    v_pay := p_amount * v_rate;
    v_rem_tx := ceil(v_ps.expected_amount / nullif(v_rate, 0) * 100) / 100;
  else                                       -- so'm to'lov → USD loyiha
    v_pay := p_amount / nullif(v_cbu, 0);
    v_rem_tx := ceil(v_ps.expected_amount * v_cbu * 100) / 100;
  end if;

  return query
  select v_ps.currency,
         v_ps.expected_amount,
         round(v_pay, 2),
         round(greatest(v_pay - v_ps.expected_amount, 0), 2),
         least(coalesce(v_rem_tx, 0), p_amount),
         n.id, n.name, n.start_date
  from (select 1) one
  left join lateral (
    -- keyingi ochiq davr: shu mijozning tugallanmagan loyihasi — avval shu loyihadan ochilgan retainer davri
    -- ("Keyingi oyni ochish"), keyin shu nomdagisi, keyin boshlanish sanasi bo'yicha eng yaqini
    select s.id, s.name, s.start_date
    from public.project_summary s
    where s.client_id = v_ps.client_id and s.id <> v_ps.id and s.status <> 'done'
      and (s.previous_project_id = v_ps.id or s.start_date > v_ps.start_date)
    order by (s.previous_project_id is not distinct from v_ps.id) desc, (s.name = v_ps.name) desc, s.start_date, s.created_at
    limit 1
  ) n on true;
end;
$$;

create or replace function public.split_project_income(
  p_date date, p_amount numeric, p_rate numeric, p_wallet uuid, p_category uuid,
  p_project uuid, p_next uuid, p_note text default null
)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_prev record;
  v_first numeric;
  v_second numeric;
  v_n int := 0;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'Summa noto''g''ri'; end if;
  if not exists (select 1 from public.categories where id = p_category and kind = 'income') then
    raise exception 'Faqat daromadni bo''lish mumkin';
  end if;

  select * into v_prev from public.project_payment_preview(p_project, p_wallet, p_amount, p_rate, p_date);
  if v_prev.next_project_id is null or v_prev.next_project_id <> p_next then
    raise exception 'Keyingi davr topilmadi';
  end if;

  v_first := greatest(least(v_prev.remaining_tx, p_amount), 0);
  v_second := p_amount - v_first;   -- yig'indi doim asl summaga teng

  if v_first > 0 then
    insert into public.transactions (date, amount, rate_to_uzs, wallet_id, category_id, project_id, note)
    values (p_date, v_first, p_rate, p_wallet, p_category, p_project, p_note);
    v_n := v_n + 1;
  end if;
  if v_second > 0 then
    insert into public.transactions (date, amount, rate_to_uzs, wallet_id, category_id, project_id, note)
    values (p_date, v_second, p_rate, p_wallet, p_category, p_next, p_note);
    v_n := v_n + 1;
  end if;
  return v_n;
end;
$$;

revoke execute on function public.project_payment_preview(uuid, uuid, numeric, numeric, date) from public, anon;
revoke execute on function public.split_project_income(date, numeric, numeric, uuid, uuid, uuid, uuid, text) from public, anon;
grant execute on function public.project_payment_preview(uuid, uuid, numeric, numeric, date) to authenticated;
grant execute on function public.split_project_income(date, numeric, numeric, uuid, uuid, uuid, uuid, text) to authenticated;
