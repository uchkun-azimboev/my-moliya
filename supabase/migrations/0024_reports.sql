-- 0024: Hisobot funksiyalari (saqlanmaydi — har safar hisoblanadi, security invoker → RLS).
-- Barcha summalar so'mda, har bir tranzaksiya o'z kursida (rate_to_uzs).
-- "Qarz to'lovi" = qarz maqsadiga bog'langan xarajat: xarajat statistikasiga kirmaydi, alohida.
-- Sof natija = daromad − xarajat − qarz to'lovlari (pul oqimi).

-- Oyma-oy trend: joriy oy va undan oldingi (p_months − 1) oy
create function public.report_monthly(p_months int default 12)
returns table (month date, income numeric, expense numeric, debt_paid numeric, net numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with m as (
    select (date_trunc('month', (now() at time zone 'Asia/Tashkent')) - make_interval(months => g))::date as month
    from generate_series(0, greatest(p_months, 1) - 1) g
  ),
  t as (
    select date_trunc('month', t.date)::date as month,
           c.kind, g.kind as goal_kind,
           t.amount * t.rate_to_uzs as uzs
    from public.transactions t
    join public.categories c on c.id = t.category_id
    left join public.goals g on g.id = t.goal_id
    where t.date >= (select min(month) from m)
  )
  select m.month,
         round(coalesce(sum(t.uzs) filter (where t.kind = 'income'), 0), 2),
         round(coalesce(sum(t.uzs) filter (where t.kind = 'expense' and t.goal_kind is distinct from 'debt'), 0), 2),
         round(coalesce(sum(t.uzs) filter (where t.kind = 'expense' and t.goal_kind = 'debt'), 0), 2),
         round(coalesce(sum(case when t.kind = 'income' then t.uzs else -t.uzs end), 0), 2)
  from m
  left join t on t.month = m.month
  group by m.month
  order by m.month;
$$;

-- Kategoriyalar bo'yicha xarajat taqsimoti (qarz to'lovlarisiz), [p_from, p_to] oralig'ida
create function public.report_categories(p_from date, p_to date)
returns table (category_id uuid, name text, icon text, group_type text, amount numeric, share numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with x as (
    select c.id, c.name, c.icon, c.group_type, sum(t.amount * t.rate_to_uzs) as amount
    from public.transactions t
    join public.categories c on c.id = t.category_id and c.kind = 'expense'
    left join public.goals g on g.id = t.goal_id
    where t.date between p_from and p_to and g.kind is distinct from 'debt'
    group by c.id, c.name, c.icon, c.group_type
  )
  select x.id, x.name, x.icon, x.group_type, round(x.amount, 2),
         round(x.amount / nullif(sum(x.amount) over (), 0) * 100, 1)
  from x
  order by x.amount desc;
$$;

-- Mijozlar ulushi (oxirgi p_months oy, bugungacha): loyihalarga bog'langan daromad − qaytarilgan pul;
-- loyihaga bog'lanmagan daromad — "Boshqa daromad" (client_id = null). Ulush — jami daromaddan.
create function public.report_clients(p_months int default 6)
returns table (client_id uuid, name text, amount numeric, share numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select ((now() at time zone 'Asia/Tashkent')::date - make_interval(months => p_months))::date as from_d,
           (now() at time zone 'Asia/Tashkent')::date as to_d
  ),
  x as (
    select p.client_id,
           sum(case when c.kind = 'income' then 1 else -1 end * t.amount * t.rate_to_uzs) as amount
    from public.transactions t
    join public.categories c on c.id = t.category_id
    left join public.projects p on p.id = t.project_id
    where t.date > (select from_d from bounds) and t.date <= (select to_d from bounds)
      and (c.kind = 'income' or t.project_id is not null)
    group by p.client_id
  )
  select x.client_id, coalesce(cl.name, 'Boshqa daromad'), round(x.amount, 2),
         round(x.amount / nullif(sum(x.amount) over (), 0) * 100, 1)
  from x
  left join public.clients cl on cl.id = x.client_id
  where x.amount <> 0
  order by (x.client_id is null), x.amount desc;
$$;

-- Runway va xavfsiz daromad.
-- full_months — ma'lumot bor to'liq (tugagan) oylar soni: birinchi tranzaksiya oyidan joriy oygacha.
-- safe_income = oxirgi min(6, full_months) to'liq oydagi eng past oylik daromad; full_months < 3 bo'lsa null.
-- runway = xavfsiz pul ÷ oylik majburiy xarajat, bu yerda majburiy xarajat:
--   full_months ≥ 3 — oxirgi 3 to'liq oy "fixed" guruh o'rtachasi ('history'),
--   aks holda — joriy majburiy reja (budjet yoki sozlama, dashboard_summary) ('plan').
create function public.report_stats()
returns table (
  full_months int, safe_income numeric, safe_income_months int,
  runway_months numeric, runway_base numeric, runway_source text, safe_uzs numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_month  date := date_trunc('month', (now() at time zone 'Asia/Tashkent'))::date;
  v_first  date;
  v_full   int;
  v_n      int;
  v_safe_income numeric;
  v_fixed_avg   numeric;
  v_base   numeric;
  v_source text;
  v_safe   numeric;
  v_plan   numeric;
begin
  select date_trunc('month', min(t.date))::date into v_first from public.transactions t;
  v_full := case when v_first is null or v_first >= v_month then 0
                 else ((extract(year from v_month) * 12 + extract(month from v_month))
                       - (extract(year from v_first) * 12 + extract(month from v_first)))::int end;

  if v_full >= 3 then
    v_n := least(v_full, 6);
    select min(r.income) into v_safe_income
    from public.report_monthly(v_n + 1) r
    where r.month < v_month;

    select sum(t.amount * t.rate_to_uzs) / 3 into v_fixed_avg
    from public.transactions t
    join public.categories c on c.id = t.category_id and c.kind = 'expense' and c.group_type = 'fixed'
    left join public.goals g on g.id = t.goal_id
    where t.date >= (v_month - interval '3 months')::date and t.date < v_month and g.kind is distinct from 'debt';
  end if;

  select d.safe_uzs, d.monthly_fixed_expenses into v_safe, v_plan from public.dashboard_summary() d;

  if v_full >= 3 and coalesce(v_fixed_avg, 0) > 0 then
    v_base := v_fixed_avg; v_source := 'history';
  elsif coalesce(v_plan, 0) > 0 then
    v_base := v_plan; v_source := 'plan';
  else
    v_base := null; v_source := 'none';
  end if;

  return query select
    v_full,
    round(v_safe_income, 2),
    case when v_full >= 3 then least(v_full, 6) end,
    case when v_base > 0 then round(greatest(v_safe, 0) / v_base, 1) end,
    round(v_base, 2),
    v_source,
    v_safe;
end;
$$;

revoke execute on function public.report_monthly(int) from public, anon;
revoke execute on function public.report_categories(date, date) from public, anon;
revoke execute on function public.report_clients(int) from public, anon;
revoke execute on function public.report_stats() from public, anon;
grant execute on function public.report_monthly(int) to authenticated;
grant execute on function public.report_categories(date, date) to authenticated;
grant execute on function public.report_clients(int) to authenticated;
grant execute on function public.report_stats() to authenticated;
