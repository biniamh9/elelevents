create table if not exists pricing_catalog_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  category text,
  variant text,
  unit_label text not null default 'each',
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  notes text,
  sort_order integer,
  is_active boolean not null default true
);

create table if not exists inquiry_quote_pricing (
  inquiry_id uuid primary key references event_inquiries(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  base_fee numeric(12,2) not null default 850 check (base_fee >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  labor_adjustment numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  manual_total_override numeric(12,2),
  notes text
);

create table if not exists inquiry_quote_line_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  inquiry_id uuid not null references event_inquiries(id) on delete cascade,
  pricing_catalog_item_id uuid references pricing_catalog_items(id) on delete set null,
  item_name text not null,
  category text,
  variant text,
  unit_label text not null default 'each',
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  quantity numeric(12,2) not null default 1 check (quantity >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  notes text,
  sort_order integer,
  is_custom boolean not null default false
);

create index if not exists idx_pricing_catalog_items_active
on pricing_catalog_items(is_active, category, sort_order);

create index if not exists idx_inquiry_quote_line_items_inquiry
on inquiry_quote_line_items(inquiry_id, sort_order);

drop trigger if exists set_updated_at_on_pricing_catalog_items on pricing_catalog_items;
create trigger set_updated_at_on_pricing_catalog_items
before update on pricing_catalog_items
for each row execute function set_updated_at();

drop trigger if exists set_updated_at_on_inquiry_quote_pricing on inquiry_quote_pricing;
create trigger set_updated_at_on_inquiry_quote_pricing
before update on inquiry_quote_pricing
for each row execute function set_updated_at();

drop trigger if exists set_updated_at_on_inquiry_quote_line_items on inquiry_quote_line_items;
create trigger set_updated_at_on_inquiry_quote_line_items
before update on inquiry_quote_line_items
for each row execute function set_updated_at();

insert into pricing_catalog_items (name, category, variant, unit_label, unit_price, sort_order)
values
  ('Backdrape', 'Room styling', null, 'setup', 325, 10),
  ('Ceiling drape', 'Room styling', null, 'setup', 450, 20),
  ('Head table', 'Focal points', null, 'setup', 275, 30),
  ('Bride and groom chairs', 'Focal points', null, 'pair', 160, 40),
  ('Sweetheart table setup', 'Focal points', null, 'setup', 225, 50),
  ('Centerpiece', 'Guest tables', 'Small', 'table', 38, 60),
  ('Centerpiece', 'Guest tables', 'Medium', 'table', 58, 61),
  ('Centerpiece', 'Guest tables', 'Large', 'table', 88, 62),
  ('Floral arrangement', 'Florals', 'Silk flower', 'arrangement', 95, 70),
  ('Floral arrangement', 'Florals', 'Fresh flower', 'arrangement', 185, 71),
  ('Bouquet', 'Florals', null, 'each', 95, 80),
  ('Boutonniere', 'Florals', null, 'each', 18, 81),
  ('Napkin', 'Table details', null, 'each', 3.5, 90),
  ('Plate charger', 'Table details', null, 'each', 4.5, 91),
  ('VIP table setup', 'Focal points', null, 'table', 145, 100),
  ('Traditional decor', 'Traditional', null, 'setup', 285, 110)
on conflict do nothing;
