create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists client_documents (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references event_inquiries(id) on delete set null,
  contract_id uuid references contracts(id) on delete set null,
  document_type text not null check (document_type in ('quote', 'invoice', 'receipt')),
  document_number text not null unique,
  status text not null,
  issue_date date,
  due_date date,
  expiration_date date,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  event_type text,
  event_date date,
  guest_count integer check (guest_count is null or guest_count >= 0),
  venue_name text,
  venue_address text,
  notes text,
  inclusions text,
  exclusions text,
  payment_instructions text,
  payment_terms text,
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  setup_fee numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  deposit_required numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  related_quote_id uuid references client_documents(id) on delete set null,
  related_invoice_id uuid references client_documents(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists client_document_line_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references client_documents(id) on delete cascade,
  title text not null,
  description text,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists client_document_payments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references client_documents(id) on delete cascade,
  payment_date date not null,
  amount numeric(12,2) not null default 0,
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists client_documents_type_status_idx
  on client_documents(document_type, status, created_at desc);

create index if not exists client_documents_inquiry_idx
  on client_documents(inquiry_id);

create index if not exists client_documents_contract_idx
  on client_documents(contract_id);

create index if not exists client_document_line_items_document_idx
  on client_document_line_items(document_id, display_order);

create index if not exists client_document_payments_document_idx
  on client_document_payments(document_id, payment_date desc);

drop trigger if exists set_client_documents_updated_at on client_documents;
create trigger set_client_documents_updated_at
before update on client_documents
for each row
execute function update_updated_at_column();
