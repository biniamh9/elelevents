alter table contracts
add column if not exists docusign_envelope_id text;

alter table contracts
add column if not exists docusign_envelope_status text;
