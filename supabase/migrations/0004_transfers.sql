-- 0004: Hamyonlar orasida o'tkazma (valyuta ayirboshlash ham)
-- from_amount — chiqqan hamyon valyutasida, to_amount — kirgan hamyon valyutasida.
-- rate avtomatik hisoblanadi: bir xil valyutada 1, UZS<->USD da "1 USD = X so'm".

create table public.transfers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users on delete cascade,
  date            date not null default ((now() at time zone 'Asia/Tashkent')::date),
  from_wallet_id  uuid not null,
  to_wallet_id    uuid not null,
  from_amount     numeric(18,2) not null check (from_amount > 0),
  to_amount       numeric(18,2) not null check (to_amount > 0),
  rate            numeric(18,4) not null default 1 check (rate > 0),
  note            text,
  created_at      timestamptz not null default now(),
  check (from_wallet_id <> to_wallet_id),
  constraint transfers_from_wallet_fkey foreign key (from_wallet_id, user_id)
    references public.wallets (id, user_id) on delete restrict,
  constraint transfers_to_wallet_fkey foreign key (to_wallet_id, user_id)
    references public.wallets (id, user_id) on delete restrict
);

create index transfers_user_date_idx on public.transfers (user_id, date desc);
create index transfers_from_wallet_idx on public.transfers (from_wallet_id);
create index transfers_to_wallet_idx on public.transfers (to_wallet_id);

create function public.transfers_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  from_cur text;
  to_cur   text;
begin
  select currency into from_cur from public.wallets where id = new.from_wallet_id;
  select currency into to_cur   from public.wallets where id = new.to_wallet_id;

  if from_cur is null or to_cur is null then
    raise exception 'Hamyon topilmadi';
  end if;

  if from_cur = to_cur then
    if new.from_amount <> new.to_amount then
      raise exception 'Bir xil valyutadagi o''tkazmada summalar teng bo''lishi kerak';
    end if;
    new.rate := 1;
  elsif from_cur = 'USD' then
    new.rate := round(new.to_amount / new.from_amount, 4);
  else
    new.rate := round(new.from_amount / new.to_amount, 4);
  end if;

  return new;
end;
$$;

create trigger transfers_before_write
  before insert or update on public.transfers
  for each row execute function public.transfers_before_write();

alter table public.transfers enable row level security;

create policy "transfers_select_own" on public.transfers
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "transfers_insert_own" on public.transfers
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "transfers_update_own" on public.transfers
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transfers_delete_own" on public.transfers
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.transfers to authenticated;
