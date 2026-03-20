alter table public.event_inquiries
add column if not exists consultation_request_date date,
add column if not exists consultation_request_time text,
add column if not exists consultation_video_platform text;
