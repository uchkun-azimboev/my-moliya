-- 0002: Kategoriyalar (daromad / xarajat)
-- group_type: fixed (majburiy doimiy), work (ish xarajati), variable (o'zgaruvchan).
-- ("group" so'zi SQL'da band, shuning uchun ustun nomi group_type.)

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  kind        text not null check (kind in ('income', 'expense')),
  group_type  text check (group_type in ('fixed', 'work', 'variable')),
  icon        text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (id, user_id)
);

create index categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "categories_select_own" on public.categories
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "categories_insert_own" on public.categories
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "categories_update_own" on public.categories
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categories_delete_own" on public.categories
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.categories to authenticated;
