with latest_contract as (
  select *
  from (
    select
      c.inquiry_id,
      c.contract_status,
      c.deposit_paid,
      c.created_at,
      row_number() over (
        partition by c.inquiry_id
        order by c.created_at desc, c.id desc
      ) as row_num
    from public.contracts c
    where c.inquiry_id is not null
  ) ranked
  where row_num = 1
),
derived_workflow as (
  select
    i.id as inquiry_id,
    case
      when i.completed_at is not null or i.booking_stage = 'completed' then 'handoff'
      when i.booking_stage = 'reserved' then 'handoff'
      when i.booking_stage = 'signed_deposit_paid' then 'contract'
      when i.booking_stage = 'contract_sent' then 'contract'
      when i.booking_stage = 'quote_sent' then 'quote'
      when i.booking_stage = 'consultation_scheduled' then 'consultation'
      when i.booking_stage = 'inquiry' then 'intake'
      when i.status = 'booked' then 'handoff'
      when coalesce(lc.deposit_paid, false) then 'contract'
      when lc.contract_status in ('sent', 'signed', 'deposit_paid', 'closed') then 'contract'
      when i.quote_response_status = 'awaiting_response' or i.status = 'quoted' then 'quote'
      when i.consultation_status in ('approved', 'under_review', 'scheduled', 'completed', 'reschedule_needed') then 'consultation'
      else 'intake'
    end as workflow_stage,
    case
      when i.completed_at is not null or i.booking_stage = 'completed' then coalesce(i.completed_at, i.updated_at, i.created_at)
      when i.booking_stage = 'reserved' then coalesce(i.reserved_at, i.booking_confirmed_at, i.booked_at, i.updated_at, i.created_at)
      when i.booking_stage = 'signed_deposit_paid' then coalesce(i.booking_confirmed_at, i.updated_at, i.created_at)
      when i.booking_stage = 'contract_sent' then coalesce(lc.created_at, i.quoted_at, i.updated_at, i.created_at)
      when i.booking_stage = 'quote_sent' then coalesce(i.quoted_at, i.updated_at, i.created_at)
      when i.booking_stage = 'consultation_scheduled' then coalesce(i.consultation_at, i.follow_up_at, i.updated_at, i.created_at)
      when i.status = 'booked' then coalesce(i.booked_at, i.reserved_at, i.updated_at, i.created_at)
      when coalesce(lc.deposit_paid, false) then coalesce(i.booking_confirmed_at, lc.created_at, i.updated_at, i.created_at)
      when lc.contract_status in ('sent', 'signed', 'deposit_paid', 'closed') then coalesce(lc.created_at, i.updated_at, i.created_at)
      when i.quote_response_status = 'awaiting_response' or i.status = 'quoted' then coalesce(i.quoted_at, i.updated_at, i.created_at)
      when i.consultation_status in ('approved', 'under_review', 'scheduled', 'completed', 'reschedule_needed') then coalesce(i.consultation_at, i.follow_up_at, i.updated_at, i.created_at)
      else coalesce(i.created_at, timezone('utc', now()))
    end as workflow_updated_at
  from public.event_inquiries i
  left join latest_contract lc
    on lc.inquiry_id = i.id
),
updated_inquiries as (
  update public.event_inquiries i
  set
    workflow_stage = d.workflow_stage,
    workflow_updated_at = d.workflow_updated_at
  from derived_workflow d
  where i.id = d.inquiry_id
    and (
      i.workflow_stage is distinct from d.workflow_stage
      or i.workflow_updated_at is null
    )
  returning i.id
),
missing_transition_history as (
  select
    d.inquiry_id,
    d.workflow_stage,
    d.workflow_updated_at
  from derived_workflow d
  where not exists (
    select 1
    from public.workflow_transitions wt
    where wt.inquiry_id = d.inquiry_id
  )
)
insert into public.workflow_transitions (
  inquiry_id,
  actor_id,
  from_stage,
  to_stage,
  source_action,
  note,
  metadata,
  created_at
)
select
  m.inquiry_id,
  null,
  null,
  m.workflow_stage,
  'workflow.backfill',
  'Initial workflow transition backfilled from existing inquiry and contract state.',
  jsonb_build_object(
    'backfill', true,
    'source', 'supabase.workflow-stage-backfill.sql'
  ),
  m.workflow_updated_at
from missing_transition_history m;
