alter table contracts
add column if not exists contract_details_json jsonb not null default '{}'::jsonb;
