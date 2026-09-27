-- 0007: Foydalanuvchi sozlamalari (har bir foydalanuvchiga bitta qator)
-- monthly_fixed_expenses — oylik majburiy doimiy xarajatlar (so'mda), kunlik limit uchun.
-- VAQTINCHA: 5-bosqichda budjet (budgets jadvali) bilan almashtiriladi.
-- Mavzu (yorug'/qorong'i) bu yerda emas — u qurilmada (brauzerda) saqlanadi.

create table public.settings (
  user_id                 uuid primary key default auth.uid() references auth.users on delete cascade,
  monthly_fixed_expenses  numeric(18,2) check (monthly_fixed_expenses >= 0),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "settings_select_own" on public.settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "settings_insert_own" on public.settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "settings_update_own" on public.settings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "settings_delete_own" on public.settings
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.settings to authenticated;
