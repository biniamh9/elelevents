create table if not exists admin_notification_reads (
  admin_id uuid not null references crm_profiles(id) on delete cascade,
  activity_id uuid not null references activity_log(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (admin_id, activity_id)
);

create index if not exists idx_admin_notification_reads_admin_id
on admin_notification_reads(admin_id, read_at desc);

alter table admin_notification_reads enable row level security;

drop policy if exists "admins manage own notification reads" on admin_notification_reads;
create policy "admins manage own notification reads"
on admin_notification_reads
for all
using (
  auth.uid() = admin_id
  and exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
)
with check (
  auth.uid() = admin_id
  and exists (
    select 1
    from crm_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);
