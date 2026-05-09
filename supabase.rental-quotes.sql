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

alter table rental_quote_requests
  add column if not exists event_address text,
  add column if not exists event_zip text,
  add column if not exists distance_miles numeric(8,2),
  add column if not exists delivery_custom_quote_required boolean not null default false;

alter table rental_quote_requests
  alter column email drop not null,
  alter column phone drop not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'rental_quote_requests_status_check'
  ) then
    alter table rental_quote_requests
      drop constraint rental_quote_requests_status_check;
  end if;
end $$;

alter table rental_quote_requests
  add constraint rental_quote_requests_status_check
  check (status in ('requested', 'reviewing', 'quoted', 'accepted', 'paid', 'reserved', 'completed', 'cancelled'));

create table if not exists rental_quotes (
  id uuid primary key default gen_random_uuid(),
  rental_request_id uuid not null references rental_quote_requests(id) on delete cascade,
  chair_quantity integer not null default 0 check (chair_quantity >= 0),
  chair_unit_price numeric(12,2) not null default 0 check (chair_unit_price >= 0),
  chair_subtotal numeric(12,2) not null default 0 check (chair_subtotal >= 0),
  distance_miles numeric(8,2),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  delivery_custom_quote_required boolean not null default false,
  setup_fee numeric(12,2) not null default 0 check (setup_fee >= 0),
  breakdown_fee numeric(12,2) not null default 0 check (breakdown_fee >= 0),
  refundable_deposit numeric(12,2) not null default 0 check (refundable_deposit >= 0),
  total_quote numeric(12,2) not null default 0 check (total_quote >= 0),
  quote_notes text,
  status text not null default 'draft' check (
    status in ('draft', 'sent', 'accepted', 'paid', 'completed', 'cancelled')
  ),
  sent_at timestamptz,
  accepted_at timestamptz,
  paid_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rental_request_id)
);

create index if not exists idx_rental_quotes_request
on rental_quotes(rental_request_id);

create index if not exists idx_rental_quotes_status_created
on rental_quotes(status, created_at desc);

drop trigger if exists set_updated_at_on_rental_quotes on rental_quotes;
create trigger set_updated_at_on_rental_quotes
before update on rental_quotes
for each row execute function set_updated_at();

alter table rental_quotes enable row level security;

drop policy if exists "admins manage rental quotes" on rental_quotes;
create policy "admins manage rental quotes"
on rental_quotes
for all
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff', 'finance', 'contracts', 'operations')
      and p.is_active = true
  )
)
with check (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff', 'finance', 'contracts', 'operations')
      and p.is_active = true
  )
);
