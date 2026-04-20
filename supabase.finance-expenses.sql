create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  category text not null,
  vendor_name text,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'recorded' check (status in ('planned', 'recorded', 'paid')),
  payment_method text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_finance_expenses_date
on public.finance_expenses(expense_date desc);

drop trigger if exists set_updated_at_on_finance_expenses on public.finance_expenses;
create trigger set_updated_at_on_finance_expenses
before update on public.finance_expenses
for each row
execute function update_updated_at_column();

alter table public.finance_expenses enable row level security;

drop policy if exists "staff read finance expenses" on public.finance_expenses;
create policy "staff read finance expenses"
on public.finance_expenses
for select
using (
  exists (
    select 1
    from public.crm_profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'finance')
      and p.is_active = true
  )
);

drop policy if exists "finance manage expenses" on public.finance_expenses;
create policy "finance manage expenses"
on public.finance_expenses
for all
using (
  exists (
    select 1
    from public.crm_profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'finance')
      and p.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.crm_profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'finance')
      and p.is_active = true
  )
);
