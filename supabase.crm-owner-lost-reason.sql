alter table public.event_inquiries
  add column if not exists crm_owner text,
  add column if not exists lost_reason text,
  add column if not exists crm_next_action text,
  add column if not exists crm_next_action_due_at timestamptz,
  add column if not exists crm_lead_score integer,
  add column if not exists crm_lead_temperature text,
  add column if not exists crm_lost_at timestamptz,
  add column if not exists crm_lost_context text;

update public.event_inquiries as inquiries
set crm_owner = task_owner.owner_name
from (
  select distinct on (inquiry_id)
    inquiry_id,
    nullif(trim(owner_name), '') as owner_name
  from public.crm_follow_up_tasks
  where inquiry_id is not null
    and nullif(trim(owner_name), '') is not null
  order by inquiry_id, created_at desc
) as task_owner
where inquiries.id = task_owner.inquiry_id
  and inquiries.crm_owner is null;

update public.event_inquiries as inquiries
set
  crm_next_action = task_snapshot.title,
  crm_next_action_due_at = coalesce(task_snapshot.due_at, inquiries.follow_up_at)
from (
  select distinct on (inquiry_id)
    inquiry_id,
    title,
    due_at
  from public.crm_follow_up_tasks
  where inquiry_id is not null
    and status = 'open'
  order by inquiry_id, created_at desc
) as task_snapshot
where inquiries.id = task_snapshot.inquiry_id
  and inquiries.crm_next_action is null;

update public.event_inquiries
set crm_next_action_due_at = follow_up_at
where crm_next_action_due_at is null
  and follow_up_at is not null;

update public.event_inquiries
set crm_lead_temperature = case
  when status = 'booked' or booking_stage in ('reserved', 'signed_deposit_paid', 'completed') then 'hot'
  when quote_response_status in ('awaiting_response', 'accepted', 'changes_requested') or status = 'quoted' then 'hot'
  when consultation_status in ('requested', 'under_review', 'approved', 'scheduled', 'completed', 'reschedule_needed', 'no_show') or status = 'contacted' then 'warm'
  else 'cold'
end
where crm_lead_temperature is null;

update public.event_inquiries
set crm_lead_score = case crm_lead_temperature
  when 'hot' then 80
  when 'warm' then 55
  else 25
end
where crm_lead_score is null;

update public.event_inquiries
set crm_lost_at = coalesce(workflow_updated_at, updated_at, created_at)
where status = 'closed_lost'
  and crm_lost_at is null;

create index if not exists event_inquiries_crm_owner_idx
  on public.event_inquiries (crm_owner);

create index if not exists event_inquiries_lost_reason_idx
  on public.event_inquiries (lost_reason);

create index if not exists event_inquiries_crm_next_action_due_at_idx
  on public.event_inquiries (crm_next_action_due_at);

create index if not exists event_inquiries_crm_lead_temperature_idx
  on public.event_inquiries (crm_lead_temperature);

create index if not exists event_inquiries_crm_lost_at_idx
  on public.event_inquiries (crm_lost_at);
