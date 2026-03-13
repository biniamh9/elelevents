alter table event_inquiries
add column if not exists consultation_status text not null default 'not_scheduled';

alter table event_inquiries
add column if not exists consultation_type text;

alter table event_inquiries
add column if not exists consultation_at timestamptz;

alter table event_inquiries
add column if not exists follow_up_at timestamptz;

alter table event_inquiries
add column if not exists quote_response_status text not null default 'not_sent';

create index if not exists idx_event_inquiries_consultation_status
on event_inquiries(consultation_status);

create index if not exists idx_event_inquiries_consultation_at
on event_inquiries(consultation_at);

create index if not exists idx_event_inquiries_follow_up_at
on event_inquiries(follow_up_at);

create index if not exists idx_event_inquiries_quote_response_status
on event_inquiries(quote_response_status);
