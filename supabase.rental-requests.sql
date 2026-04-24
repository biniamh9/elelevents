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

create table if not exists rental_quote_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  event_date date,
  venue_name text,
  occasion_label text,
  guest_count integer,
  notes text,
  include_delivery boolean not null default false,
  include_setup boolean not null default false,
  include_breakdown boolean not null default false,
  rental_subtotal numeric(12,2) not null default 0 check (rental_subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  setup_fee numeric(12,2) not null default 0 check (setup_fee >= 0),
  breakdown_fee numeric(12,2) not null default 0 check (breakdown_fee >= 0),
  refundable_security_deposit numeric(12,2) not null default 0 check (refundable_security_deposit >= 0),
  estimated_total numeric(12,2) not null default 0 check (estimated_total >= 0),
  status text not null default 'requested' check (
    status in ('requested', 'reviewing', 'quoted', 'reserved', 'completed', 'cancelled')
  ),
  admin_notes text,
  quoted_at timestamptz,
  reserved_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rental_quote_request_items (
  id uuid primary key default gen_random_uuid(),
  rental_request_id uuid not null references rental_quote_requests(id) on delete cascade,
  rental_item_id uuid references rental_items(id) on delete set null,
  item_name text not null,
  item_slug text,
  quantity integer not null default 1 check (quantity >= 1),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  price_type text not null default 'per_item' check (price_type in ('per_item', 'per_set', 'flat_rate')),
  line_subtotal numeric(12,2) not null default 0 check (line_subtotal >= 0),
  security_deposit_amount numeric(12,2) not null default 0 check (security_deposit_amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_rental_quote_requests_status_created
on rental_quote_requests(status, created_at desc);

create index if not exists idx_rental_quote_requests_client_created
on rental_quote_requests(client_id, created_at desc);

create index if not exists idx_rental_quote_request_items_request
on rental_quote_request_items(rental_request_id, created_at);

drop trigger if exists set_updated_at_on_rental_quote_requests on rental_quote_requests;
create trigger set_updated_at_on_rental_quote_requests
before update on rental_quote_requests
for each row execute function set_updated_at();

alter table rental_quote_requests enable row level security;
alter table rental_quote_request_items enable row level security;

drop policy if exists "public create rental quote requests" on rental_quote_requests;
create policy "public create rental quote requests"
on rental_quote_requests
for insert
with check (true);

drop policy if exists "public create rental quote request items" on rental_quote_request_items;
create policy "public create rental quote request items"
on rental_quote_request_items
for insert
with check (true);

drop policy if exists "admins manage rental quote requests" on rental_quote_requests;
create policy "admins manage rental quote requests"
on rental_quote_requests
for all
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff', 'finance', 'contracts', 'operations', 'content')
      and p.is_active = true
  )
)
with check (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff', 'finance', 'contracts', 'operations', 'content')
      and p.is_active = true
  )
);

drop policy if exists "admins manage rental quote request items" on rental_quote_request_items;
create policy "admins manage rental quote request items"
on rental_quote_request_items
for all
using (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff', 'finance', 'contracts', 'operations', 'content')
      and p.is_active = true
  )
)
with check (
  exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff', 'finance', 'contracts', 'operations', 'content')
      and p.is_active = true
  )
);
