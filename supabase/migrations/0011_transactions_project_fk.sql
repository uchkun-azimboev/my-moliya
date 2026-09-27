-- 0011: transactions.project_id → projects (foreign key)
-- To'lov bog'langan loyihani o'chirib bo'lmaydi. project_id bo'sh bo'lsa tekshirilmaydi.

alter table public.transactions
  add constraint transactions_project_fkey foreign key (project_id, user_id)
    references public.projects (id, user_id) on delete restrict;

create index transactions_project_idx on public.transactions (project_id) where project_id is not null;
