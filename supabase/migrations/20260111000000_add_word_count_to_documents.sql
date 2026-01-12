-- Add word_count to documents table
alter table documents
  add column word_count int not null default 0;

-- Index for aggregation queries
create index documents_user_id_word_count_idx on documents(user_id, word_count);
