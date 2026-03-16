alter table event_inquiries
add column if not exists vision_board_urls text[] not null default '{}';

insert into storage.buckets (id, name, public)
values ('vision-boards', 'vision-boards', true)
on conflict (id) do nothing;
