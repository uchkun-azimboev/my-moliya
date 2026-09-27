-- 0010: Loyihalar
-- Bajarilish ikki usulda: progress_mode = 'percent' (progress_percent) yoki 'units' (units_done / units_total).
-- Status SAQLANMAYDI — project_summary view'da hisoblanadi. Bazada faqat qo'lda yopilgani (closed) turadi.
-- Retainer (oylik) loyihaning har bir oyi alohida qator; previous_project_id — oldingi davr.

create table public.projects (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users on delete cascade,
  client_id            uuid not null,
  name                 text not null check (length(trim(name)) > 0),
  total_amount         numeric(18,2) not null check (total_amount > 0),
  currency             text not null check (currency in ('UZS', 'USD')),
  start_date           date not null default ((now() at time zone 'Asia/Tashkent')::date),
  end_date             date,
  progress_mode        text not null default 'percent' check (progress_mode in ('percent', 'units')),
  progress_percent     numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  units_total          int check (units_total > 0),
  units_done           int check (units_done >= 0),
  is_retainer          boolean not null default false,
  previous_project_id  uuid,
  closed               boolean not null default false,
  note                 text,
  created_at           timestamptz not null default now(),
  unique (id, user_id),
  check (end_date is null or end_date >= start_date),
  check (progress_mode <> 'units' or (units_total is not null and units_done is not null and units_done <= units_total)),
  constraint projects_client_fkey foreign key (client_id, user_id)
    references public.clients (id, user_id) on delete restrict,
  constraint projects_previous_fkey foreign key (previous_project_id, user_id)
    references public.projects (id, user_id) on delete set null (previous_project_id)
);

create index projects_user_id_idx on public.projects (user_id);
create index projects_client_idx on public.projects (client_id);

alter table public.projects enable row level security;

create policy "projects_select_own" on public.projects
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "projects_insert_own" on public.projects
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "projects_update_own" on public.projects
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "projects_delete_own" on public.projects
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.projects to authenticated;
