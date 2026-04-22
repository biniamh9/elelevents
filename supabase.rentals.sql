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

create index if not exists idx_rental_items_active_sort
on rental_items(active, featured desc, sort_order, created_at desc);

create index if not exists idx_rental_items_category
on rental_items(category);

create index if not exists idx_rental_item_images_item_sort
on rental_item_images(rental_item_id, sort_order, created_at);

drop trigger if exists set_updated_at_on_rental_items on rental_items;
create trigger set_updated_at_on_rental_items
before update on rental_items
for each row execute function set_updated_at();

insert into storage.buckets (id, name, public)
values ('rentals', 'rentals', true)
on conflict (id) do nothing;

alter table rental_items enable row level security;
alter table rental_item_images enable row level security;

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
