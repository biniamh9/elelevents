alter table public.crm_profiles
  drop constraint if exists crm_profiles_role_check;

alter table public.crm_profiles
  add constraint crm_profiles_role_check
  check (role in ('admin', 'staff', 'finance', 'contracts', 'content', 'operations'));

alter table public.crm_profiles
  add column if not exists allowed_modules text[] not null default '{}'::text[];
