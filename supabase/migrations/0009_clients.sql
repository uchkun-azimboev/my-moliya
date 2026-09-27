-- 0009: Mijozlar

create table public.clients (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  note        text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (id, user_id)
);

create index clients_user_id_idx on public.clients (user_id);

alter table public.clients enable row level security;

create policy "clients_select_own" on public.clients
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "clients_insert_own" on public.clients
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "clients_update_own" on public.clients
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "clients_delete_own" on public.clients
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.clients to authenticated;
