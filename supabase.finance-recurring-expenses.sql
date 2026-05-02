create table if not exists public.finance_recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  vendor_name text,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'recorded' check (status in ('planned', 'recorded', 'paid')),
  payment_method text,
  notes text,
  frequency text not null default 'monthly' check (frequency in ('monthly')),
  day_of_month integer not null check (day_of_month between 1 and 28),
  starts_on date not null,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.finance_expenses
add column if not exists generated_from_recurring_id uuid references public.finance_recurring_expenses(id) on delete set null;

create unique index if not exists idx_finance_expenses_recurring_month
on public.finance_expenses(generated_from_recurring_id, expense_date)
where generated_from_recurring_id is not null;

create index if not exists idx_finance_recurring_expenses_active
on public.finance_recurring_expenses(is_active, starts_on);

drop trigger if exists set_updated_at_on_finance_recurring_expenses on public.finance_recurring_expenses;
create trigger set_updated_at_on_finance_recurring_expenses
before update on public.finance_recurring_expenses
for each row
execute function update_updated_at_column();

alter table public.finance_recurring_expenses enable row level security;

drop policy if exists "staff read recurring finance expenses" on public.finance_recurring_expenses;
create policy "staff read recurring finance expenses"
on public.finance_recurring_expenses
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

drop policy if exists "finance manage recurring expenses" on public.finance_recurring_expenses;
create policy "finance manage recurring expenses"
on public.finance_recurring_expenses
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
