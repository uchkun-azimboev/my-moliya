-- 0015: Maqsadlar (jamg'arma va qarz)
-- start_amount — ilova hamyonlaridan tashqaridagi boshlang'ich summa (jamg'armada: allaqachon yig'ilgan,
--   qarzda: allaqachon to'langan). Progressga kiradi, xavfsiz puldan AYRILMAYDI.
-- monthly_plan — ixtiyoriy "oylik rejadagi to'lov"; bo'sh bo'lsa kunlik limit avtomatik hisoblangan
--   oylik kerakli summaga tayanadi.
-- Status saqlanmaydi (goal_summary da hisoblanadi) — faqat qo'lda yopilgani (closed).

create table public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  name           text not null check (length(trim(name)) > 0),
  kind           text not null check (kind in ('saving', 'debt')),
  target_amount  numeric(18,2) not null check (target_amount > 0),
  currency       text not null check (currency in ('UZS', 'USD')),
  start_amount   numeric(18,2) not null default 0 check (start_amount >= 0),
  deadline       date,
  priority       int not null default 1 check (priority between 1 and 99),
  monthly_plan   numeric(18,2) check (monthly_plan > 0),
  closed         boolean not null default false,
  note           text,
  created_at     timestamptz not null default now(),
  unique (id, user_id)
);

create index goals_user_id_idx on public.goals (user_id);

alter table public.goals enable row level security;

create policy "goals_select_own" on public.goals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "goals_insert_own" on public.goals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "goals_update_own" on public.goals
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "goals_delete_own" on public.goals
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.goals to authenticated;
