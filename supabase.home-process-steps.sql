create table if not exists public.homepage_process_steps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text not null,
  image_url text,
  sort_order integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists homepage_process_steps_sort_order_idx
  on public.homepage_process_steps (sort_order asc);

insert into public.homepage_process_steps (title, text, sort_order, is_active)
select *
from (
  values
    ('Submit Request', 'Tell us your date and event details', 1, true),
    ('Consultation', 'We align on style, scope, and priorities', 2, true),
    ('Quote + Contract', 'You receive pricing and your agreement', 3, true),
    ('Secure Your Date', 'Sign and pay the deposit to reserve', 4, true),
    ('Event Day', 'Walk into a fully styled celebration', 5, true)
) as seed(title, text, sort_order, is_active)
where not exists (
  select 1 from public.homepage_process_steps
);
