-- 0003: Tranzaksiyalar
-- amount doim musbat; daromad yoki xarajat ekanini kategoriya turi (kind) belgilaydi.
-- currency hamyondan avtomatik olinadi; UZS bo'lsa rate_to_uzs avtomatik 1.
-- project_id va goal_id hozircha oddiy ustun — loyihalar (3-bosqich) va
-- maqsadlar (4-bosqich) jadvallari yaratilganda ularga bog'lanadi.

create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  date         date not null default ((now() at time zone 'Asia/Tashkent')::date),
  amount       numeric(18,2) not null check (amount > 0),
  currency     text not null check (currency in ('UZS', 'USD')),
  rate_to_uzs  numeric(18,4) not null default 1 check (rate_to_uzs > 0),
  wallet_id    uuid not null,
  category_id  uuid not null,
  project_id   uuid,
  goal_id      uuid,
  note         text,
  created_at   timestamptz not null default now(),
  check (currency <> 'UZS' or rate_to_uzs = 1),
  constraint transactions_wallet_fkey foreign key (wallet_id, user_id, currency)
    references public.wallets (id, user_id, currency) on delete restrict,
  constraint transactions_category_fkey foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_wallet_idx on public.transactions (wallet_id);
create index transactions_category_idx on public.transactions (category_id);

-- Valyutani hamyondan olish va UZS uchun kursni 1 qilish
create function public.transactions_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select w.currency into new.currency
  from public.wallets w
  where w.id = new.wallet_id;

  if new.currency is null then
    raise exception 'Hamyon topilmadi';
  end if;

  if new.currency = 'UZS' then
    new.rate_to_uzs := 1;
  end if;

  return new;
end;
$$;

create trigger transactions_before_write
  before insert or update on public.transactions
  for each row execute function public.transactions_before_write();

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "transactions_update_own" on public.transactions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.transactions to authenticated;
