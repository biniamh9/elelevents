alter table public.event_inquiries
  add column if not exists crm_owner text,
  add column if not exists lost_reason text;

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

create index if not exists event_inquiries_crm_owner_idx
  on public.event_inquiries (crm_owner);

create index if not exists event_inquiries_lost_reason_idx
  on public.event_inquiries (lost_reason);
