create table if not exists public.site_social_links (
  singleton_key text primary key default 'default' check (singleton_key = 'default'),
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  updated_at timestamptz not null default now()
);

insert into public.site_social_links (singleton_key)
values ('default')
on conflict (singleton_key) do nothing;

create or replace function public.set_site_social_links_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_social_links_set_updated_at on public.site_social_links;

create trigger site_social_links_set_updated_at
before update on public.site_social_links
for each row
execute function public.set_site_social_links_updated_at();
