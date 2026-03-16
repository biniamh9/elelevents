create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewer_name text not null,
  source_label text default 'Google review',
  rating integer not null default 5 check (rating between 1 and 5),
  quote text not null,
  highlight text,
  event_type text,
  is_featured boolean not null default false,
  sort_order integer,
  is_active boolean not null default true
);

create index if not exists idx_testimonials_sort_order on testimonials(sort_order);
create index if not exists idx_testimonials_is_active on testimonials(is_active);
create index if not exists idx_testimonials_is_featured on testimonials(is_featured);

drop trigger if exists set_updated_at_on_testimonials on testimonials;
create trigger set_updated_at_on_testimonials
before update on testimonials
for each row execute function set_updated_at();

alter table testimonials enable row level security;

drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials"
on testimonials
for select
using (true);

drop policy if exists "admins manage testimonials" on testimonials;
create policy "admins manage testimonials"
on testimonials
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

insert into testimonials (
  reviewer_name,
  source_label,
  rating,
  quote,
  highlight,
  event_type,
  is_featured,
  sort_order,
  is_active
)
select
  'Aster Gebremeskel',
  'Google review',
  5,
  'I had the pleasure of having my wedding beautifully decorated and coordinated by Yordnos and her company, ELEL DESIGN & EVENT. From start to finish, Yordnos was dedicated to bringing our vision to life. Even though we didn''t have a strong idea of what we wanted our wedding to look like, she took the time to understand our style and preferences. Her creativity, attention to detail, and commitment to making our day perfect were truly impressive. Our wedding guests couldn''t stop talking about how beautifully everything was designed. Yordnos also did a wonderful job coordinating our wedding day. She was incredibly precise with the Eritrean customs and traditions that were important to us, while also sticking to hard timelines to keep everything running smoothly. The result was a stunning celebration that exceeded all of our expectations.',
  'Yordnos brought our wedding vision to life with incredible creativity, detail, and care. Our guests could not stop talking about how beautiful everything looked.',
  'Wedding',
  true,
  1,
  true
where not exists (
  select 1 from testimonials where reviewer_name = 'Aster Gebremeskel'
);

insert into testimonials (
  reviewer_name,
  source_label,
  rating,
  quote,
  highlight,
  event_type,
  is_featured,
  sort_order,
  is_active
)
select
  'Hanna T.',
  'Google review',
  5,
  'Elel Events and Design truly made my wedding day unforgettable. When I walked into the venue on January 17, 2026, I was overwhelmed with emotion. After spending three stressful months planning the wedding, the moment I saw the decorations, all the stress disappeared. I actually found myself crying - but this time from happiness. Yordi captured my dream perfectly. Every detail of the venue was beautifully designed and thoughtfully arranged. The atmosphere she created was elegant, warm, and exactly what I had imagined for my special day. Her creativity, professionalism, and attention to detail were truly outstanding. She transformed the venue into something magical, and I will forever be grateful for the incredible work she did.',
  'When I walked into the venue, I cried from happiness. Yordi captured my dream perfectly and transformed the space into something elegant, warm, and unforgettable.',
  'Wedding',
  true,
  2,
  true
where not exists (
  select 1 from testimonials where reviewer_name = 'Hanna T.'
);
