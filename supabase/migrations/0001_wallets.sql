-- 0001: Hamyonlar (naqd / karta, UZS / USD)

create table public.wallets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users on delete cascade,
  name            text not null check (length(trim(name)) > 0),
  currency        text not null check (currency in ('UZS', 'USD')),
  kind            text not null check (kind in ('cash', 'card')),
  opening_balance numeric(18,2) not null default 0,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  -- Tranzaksiya va o'tkazmalar hamyonga shu kalitlar orqali bog'lanadi:
  -- boshqa foydalanuvchining hamyoniga yoki boshqa valyutaga yozib bo'lmaydi.
  unique (id, user_id),
  unique (id, user_id, currency)
);

create index wallets_user_id_idx on public.wallets (user_id);

alter table public.wallets enable row level security;

create policy "wallets_select_own" on public.wallets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "wallets_insert_own" on public.wallets
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "wallets_update_own" on public.wallets
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "wallets_delete_own" on public.wallets
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.wallets to authenticated;
