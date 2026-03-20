alter table public.event_inquiries
add column if not exists selected_decor_categories text[] not null default '{}',
add column if not exists decor_selections jsonb not null default '[]'::jsonb;
