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

create table if not exists rental_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text,
  short_description text,
  full_description text,
  featured_image_url text,
  featured_image_path text,
  base_rental_price numeric(12,2) not null default 0 check (base_rental_price >= 0),
  price_type text not null default 'per_item' check (price_type in ('per_item', 'per_set', 'flat_rate')),
  available_quantity integer not null default 0 check (available_quantity >= 0),
  minimum_order_quantity integer not null default 1 check (minimum_order_quantity >= 1),
  delivery_available boolean not null default true,
  setup_available boolean not null default true,
  breakdown_available boolean not null default true,
  default_delivery_fee numeric(12,2) not null default 0 check (default_delivery_fee >= 0),
  default_setup_fee numeric(12,2) not null default 0 check (default_setup_fee >= 0),
  default_breakdown_fee numeric(12,2) not null default 0 check (default_breakdown_fee >= 0),
  deposit_required boolean not null default false,
  deposit_type text not null default 'flat' check (deposit_type in ('flat', 'per_item', 'percent')),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  replacement_cost numeric(12,2) not null default 0 check (replacement_cost >= 0),
  deposit_terms text,
  damage_notes text,
  featured boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rental_item_images (
  id uuid primary key default gen_random_uuid(),
  rental_item_id uuid not null references rental_items(id) on delete cascade,
  image_url text not null,
  image_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table rental_items add column if not exists deposit_required boolean not null default false;
alter table rental_items add column if not exists deposit_type text not null default 'flat';
alter table rental_items add column if not exists deposit_amount numeric(12,2) not null default 0;
alter table rental_items add column if not exists replacement_cost numeric(12,2) not null default 0;
alter table rental_items add column if not exists deposit_terms text;
alter table rental_items add column if not exists damage_notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rental_items_deposit_type_check'
  ) then
    alter table rental_items
      add constraint rental_items_deposit_type_check
      check (deposit_type in ('flat', 'per_item', 'percent'));
  end if;
end $$;

create table if not exists rental_deposit_records (
  id uuid primary key default gen_random_uuid(),
  rental_item_id uuid not null references rental_items(id) on delete cascade,
  reference_label text,
  deposit_collected_amount numeric(12,2) not null default 0 check (deposit_collected_amount >= 0),
  deposit_status text not null default 'pending' check (
    deposit_status in ('not_required', 'pending', 'collected', 'partially_refunded', 'refunded', 'forfeited')
  ),
  inspection_status text not null default 'pending' check (
    inspection_status in ('pending', 'returned', 'inspected')
  ),
  damage_deduction_amount numeric(12,2) not null default 0 check (damage_deduction_amount >= 0),
  refund_amount numeric(12,2) not null default 0 check (refund_amount >= 0),
  refund_status text not null default 'not_started' check (
    refund_status in ('not_started', 'pending', 'processed')
  ),
  refund_date timestamptz,
  damage_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rental_items_active_sort
on rental_items(active, featured desc, sort_order, created_at desc);

create index if not exists idx_rental_items_category
on rental_items(category);

create index if not exists idx_rental_item_images_item_sort
on rental_item_images(rental_item_id, sort_order, created_at);

create index if not exists idx_rental_deposit_records_item_created
on rental_deposit_records(rental_item_id, created_at desc);

drop trigger if exists set_updated_at_on_rental_items on rental_items;
create trigger set_updated_at_on_rental_items
before update on rental_items
for each row execute function set_updated_at();

drop trigger if exists set_updated_at_on_rental_deposit_records on rental_deposit_records;
create trigger set_updated_at_on_rental_deposit_records
before update on rental_deposit_records
for each row execute function set_updated_at();

insert into storage.buckets (id, name, public)
values ('rentals', 'rentals', true)
on conflict (id) do nothing;

alter table rental_items enable row level security;
alter table rental_item_images enable row level security;
alter table rental_deposit_records enable row level security;

drop policy if exists "public read active rental items" on rental_items;
create policy "public read active rental items"
on rental_items
for select
using (active = true);

drop policy if exists "public read rental images" on rental_item_images;
create policy "public read rental images"
on rental_item_images
for select
using (
  exists (
    select 1
    from rental_items items
    where items.id = rental_item_images.rental_item_id
      and items.active = true
  )
);

drop policy if exists "admins manage rental items" on rental_items;
create policy "admins manage rental items"
on rental_items
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

drop policy if exists "admins manage rental images" on rental_item_images;
create policy "admins manage rental images"
on rental_item_images
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

drop policy if exists "admins manage rental deposit records" on rental_deposit_records;
create policy "admins manage rental deposit records"
on rental_deposit_records
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
