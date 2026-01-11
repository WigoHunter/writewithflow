-- Drop chapters table and related objects
-- We're using heading-based chapter organization instead

drop policy if exists "Users can CRUD own chapters" on chapters;
drop index if exists chapters_order_idx;
drop index if exists chapters_document_id_idx;
drop table if exists chapters;
