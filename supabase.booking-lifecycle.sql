alter table event_inquiries
add column if not exists booking_stage text not null default 'inquiry';

alter table event_inquiries
add column if not exists floor_plan_received boolean not null default false;

alter table event_inquiries
add column if not exists walkthrough_completed boolean not null default false;

alter table event_inquiries
add column if not exists reserved_at timestamptz;

alter table event_inquiries
add column if not exists completed_at timestamptz;

alter table event_inquiries
add column if not exists booking_confirmed_at timestamptz;

alter table event_inquiries
add column if not exists final_payment_reminder_sent_at timestamptz;

create index if not exists idx_event_inquiries_booking_stage
on event_inquiries(booking_stage);

update event_inquiries
set booking_stage = case
  when status = 'booked' then 'reserved'
  when status = 'quoted' then 'quote_sent'
  else 'inquiry'
end
where booking_stage is null or booking_stage = '';
