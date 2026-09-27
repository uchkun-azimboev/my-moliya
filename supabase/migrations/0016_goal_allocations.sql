-- 0016: Jamg'arma ajratmalari (virtual — pul hamyonda qoladi)
-- amount maqsad valyutasida: musbat — ajratish, manfiy — qo'lda bo'shatish.
-- Faqat jamg'arma (saving) maqsadiga yoziladi — trigger tekshiradi.

create table public.goal_allocations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id     uuid not null,
  date        date not null default ((now() at time zone 'Asia/Tashkent')::date),
  amount      numeric(18,2) not null check (amount <> 0),
  note        text,
  created_at  timestamptz not null default now(),
  constraint goal_allocations_goal_fkey foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete cascade
);

create index goal_allocations_goal_idx on public.goal_allocations (goal_id);
create index goal_allocations_user_date_idx on public.goal_allocations (user_id, date);

create function public.goal_allocations_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.goals g where g.id = new.goal_id and g.kind = 'saving') then
    raise exception 'Ajratma faqat jamg''arma maqsadiga yoziladi';
  end if;
  return new;
end;
$$;

create trigger goal_allocations_before_write
  before insert or update on public.goal_allocations
  for each row execute function public.goal_allocations_before_write();

alter table public.goal_allocations enable row level security;

create policy "goal_allocations_select_own" on public.goal_allocations
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "goal_allocations_insert_own" on public.goal_allocations
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "goal_allocations_update_own" on public.goal_allocations
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "goal_allocations_delete_own" on public.goal_allocations
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.goal_allocations to authenticated;
