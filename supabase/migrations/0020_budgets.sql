-- 0020: Budjet — kategoriya bo'yicha oylik reja (so'mda)
-- month — oyning 1-kuni. Bir oyda bitta kategoriyaga bitta reja. Faqat xarajat kategoriyalari (trigger).

create table public.budgets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users on delete cascade,
  month           date not null check (extract(day from month) = 1),
  category_id     uuid not null,
  planned_amount  numeric(18,2) not null check (planned_amount >= 0),
  created_at      timestamptz not null default now(),
  unique (user_id, month, category_id),
  constraint budgets_category_fkey foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete cascade
);

create index budgets_user_month_idx on public.budgets (user_id, month);

create function public.budgets_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.categories c where c.id = new.category_id and c.kind = 'expense') then
    raise exception 'Budjet faqat xarajat kategoriyasiga qo''yiladi';
  end if;
  return new;
end;
$$;

create trigger budgets_before_write
  before insert or update on public.budgets
  for each row execute function public.budgets_before_write();

alter table public.budgets enable row level security;

create policy "budgets_select_own" on public.budgets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "budgets_insert_own" on public.budgets
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "budgets_update_own" on public.budgets
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "budgets_delete_own" on public.budgets
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.budgets to authenticated;
