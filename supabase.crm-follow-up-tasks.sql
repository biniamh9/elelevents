create table if not exists crm_follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references event_inquiries(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  detail text,
  task_kind text not null check (
    task_kind in (
      'quote_approval',
      'quote_changes',
      'quote_followup',
      'deposit_followup',
      'contract_followup',
      'general'
    )
  ),
  status text not null default 'open' check (status in ('open', 'completed')),
  due_at timestamptz,
  completed_at timestamptz,
  owner_name text,
  source_action text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_crm_follow_up_tasks_inquiry_status
on crm_follow_up_tasks(inquiry_id, status, created_at desc);

create index if not exists idx_crm_follow_up_tasks_due_at
on crm_follow_up_tasks(due_at)
where status = 'open';

drop trigger if exists set_updated_at_on_crm_follow_up_tasks on crm_follow_up_tasks;
create trigger set_updated_at_on_crm_follow_up_tasks
before update on crm_follow_up_tasks
for each row
execute function update_updated_at_column();

alter table crm_follow_up_tasks enable row level security;

drop policy if exists "staff read crm follow up tasks" on crm_follow_up_tasks;
create policy "staff read crm follow up tasks"
on crm_follow_up_tasks
for select
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff', 'finance', 'contracts', 'operations')
      and p.is_active = true
  )
);

drop policy if exists "admins manage crm follow up tasks" on crm_follow_up_tasks;
create policy "admins manage crm follow up tasks"
on crm_follow_up_tasks
for all
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
)
with check (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);
