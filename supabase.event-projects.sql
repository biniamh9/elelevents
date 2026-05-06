create table if not exists event_projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid references clients(id) on delete set null,
  inquiry_id uuid unique references event_inquiries(id) on delete set null,
  project_name text not null,
  event_type text,
  event_date date,
  venue_name text,
  guest_count integer check (guest_count is null or guest_count >= 0),
  services text[] not null default '{}',
  investment_range text,
  status text not null default 'new_inquiry',
  next_action text,
  next_action_due_at timestamptz,
  assigned_to uuid references crm_profiles(id) on delete set null,
  source_inquiry_status text,
  booking_stage text,
  contract_status text,
  payment_status text,
  quoted_at timestamptz,
  signed_at timestamptz,
  reserved_at timestamptz,
  booked_at timestamptz,
  completed_at timestamptz,
  lost_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_event_projects_client_id
on event_projects(client_id);

create index if not exists idx_event_projects_event_date
on event_projects(event_date);

create index if not exists idx_event_projects_status
on event_projects(status);

alter table if exists contracts
  add column if not exists event_project_id uuid references event_projects(id) on delete set null;

alter table if exists client_documents
  add column if not exists event_project_id uuid references event_projects(id) on delete set null;

alter table if exists contract_payments
  add column if not exists event_project_id uuid references event_projects(id) on delete set null;

alter table if exists customer_interactions
  add column if not exists event_project_id uuid references event_projects(id) on delete set null;

alter table if exists crm_follow_up_tasks
  add column if not exists event_project_id uuid references event_projects(id) on delete set null;

create index if not exists idx_contracts_event_project_id
on contracts(event_project_id);

create index if not exists idx_client_documents_event_project_id
on client_documents(event_project_id);

create index if not exists idx_contract_payments_event_project_id
on contract_payments(event_project_id);

create index if not exists idx_customer_interactions_event_project_id
on customer_interactions(event_project_id);

create index if not exists idx_crm_follow_up_tasks_event_project_id
on crm_follow_up_tasks(event_project_id);

insert into event_projects (
  client_id,
  inquiry_id,
  project_name,
  event_type,
  event_date,
  venue_name,
  guest_count,
  services,
  investment_range,
  status,
  next_action,
  next_action_due_at,
  source_inquiry_status,
  booking_stage,
  quoted_at,
  reserved_at,
  booked_at,
  completed_at,
  lost_at,
  notes,
  metadata
)
select
  inquiry.client_id,
  inquiry.id,
  trim(coalesce(inquiry.event_type, 'Event') || ' · ' || inquiry.first_name || ' ' || inquiry.last_name),
  inquiry.event_type,
  inquiry.event_date,
  inquiry.venue_name,
  inquiry.guest_count,
  coalesce(inquiry.services, '{}'::text[]),
  nullif(
    regexp_replace(
      coalesce(substring(inquiry.additional_info from '(?:Investment range|Budget range):\s*([^\n]+)'), ''),
      '^(?:Investment range|Budget range):\s*',
      ''
    ),
    ''
  ),
  case
    when inquiry.status = 'closed_lost' then 'lost_cancelled'
    when inquiry.booking_stage = 'completed' then 'completed'
    when inquiry.booking_stage = 'reserved' then 'event_reserved'
    when inquiry.booking_stage = 'signed_deposit_paid' then 'deposit_paid'
    when inquiry.status = 'booked' then 'planning_in_progress'
    when inquiry.quote_response_status in ('accepted', 'changes_requested') then 'contract_sent'
    when inquiry.quote_response_status = 'awaiting_response' or inquiry.status = 'quoted' then 'quote_sent'
    when inquiry.consultation_status in ('approved', 'scheduled') then 'consultation_scheduled'
    when inquiry.consultation_status = 'completed' then 'quote_sent'
    when inquiry.status = 'contacted' then 'contacted'
    else 'new_inquiry'
  end,
  inquiry.crm_next_action,
  inquiry.crm_next_action_due_at,
  inquiry.status::text,
  inquiry.booking_stage,
  inquiry.quoted_at,
  inquiry.reserved_at,
  inquiry.booked_at,
  inquiry.completed_at,
  inquiry.crm_lost_at,
  inquiry.admin_notes,
  jsonb_build_object(
    'consultation_status', inquiry.consultation_status,
    'quote_response_status', inquiry.quote_response_status,
    'crm_owner', inquiry.crm_owner,
    'lead_score', inquiry.crm_lead_score,
    'lead_temperature', inquiry.crm_lead_temperature
  )
from event_inquiries inquiry
where not exists (
  select 1 from event_projects existing where existing.inquiry_id = inquiry.id
);

update contracts contract
set event_project_id = project.id
from event_projects project
where project.inquiry_id = contract.inquiry_id
  and contract.event_project_id is null;

update client_documents document
set event_project_id = project.id
from event_projects project
where document.inquiry_id = project.inquiry_id
  and document.event_project_id is null;

update client_documents document
set event_project_id = contract.event_project_id
from contracts contract
where document.contract_id = contract.id
  and contract.event_project_id is not null
  and document.event_project_id is null;

update contract_payments payment
set event_project_id = contract.event_project_id
from contracts contract
where payment.contract_id = contract.id
  and contract.event_project_id is not null
  and payment.event_project_id is null;

update customer_interactions interaction
set event_project_id = project.id
from event_projects project
where interaction.inquiry_id = project.inquiry_id
  and interaction.event_project_id is null;

update crm_follow_up_tasks task
set event_project_id = project.id
from event_projects project
where task.inquiry_id = project.inquiry_id
  and task.event_project_id is null;

drop trigger if exists set_updated_at_on_event_projects on event_projects;
create trigger set_updated_at_on_event_projects
before update on event_projects
for each row execute function set_updated_at();

alter table event_projects enable row level security;

drop policy if exists "staff read event projects" on event_projects;
create policy "staff read event projects"
on event_projects
for select
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
);

drop policy if exists "admins manage event projects" on event_projects;
create policy "admins manage event projects"
on event_projects
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
