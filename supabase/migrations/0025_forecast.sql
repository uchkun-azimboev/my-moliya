-- 0025: 30/60/90 kunlik prognoz (saqlanmaydi — har safar hisoblanadi).
--
-- Boshlanish: bugungi xavfsiz pul (dashboard_summary.safe_uzs).
-- Har kuni (bugundan boshlab, kun oxiridagi balans):
--   + kutilayotgan loyiha to'lovlari — project_summary.expected_uzs, loyihaning end_date kunida
--     (end_date yo'q yoki o'tib ketgan — prognozga kirmaydi, forecast_params.undated_* da alohida)
--   + retainer keyingi davrlari (faqat "Retainer bilan" chizig'ida): davom etadigan (continues) retainerning
--     oxirgi davri uchun har keyingi davr boshida total_amount (USD — bugungi kursda)
--   − majburiy xarajatlar: joriy oy — dashboard'dagi qolgan summa qolgan kunlarga teng bo'linadi;
--     keyingi oylar — o'sha oy "fixed" budjeti, bo'lmasa joriy majburiy reja, oy kunlariga teng
--   − boshqa xarajatlar (o'zgaruvchan + ish guruhlari), manba tartibi:
--       'budget'  — joriy oyda shu guruhlarga budjet bo'lsa (joriy oy: Σ qolgan; keyingi oylar: o'sha oy budjeti yoki joriyniki)
--       'history' — oxirgi 3 (kamida 1) to'liq oy o'rtachasi (joriy oy: o'rtacha − shu oy sarflangan)
--       'current' — tarix yo'q: joriy oyning kunlik o'rtacha sarfi har kuni
--       'none'    — hech narsa yo'q
--   − maqsad/qarz rejalari: joriy oy — goal_summary.month_left_uzs; keyingi oylar — oylik reja,
--     maqsadning qolgan summasidan oshmaydi

create function public.forecast_params()
returns table (
  today date, start_uzs numeric, usd_rate numeric,
  fixed_plan numeric, fixed_left numeric, fixed_source text,
  other_source text, other_month numeric, other_left numeric, other_daily numeric,
  undated_expected_uzs numeric, undated_count int
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  d        record;
  v_month  date;
  v_first  date;
  v_full   int;
  v_n      int;
  v_spent  numeric;
  v_src    text;
  v_om     numeric := 0;
  v_ol     numeric := 0;
  v_od     numeric := 0;
  v_und    numeric;
  v_undc   int;
begin
  select * into d from public.dashboard_summary();
  v_month := date_trunc('month', d.today)::date;

  -- shu oy o'zgaruvchan + ish guruhlaridagi xarajat (qarz to'lovlarisiz)
  select coalesce(sum(t.amount * t.rate_to_uzs), 0) into v_spent
  from public.transactions t
  join public.categories c on c.id = t.category_id and c.kind = 'expense' and c.group_type in ('variable', 'work')
  left join public.goals g on g.id = t.goal_id
  where t.date >= v_month and t.date <= d.today and g.kind is distinct from 'debt';

  select date_trunc('month', min(t.date))::date into v_first from public.transactions t;
  v_full := case when v_first is null or v_first >= v_month then 0
                 else ((extract(year from v_month) * 12 + extract(month from v_month))
                       - (extract(year from v_first) * 12 + extract(month from v_first)))::int end;

  if exists (
    select 1 from public.budgets b join public.categories c on c.id = b.category_id
    where b.month = v_month and c.group_type in ('variable', 'work')
  ) then
    v_src := 'budget';
    select coalesce(sum(br.planned), 0), coalesce(sum(br.remaining), 0) into v_om, v_ol
    from public.budget_report(v_month) br
    where br.group_type in ('variable', 'work') and br.planned is not null;
  elsif v_full >= 1 then
    v_src := 'history';
    v_n := least(v_full, 3);
    select coalesce(sum(t.amount * t.rate_to_uzs), 0) / v_n into v_om
    from public.transactions t
    join public.categories c on c.id = t.category_id and c.kind = 'expense' and c.group_type in ('variable', 'work')
    left join public.goals g on g.id = t.goal_id
    where t.date >= (v_month - make_interval(months => v_n))::date and t.date < v_month and g.kind is distinct from 'debt';
    v_ol := greatest(v_om - v_spent, 0);
  elsif v_spent > 0 then
    v_src := 'current';
    v_od := v_spent / extract(day from d.today);
    v_om := v_od * 30;
  else
    v_src := 'none';
  end if;

  select coalesce(sum(p.expected_uzs), 0), count(*) into v_und, v_undc
  from public.project_summary p
  where p.expected_uzs > 0 and (p.end_date is null or p.end_date < d.today);

  return query select
    d.today, d.safe_uzs, d.usd_rate,
    coalesce(d.monthly_fixed_expenses, 0), d.fixed_remaining_uzs, d.fixed_plan_source,
    v_src, round(v_om, 2), round(v_ol, 2), round(v_od, 2),
    round(v_und, 2), v_undc;
end;
$$;

create function public.forecast(p_days int default 90)
returns table (
  day date, balance_with numeric, balance_without numeric,
  projects_in numeric, retainer_in numeric, fixed_out numeric, other_out numeric, goals_out numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  p        record;
  v_month  date;
  v_days_left int;
  x        date;
  m        int;
  dim      int;
  mstart   date;
  v_plan   numeric;
  f_d      numeric;
  o_d      numeric;
  g_d      numeric;
  pr_d     numeric;
  rt_d     numeric;
  bal_w    numeric;
  bal_wo   numeric;
  v_goals_cur numeric;
begin
  select * into p from public.forecast_params();
  v_month := date_trunc('month', p.today)::date;
  v_days_left := ((v_month + interval '1 month - 1 day')::date - p.today) + 1;
  bal_w := p.start_uzs;
  bal_wo := p.start_uzs;

  select coalesce(sum(gs.month_left_uzs), 0) into v_goals_cur from public.goal_summary gs where gs.status = 'active';

  for i in 0 .. greatest(p_days, 1) - 1 loop
    x := p.today + i;
    mstart := date_trunc('month', x)::date;
    m := ((extract(year from mstart) * 12 + extract(month from mstart))
          - (extract(year from v_month) * 12 + extract(month from v_month)))::int;
    dim := extract(day from (mstart + interval '1 month - 1 day'))::int;

    if m = 0 then
      f_d := p.fixed_left / v_days_left;
      o_d := case p.other_source when 'current' then p.other_daily
                                 when 'none' then 0
                                 else p.other_left / v_days_left end;
      g_d := v_goals_cur / v_days_left;
    else
      -- majburiy: o'sha oy "fixed" budjeti, bo'lmasa joriy reja
      select sum(b.planned_amount) into v_plan
      from public.budgets b join public.categories c on c.id = b.category_id
      where b.month = mstart and c.group_type = 'fixed';
      f_d := coalesce(v_plan, p.fixed_plan) / dim;

      -- boshqa xarajatlar
      if p.other_source = 'budget' then
        select sum(b.planned_amount) into v_plan
        from public.budgets b join public.categories c on c.id = b.category_id
        where b.month = mstart and c.group_type in ('variable', 'work');
        o_d := coalesce(v_plan, p.other_month) / dim;
      elsif p.other_source = 'history' then
        o_d := p.other_month / dim;
      elsif p.other_source = 'current' then
        o_d := p.other_daily;
      else
        o_d := 0;
      end if;

      -- maqsadlar: oylik reja, qolgan summadan oshmaydi
      select coalesce(sum(least(gs.plan_amount * r.to_uzs,
                                greatest(gs.remaining_uzs - gs.month_left_uzs - gs.plan_amount * r.to_uzs * (m - 1), 0))), 0)
      into g_d
      from public.goal_summary gs,
           lateral (select case when gs.currency = 'UZS' then 1 else coalesce(p.usd_rate, 0) end as to_uzs) r
      where gs.status = 'active' and gs.plan_amount > 0;
      g_d := g_d / dim;
    end if;

    -- kutilayotgan loyiha to'lovlari tugash sanasida
    select coalesce(sum(ps.expected_uzs), 0) into pr_d
    from public.project_summary ps
    where ps.expected_uzs > 0 and ps.end_date = x;

    -- davom etadigan retainerlarning keyingi davrlari (oxirgi davrdan keyin, har davr boshida)
    select coalesce(sum(pr.total_amount * case when pr.currency = 'UZS' then 1 else coalesce(p.usd_rate, 0) end), 0)
    into rt_d
    from public.projects pr
    cross join generate_series(1, 36) k
    where pr.is_retainer and pr.continues
      and not exists (select 1 from public.projects nx where nx.previous_project_id = pr.id)
      and x = case when pr.end_date is null then (pr.start_date + make_interval(months => k))::date
                   else (pr.end_date + 1 + make_interval(months => k - 1))::date end;

    bal_wo := bal_wo + pr_d - f_d - o_d - g_d;
    bal_w := bal_w + pr_d + rt_d - f_d - o_d - g_d;

    day := x;
    balance_with := round(bal_w, 2);
    balance_without := round(bal_wo, 2);
    projects_in := round(pr_d, 2);
    retainer_in := round(rt_d, 2);
    fixed_out := round(f_d, 2);
    other_out := round(o_d, 2);
    goals_out := round(g_d, 2);
    return next;
  end loop;
end;
$$;

revoke execute on function public.forecast_params() from public, anon;
revoke execute on function public.forecast(int) from public, anon;
grant execute on function public.forecast_params() to authenticated;
grant execute on function public.forecast(int) to authenticated;
