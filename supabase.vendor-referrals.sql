create extension if not exists pgcrypto;

do $$
begin
  if exists (select 1 from pg_type where typname = 'activity_entity_type')
     and not exists (
       select 1
       from pg_enum
       where enumtypid = 'activity_entity_type'::regtype
         and enumlabel = 'vendor'
     ) then
    alter type activity_entity_type add value 'vendor';
  end if;

  if exists (select 1 from pg_type where typname = 'activity_entity_type')
     and not exists (
       select 1
       from pg_enum
       where enumtypid = 'activity_entity_type'::regtype
         and enumlabel = 'referral'
     ) then
    alter type activity_entity_type add value 'referral';
  end if;
end $$;

alter table event_inquiries
add column if not exists requested_vendor_categories text[] not null default '{}',
add column if not exists vendor_request_notes text;

create table if not exists vendor_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  business_name text not null,
  contact_name text not null,
  email text not null unique,
  phone text,
  service_categories text[] not null default '{}',
  city text,
  state text,
  service_area text,
  instagram_handle text,
  website_url text,
  bio text,
  pricing_tier text,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'suspended')),
  membership_status text not null default 'none'
    check (membership_status in ('none', 'trial', 'active', 'past_due', 'canceled')),
  default_referral_fee numeric(12,2) not null default 0
    check (default_referral_fee >= 0),
  is_active boolean not null default true,
  admin_notes text
);

create table if not exists vendor_referrals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  inquiry_id uuid not null references event_inquiries(id) on delete cascade,
  vendor_id uuid not null references vendor_accounts(id) on delete cascade,
  category text not null,
  status text not null default 'sent'
    check (status in ('sent', 'viewed', 'accepted', 'declined', 'charged')),
  intro_message text,
  fee_amount numeric(12,2) not null default 0 check (fee_amount >= 0),
  viewed_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  charged_at timestamptz,
  admin_notes text,
  unique (inquiry_id, vendor_id, category)
);

create index if not exists idx_vendor_accounts_status on vendor_accounts(approval_status, membership_status);
create index if not exists idx_vendor_accounts_categories on vendor_accounts using gin(service_categories);
create index if not exists idx_vendor_referrals_vendor_id on vendor_referrals(vendor_id, created_at desc);
create index if not exists idx_vendor_referrals_inquiry_id on vendor_referrals(inquiry_id, created_at desc);
create index if not exists idx_event_inquiries_requested_vendor_categories
  on event_inquiries using gin(requested_vendor_categories);

drop trigger if exists set_updated_at_on_vendor_accounts on vendor_accounts;
create trigger set_updated_at_on_vendor_accounts
before update on vendor_accounts
for each row execute function set_updated_at();

drop trigger if exists set_updated_at_on_vendor_referrals on vendor_referrals;
create trigger set_updated_at_on_vendor_referrals
before update on vendor_referrals
for each row execute function set_updated_at();

alter table vendor_accounts enable row level security;
alter table vendor_referrals enable row level security;

drop policy if exists "admins manage vendor_accounts" on vendor_accounts;
create policy "admins manage vendor_accounts"
on vendor_accounts
for all
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
  or auth.uid() = id
)
with check (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
  or auth.uid() = id
);

drop policy if exists "vendors view own referrals" on vendor_referrals;
create policy "vendors view own referrals"
on vendor_referrals
for select
using (
  auth.uid() = vendor_id
  or exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);

drop policy if exists "vendors update own referrals" on vendor_referrals;
create policy "vendors update own referrals"
on vendor_referrals
for update
using (
  auth.uid() = vendor_id
  or exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
)
with check (
  auth.uid() = vendor_id
  or exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);

drop policy if exists "admins insert vendor_referrals" on vendor_referrals;
create policy "admins insert vendor_referrals"
on vendor_referrals
for insert
with check (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);
