create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  category text,
  image_url text not null,
  image_path text,
  sort_order integer,
  is_active boolean not null default true
);

create index if not exists idx_gallery_items_sort_order on gallery_items(sort_order);
create index if not exists idx_gallery_items_is_active on gallery_items(is_active);

drop trigger if exists set_updated_at_on_gallery_items on gallery_items;
create trigger set_updated_at_on_gallery_items
before update on gallery_items
for each row execute function set_updated_at();

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

alter table gallery_items enable row level security;

drop policy if exists "staff read gallery items" on gallery_items;
create policy "staff read gallery items"
on gallery_items
for select
using (true);

drop policy if exists "admins manage gallery items" on gallery_items;
create policy "admins manage gallery items"
on gallery_items
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
