-- Durable quote workflow metadata on top of client_documents.
-- This keeps quote content in client_documents while preserving revision history.

do $$
begin
  if exists (select 1 from pg_type where typname = 'activity_entity_type')
     and not exists (
       select 1
       from pg_enum
       where enumtypid = 'activity_entity_type'::regtype
         and enumlabel = 'document'
     ) then
    alter type activity_entity_type add value 'document';
  end if;
end $$;

alter table if exists public.client_documents
  add column if not exists quote_workflow_status text,
  add column if not exists quote_revision_number integer not null default 1,
  add column if not exists quote_last_sent_at timestamptz,
  add column if not exists quote_last_client_response_at timestamptz,
  add column if not exists quote_last_accepted_at timestamptz,
  add column if not exists quote_last_revision_requested_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'client_documents_quote_workflow_status_check'
  ) then
    alter table public.client_documents
      add constraint client_documents_quote_workflow_status_check
      check (
        quote_workflow_status is null
        or quote_workflow_status in (
          'draft',
          'sent',
          'accepted',
          'revision_requested',
          'expired'
        )
      );
  end if;
end $$;

update public.client_documents
set quote_workflow_status = status
where document_type = 'quote'
  and quote_workflow_status is null
  and status in ('draft', 'sent', 'accepted', 'expired');

create table if not exists public.client_document_quote_revisions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.client_documents(id) on delete cascade,
  inquiry_id uuid references public.event_inquiries(id) on delete set null,
  event_project_id uuid references public.event_projects(id) on delete set null,
  revision_number integer not null,
  workflow_status text not null check (
    workflow_status in (
      'draft',
      'sent',
      'accepted',
      'revision_requested',
      'expired'
    )
  ),
  total_amount numeric(12,2),
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists client_document_quote_revisions_document_idx
  on public.client_document_quote_revisions(document_id, created_at desc);

create index if not exists client_document_quote_revisions_project_idx
  on public.client_document_quote_revisions(event_project_id, created_at desc);

create index if not exists client_documents_quote_workflow_idx
  on public.client_documents(document_type, quote_workflow_status, created_at desc)
  where document_type = 'quote';
