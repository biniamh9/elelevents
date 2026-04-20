create table if not exists public.admin_workspace_settings (
  id text primary key default 'default',
  business_name text not null default 'Elel Events',
  business_type text not null default 'Luxury event design',
  workspace_label text not null default 'Admin workspace',
  support_email text,
  support_phone text,
  default_currency text not null default 'USD',
  default_timezone text not null default 'America/New_York',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_updated_at_on_admin_workspace_settings on public.admin_workspace_settings;
create trigger set_updated_at_on_admin_workspace_settings
before update on public.admin_workspace_settings
for each row
execute function update_updated_at_column();

alter table public.admin_workspace_settings enable row level security;

drop policy if exists "staff read workspace settings" on public.admin_workspace_settings;
create policy "staff read workspace settings"
on public.admin_workspace_settings
for select
using (
  exists (
    select 1
    from public.crm_profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
);

drop policy if exists "admins manage workspace settings" on public.admin_workspace_settings;
create policy "admins manage workspace settings"
on public.admin_workspace_settings
for all
using (
  exists (
    select 1
    from public.crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);

insert into public.admin_workspace_settings (id)
values ('default')
on conflict (id) do nothing;
