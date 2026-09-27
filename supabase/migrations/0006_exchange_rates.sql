-- 0006: Valyuta kurslari (CBU'dan, kuniga bir marta keshlanadi)
-- date — kurs qaysi kun uchun so'ralgan; usd_to_uzs — 1 USD necha so'm.

create table public.exchange_rates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  date        date not null,
  usd_to_uzs  numeric(18,4) not null check (usd_to_uzs > 0),
  created_at  timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.exchange_rates enable row level security;

create policy "exchange_rates_select_own" on public.exchange_rates
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "exchange_rates_insert_own" on public.exchange_rates
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "exchange_rates_update_own" on public.exchange_rates
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "exchange_rates_delete_own" on public.exchange_rates
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.exchange_rates to authenticated;
