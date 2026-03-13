create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inquiry_status') then
    create type inquiry_status as enum (
      'new',
      'contacted',
      'quoted',
      'booked',
      'closed_lost'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'contract_status') then
    create type contract_status as enum (
      'draft',
      'sent',
      'signed',
      'deposit_paid',
      'closed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum (
      'pending',
      'paid',
      'failed',
      'refunded',
      'voided'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'activity_entity_type') then
    create type activity_entity_type as enum (
      'client',
      'inquiry',
      'contract',
      'payment'
    );
  end if;
end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists crm_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  is_active boolean not null default true
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  full_name text generated always as (trim(first_name || ' ' || last_name)) stored,
  email text not null,
  phone text,
  preferred_contact_method text,
  company_name text,
  instagram_handle text,
  city text,
  state text,
  notes text,
  source text,
  unique (email)
);

create table if not exists event_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid references clients(id) on delete set null,

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,

  event_type text not null,
  event_date date,
  guest_count integer check (guest_count is null or guest_count >= 0),

  venue_name text,
  venue_status text,
  venue_address text,
  city text,
  state text,
  indoor_outdoor text,

  services text[] not null default '{}',
  colors_theme text,
  inspiration_link text,
  inspiration_notes text,
  additional_info text,

  preferred_contact_method text,
  referral_source text,
  needs_delivery_setup boolean not null default false,

  estimated_price numeric(12,2) check (estimated_price is null or estimated_price >= 0),
  status inquiry_status not null default 'new',
  quoted_at timestamptz,
  booked_at timestamptz,
  lost_reason text,
  admin_notes text,

  assigned_to uuid references crm_profiles(id) on delete set null
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  inquiry_id uuid unique references event_inquiries(id) on delete set null,
  client_id uuid references clients(id) on delete set null,

  client_name text not null,
  client_email text,
  client_phone text,

  event_type text,
  event_date date,
  venue_name text,
  guest_count integer check (guest_count is null or guest_count >= 0),

  contract_total numeric(12,2) not null default 0 check (contract_total >= 0),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  balance_due numeric(12,2) not null default 0 check (balance_due >= 0),
  balance_due_date date,

  contract_status contract_status not null default 'draft',
  deposit_paid boolean not null default false,
  deposit_paid_at timestamptz,
  contract_sent_at timestamptz,
  signed_at timestamptz,
  closed_at timestamptz,

  docusign_url text,
  docusign_envelope_id text,
  docusign_envelope_status text,
  pdf_url text,
  scope_json jsonb not null default '{}'::jsonb,
  contract_details_json jsonb not null default '{}'::jsonb,
  notes text,

  created_by uuid references crm_profiles(id) on delete set null
);

create table if not exists contract_payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contract_id uuid not null references contracts(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  payment_kind text not null check (payment_kind in ('deposit', 'balance', 'other')),
  amount numeric(12,2) not null check (amount >= 0),
  due_date date,
  paid_at timestamptz,
  status payment_status not null default 'pending',
  payment_method text,
  transaction_reference text,
  notes text
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid references crm_profiles(id) on delete set null,
  entity_type activity_entity_type not null,
  entity_id uuid not null,
  action text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_clients_email on clients(email);
create index if not exists idx_event_inquiries_status on event_inquiries(status);
create index if not exists idx_event_inquiries_event_date on event_inquiries(event_date);
create index if not exists idx_event_inquiries_created_at on event_inquiries(created_at desc);
create index if not exists idx_event_inquiries_client_id on event_inquiries(client_id);
create index if not exists idx_contracts_status on contracts(contract_status);
create index if not exists idx_contracts_event_date on contracts(event_date);
create index if not exists idx_contracts_client_id on contracts(client_id);
create index if not exists idx_contract_payments_contract_id on contract_payments(contract_id);
create index if not exists idx_contract_payments_status on contract_payments(status);
create index if not exists idx_activity_log_entity on activity_log(entity_type, entity_id, created_at desc);

drop trigger if exists set_updated_at_on_crm_profiles on crm_profiles;
create trigger set_updated_at_on_crm_profiles
before update on crm_profiles
for each row execute function set_updated_at();

drop trigger if exists set_updated_at_on_clients on clients;
create trigger set_updated_at_on_clients
before update on clients
for each row execute function set_updated_at();

drop trigger if exists set_updated_at_on_event_inquiries on event_inquiries;
create trigger set_updated_at_on_event_inquiries
before update on event_inquiries
for each row execute function set_updated_at();

drop trigger if exists set_updated_at_on_contracts on contracts;
create trigger set_updated_at_on_contracts
before update on contracts
for each row execute function set_updated_at();

drop trigger if exists set_updated_at_on_contract_payments on contract_payments;
create trigger set_updated_at_on_contract_payments
before update on contract_payments
for each row execute function set_updated_at();

create or replace function sync_contract_balance()
returns trigger
language plpgsql
as $$
begin
  new.balance_due = greatest(new.contract_total - new.deposit_amount, 0);
  return new;
end;
$$;

drop trigger if exists sync_contract_balance_on_contracts on contracts;
create trigger sync_contract_balance_on_contracts
before insert or update of contract_total, deposit_amount on contracts
for each row execute function sync_contract_balance();

alter table crm_profiles enable row level security;
alter table clients enable row level security;
alter table event_inquiries enable row level security;
alter table contracts enable row level security;
alter table contract_payments enable row level security;
alter table activity_log enable row level security;

drop policy if exists "admins manage crm_profiles" on crm_profiles;
create policy "admins manage crm_profiles"
on crm_profiles
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

drop policy if exists "staff read clients" on clients;
create policy "staff read clients"
on clients
for select
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
);

drop policy if exists "admins manage clients" on clients;
create policy "admins manage clients"
on clients
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

drop policy if exists "staff read inquiries" on event_inquiries;
create policy "staff read inquiries"
on event_inquiries
for select
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
);

drop policy if exists "admins manage inquiries" on event_inquiries;
create policy "admins manage inquiries"
on event_inquiries
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

drop policy if exists "staff read contracts" on contracts;
create policy "staff read contracts"
on contracts
for select
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
);

drop policy if exists "admins manage contracts" on contracts;
create policy "admins manage contracts"
on contracts
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

drop policy if exists "staff read payments" on contract_payments;
create policy "staff read payments"
on contract_payments
for select
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
);

drop policy if exists "admins manage payments" on contract_payments;
create policy "admins manage payments"
on contract_payments
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

drop policy if exists "staff read activity" on activity_log;
create policy "staff read activity"
on activity_log
for select
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
);

drop policy if exists "admins manage activity" on activity_log;
create policy "admins manage activity"
on activity_log
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
