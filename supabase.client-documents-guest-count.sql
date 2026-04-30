alter table client_documents
  add column if not exists guest_count integer
  check (guest_count is null or guest_count >= 0);

update client_documents as documents
set guest_count = coalesce(
  (
    select contracts.guest_count
    from contracts
    where contracts.id = documents.contract_id
  ),
  (
    select inquiries.guest_count
    from event_inquiries as inquiries
    where inquiries.id = documents.inquiry_id
  )
)
where documents.contract_id is not null
  and documents.guest_count is null;

update client_documents as documents
set guest_count = (
  select inquiries.guest_count
  from event_inquiries as inquiries
  where inquiries.id = documents.inquiry_id
)
where documents.contract_id is null
  and documents.inquiry_id is not null
  and documents.guest_count is null;
