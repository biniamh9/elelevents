create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists customer_interactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid references clients(id) on delete set null,
  inquiry_id uuid references event_inquiries(id) on delete set null,
  contract_id uuid references contracts(id) on delete set null,
  channel text not null default 'email' check (channel in ('email', 'phone', 'note', 'meeting', 'other')),
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound', 'internal')),
  subject text,
  body_text text not null,
  body_html text,
  sender_email text,
  recipient_email text,
  thread_id text,
  message_id text,
  provider text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_customer_interactions_inquiry_id
on customer_interactions(inquiry_id, created_at desc);

create index if not exists idx_customer_interactions_client_id
on customer_interactions(client_id, created_at desc);

create index if not exists idx_customer_interactions_sender_email
on customer_interactions(sender_email);

drop trigger if exists set_updated_at_on_customer_interactions on customer_interactions;
create trigger set_updated_at_on_customer_interactions
before update on customer_interactions
for each row execute function set_updated_at();

alter table customer_interactions enable row level security;

drop policy if exists "staff read customer interactions" on customer_interactions;
create policy "staff read customer interactions"
on customer_interactions
for select
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
);

drop policy if exists "admins manage customer interactions" on customer_interactions;
create policy "admins manage customer interactions"
on customer_interactions
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
