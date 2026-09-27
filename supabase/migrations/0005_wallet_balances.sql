-- 0005: Hamyon balanslari (saqlanmaydi — har safar hisoblanadi)
-- balans = boshlang'ich + daromadlar − xarajatlar + kiruvchi o'tkazmalar − chiquvchi o'tkazmalar
-- security_invoker = on: view ham RLS qoidalariga bo'ysunadi (faqat o'z hamyonlaringiz).

create view public.wallet_balances
with (security_invoker = on)
as
select
  w.id,
  w.user_id,
  w.name,
  w.currency,
  w.kind,
  w.archived,
  w.opening_balance,
  w.created_at,
  w.opening_balance
    + coalesce(tx.income, 0)
    - coalesce(tx.expense, 0)
    + coalesce(tin.total, 0)
    - coalesce(tout.total, 0) as balance
from public.wallets w
left join (
  select t.wallet_id,
         sum(t.amount) filter (where c.kind = 'income')  as income,
         sum(t.amount) filter (where c.kind = 'expense') as expense
  from public.transactions t
  join public.categories c on c.id = t.category_id
  group by t.wallet_id
) tx on tx.wallet_id = w.id
left join (
  select to_wallet_id as wallet_id, sum(to_amount) as total
  from public.transfers group by to_wallet_id
) tin on tin.wallet_id = w.id
left join (
  select from_wallet_id as wallet_id, sum(from_amount) as total
  from public.transfers group by from_wallet_id
) tout on tout.wallet_id = w.id;

grant select on public.wallet_balances to authenticated;
