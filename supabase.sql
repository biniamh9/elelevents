create extension if not exists pgcrypto;

create table if not exists event_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,

  event_type text not null,
  event_date date,
  guest_count integer,

  venue_name text,
  venue_status text,
  venue_address text,
  city text,
  state text,
  indoor_outdoor text,

  services text[] default '{}',
  colors_theme text,
  inspiration_link text,
  inspiration_notes text,
  additional_info text,

  preferred_contact_method text,
  referral_source text,
  needs_delivery_setup boolean default false,

  estimated_price numeric(12,2),
  status text not null default 'new',
  admin_notes text
);
