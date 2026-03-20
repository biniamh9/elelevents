alter table public.event_inquiries
add column if not exists consultation_location text,
add column if not exists consultation_video_link text,
add column if not exists consultation_admin_notes text,
add column if not exists consultation_request_confirmation_sent_at timestamptz,
add column if not exists consultation_schedule_email_sent_at timestamptz,
add column if not exists consultation_schedule_email_signature text,
add column if not exists consultation_admin_notification_sent_at timestamptz,
add column if not exists consultation_customer_reminder_sent_at timestamptz,
add column if not exists consultation_admin_reminder_sent_at timestamptz,
add column if not exists consultation_video_link_sent_at timestamptz;

create index if not exists idx_event_inquiries_consultation_schedule_email_sent_at
on public.event_inquiries(consultation_schedule_email_sent_at);
