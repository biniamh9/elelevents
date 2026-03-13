alter table if exists crm_profiles
add column if not exists updated_at timestamptz not null default now();

alter table if exists clients
add column if not exists updated_at timestamptz not null default now();

alter table if exists event_inquiries
add column if not exists updated_at timestamptz not null default now();

alter table if exists contracts
add column if not exists updated_at timestamptz not null default now();

alter table if exists contract_payments
add column if not exists updated_at timestamptz not null default now();
