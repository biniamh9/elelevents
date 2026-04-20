alter table if exists public.event_inquiries
  add column if not exists workflow_stage text;

alter table if exists public.event_inquiries
  add column if not exists workflow_updated_at timestamptz;

alter table if exists public.event_inquiries
  drop constraint if exists event_inquiries_workflow_stage_check;

alter table if exists public.event_inquiries
  add constraint event_inquiries_workflow_stage_check
  check (
    workflow_stage is null
    or workflow_stage in ('intake', 'consultation', 'quote', 'contract', 'handoff')
  );

create table if not exists public.workflow_transitions (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.event_inquiries(id) on delete cascade,
  actor_id uuid references public.crm_profiles(id) on delete set null,
  from_stage text,
  to_stage text not null,
  source_action text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint workflow_transitions_from_stage_check check (
    from_stage is null or from_stage in ('intake', 'consultation', 'quote', 'contract', 'handoff')
  ),
  constraint workflow_transitions_to_stage_check check (
    to_stage in ('intake', 'consultation', 'quote', 'contract', 'handoff')
  )
);

create index if not exists idx_event_inquiries_workflow_stage
on public.event_inquiries(workflow_stage, workflow_updated_at desc);

create index if not exists idx_workflow_transitions_inquiry_created
on public.workflow_transitions(inquiry_id, created_at desc);

alter table public.workflow_transitions enable row level security;

drop policy if exists "staff read workflow transitions" on public.workflow_transitions;
create policy "staff read workflow transitions"
on public.workflow_transitions
for select
using (
  exists (
    select 1
    from public.crm_profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
);

drop policy if exists "admins manage workflow transitions" on public.workflow_transitions;
create policy "admins manage workflow transitions"
on public.workflow_transitions
for all
using (
  exists (
    select 1
    from public.crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);
