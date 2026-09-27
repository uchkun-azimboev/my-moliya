-- 0017: transactions.goal_id → goals (foreign key)
-- Maqsadga faqat XARAJAT bog'lanadi: qarz maqsadida — qarz to'lovi, jamg'armada — jamg'armadan ishlatilgan pul
-- (ajratma o'z-o'zidan bo'shaydi). To'lovi bor maqsadni o'chirib bo'lmaydi.

alter table public.transactions
  add constraint transactions_goal_fkey foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete restrict;

create index transactions_goal_idx on public.transactions (goal_id) where goal_id is not null;
