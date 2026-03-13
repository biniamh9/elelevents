create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  best_for text,
  summary text,
  features text[] not null default '{}',
  featured boolean not null default false,
  sort_order integer,
  is_active boolean not null default true
);

create index if not exists idx_packages_sort_order on packages(sort_order);
create index if not exists idx_packages_is_active on packages(is_active);

drop trigger if exists set_updated_at_on_packages on packages;
create trigger set_updated_at_on_packages
before update on packages
for each row execute function set_updated_at();

alter table packages enable row level security;

drop policy if exists "public read packages" on packages;
create policy "public read packages"
on packages
for select
using (true);

drop policy if exists "admins manage packages" on packages;
create policy "admins manage packages"
on packages
for all
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
)
with check (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);
