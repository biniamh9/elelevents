alter table if exists inquiry_quote_pricing
add column if not exists draft_status text not null default 'internal_draft';

alter table if exists inquiry_quote_pricing
add column if not exists client_disclaimer text;

alter table if exists inquiry_quote_pricing
add column if not exists generated_at timestamptz;

alter table if exists inquiry_quote_pricing
add column if not exists ready_to_send_at timestamptz;

alter table if exists inquiry_quote_pricing
add column if not exists shared_with_customer_at timestamptz;
