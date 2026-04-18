create index if not exists idx_customer_interactions_thread_id
on customer_interactions(thread_id);

create index if not exists idx_customer_interactions_message_id
on customer_interactions(message_id);
