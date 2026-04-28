alter table event_inquiries
  add column if not exists crm_conversation_key text;

update event_inquiries
set crm_conversation_key = 'inq_' || lower(replace(id::text, '-', ''))
where crm_conversation_key is null or btrim(crm_conversation_key) = '';

create or replace function set_inquiry_conversation_key()
returns trigger
language plpgsql
as $$
begin
  if new.crm_conversation_key is null or btrim(new.crm_conversation_key) = '' then
    new.crm_conversation_key := 'inq_' || lower(replace(new.id::text, '-', ''));
  end if;
  return new;
end;
$$;

drop trigger if exists set_inquiry_conversation_key_on_event_inquiries on event_inquiries;
create trigger set_inquiry_conversation_key_on_event_inquiries
before insert or update on event_inquiries
for each row execute function set_inquiry_conversation_key();

create unique index if not exists idx_event_inquiries_crm_conversation_key
on event_inquiries(crm_conversation_key)
where crm_conversation_key is not null;

alter table customer_interactions
  add column if not exists conversation_key text;

update customer_interactions ci
set conversation_key = ei.crm_conversation_key
from event_inquiries ei
where ci.inquiry_id = ei.id
  and (ci.conversation_key is null or btrim(ci.conversation_key) = '');

create index if not exists idx_customer_interactions_conversation_key
on customer_interactions(conversation_key);

create table if not exists unmatched_inbound_email_replies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  from_email text not null,
  to_email text,
  subject text,
  body_text text not null,
  body_html text,
  thread_id text,
  message_id text,
  in_reply_to text,
  provider text,
  conversation_key text,
  match_reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  review_status text not null default 'pending_review'
    check (review_status in ('pending_review', 'resolved', 'ignored'))
);

create index if not exists idx_unmatched_inbound_email_replies_review_status
on unmatched_inbound_email_replies(review_status, created_at desc);

create index if not exists idx_unmatched_inbound_email_replies_conversation_key
on unmatched_inbound_email_replies(conversation_key);

create index if not exists idx_unmatched_inbound_email_replies_thread_id
on unmatched_inbound_email_replies(thread_id);

create index if not exists idx_unmatched_inbound_email_replies_message_id
on unmatched_inbound_email_replies(message_id);

drop trigger if exists set_updated_at_on_unmatched_inbound_email_replies on unmatched_inbound_email_replies;
create trigger set_updated_at_on_unmatched_inbound_email_replies
before update on unmatched_inbound_email_replies
for each row execute function set_updated_at();
