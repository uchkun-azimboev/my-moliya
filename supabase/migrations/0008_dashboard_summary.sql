-- 0008: Dashboard raqamlari — hech narsa saqlanmaydi, har safar hisoblanadi.
-- security invoker: funksiya chaqiruvchi nomidan ishlaydi, RLS amal qiladi.
--
-- jami_pul        = barcha hamyonlar balansi (USD — oxirgi saqlangan CBU kursida)
-- majburiyatlar   = 0 (loyihalar 3-bosqichda)
-- xavfsiz_pul     = jami_pul − majburiyatlar
-- qolgan_majburiy = max(monthly_fixed_expenses − shu oy "fixed" guruhda to'langan, 0)
--                   (VAQTINCHA: 5-bosqichda budjetdagi reja bilan almashtiriladi)
-- maqsad_ajratma  = 0 (maqsadlar 4-bosqichda)
-- kunlik_limit    = (xavfsiz_pul − qolgan_majburiy − maqsad_ajratma) ÷ oyning qolgan kunlari (bugun ham)
--                   0 dan kichik bo'lsa 0, limit_negative = true

create function public.dashboard_summary()
returns table (
  today                   date,
  days_left               int,
  usd_rate                numeric,
  usd_rate_date           date,
  uzs_balance             numeric,
  usd_balance             numeric,
  total_uzs               numeric,
  obligations_uzs         numeric,
  safe_uzs                numeric,
  month_income_uzs        numeric,
  month_expense_uzs       numeric,
  monthly_fixed_expenses  numeric,
  fixed_paid_uzs          numeric,
  fixed_remaining_uzs     numeric,
  goal_allocations_uzs    numeric,
  daily_limit_uzs         numeric,
  limit_negative          boolean,
  shortfall_uzs           numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_today       date := (now() at time zone 'Asia/Tashkent')::date;
  v_month_start date := date_trunc('month', v_today)::date;
  v_month_end   date := (date_trunc('month', v_today) + interval '1 month - 1 day')::date;
  v_rate        numeric;
  v_rate_date   date;
  v_uzs         numeric;
  v_usd         numeric;
  v_total       numeric;
  v_obligations numeric := 0;
  v_income      numeric;
  v_expense     numeric;
  v_fixed_plan  numeric;
  v_fixed_paid  numeric;
  v_fixed_left  numeric;
  v_goals       numeric := 0;
  v_days        int;
  v_available   numeric;
begin
  select r.usd_to_uzs, r.date into v_rate, v_rate_date
  from public.exchange_rates r
  where r.date <= v_today
  order by r.date desc
  limit 1;

  select coalesce(sum(b.balance) filter (where b.currency = 'UZS'), 0),
         coalesce(sum(b.balance) filter (where b.currency = 'USD'), 0)
  into v_uzs, v_usd
  from public.wallet_balances b;

  v_total := v_uzs + v_usd * coalesce(v_rate, 0);

  select coalesce(sum(t.amount * t.rate_to_uzs) filter (where c.kind = 'income'), 0),
         coalesce(sum(t.amount * t.rate_to_uzs) filter (where c.kind = 'expense'), 0),
         coalesce(sum(t.amount * t.rate_to_uzs) filter (where c.kind = 'expense' and c.group_type = 'fixed'), 0)
  into v_income, v_expense, v_fixed_paid
  from public.transactions t
  join public.categories c on c.id = t.category_id
  where t.date between v_month_start and v_month_end;

  select s.monthly_fixed_expenses into v_fixed_plan from public.settings s;

  v_fixed_left := greatest(coalesce(v_fixed_plan, 0) - v_fixed_paid, 0);
  v_days := v_month_end - v_today + 1;
  v_available := (v_total - v_obligations) - v_fixed_left - v_goals;

  return query select
    v_today,
    v_days,
    v_rate,
    v_rate_date,
    v_uzs,
    v_usd,
    round(v_total, 2),
    v_obligations,
    round(v_total - v_obligations, 2),
    round(v_income, 2),
    round(v_expense, 2),
    v_fixed_plan,
    round(v_fixed_paid, 2),
    round(v_fixed_left, 2),
    v_goals,
    greatest(floor(v_available / v_days), 0),
    v_available < 0,
    round(greatest(-v_available, 0), 2);
end;
$$;

revoke execute on function public.dashboard_summary() from public, anon;
grant execute on function public.dashboard_summary() to authenticated;
