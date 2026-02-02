-- This migration should be run AFTER the TypeScript data migration script
-- It finalizes the migration by:
-- 1. Dropping document-related columns and constraints
-- 2. Adding the unique constraint for project stats
-- 3. Creating the upsert function for project stats
-- 4. Dropping the documents table

-- First, verify that all documents have been migrated
do $$
declare
  doc_count int;
  unmigrated_stats int;
begin
  -- Check if documents table still has data
  select count(*) into doc_count from documents;

  -- Check for stats without project_id
  select count(*) into unmigrated_stats
  from daily_writing_stats
  where project_id is null and document_id is not null;

  if unmigrated_stats > 0 then
    raise exception 'Migration incomplete: % stats records have document_id but no project_id', unmigrated_stats;
  end if;

  raise notice 'Pre-migration check passed. % documents will be dropped.', doc_count;
end $$;

-- Drop the old document-related RLS policy
drop policy if exists "Users can CRUD own daily_writing_stats" on daily_writing_stats;

-- Drop old unique constraint (if exists)
alter table daily_writing_stats
  drop constraint if exists daily_writing_stats_user_id_document_id_date_key;

-- Drop old indexes on document_id
drop index if exists daily_writing_stats_document_id_idx;
drop index if exists daily_writing_stats_doc_date_idx;

-- Drop the document_id column
alter table daily_writing_stats
  drop column if exists document_id;

-- Make project_id not null
alter table daily_writing_stats
  alter column project_id set not null;

-- Add the new unique constraint for project stats
alter table daily_writing_stats
  add constraint daily_writing_stats_user_project_date_key
  unique(user_id, project_id, date);

-- Create the upsert function for project writing stats
create or replace function upsert_project_writing_stats(
  p_user_id uuid,
  p_project_id uuid,
  p_date date,
  p_word_count int
)
returns void as $$
begin
  insert into daily_writing_stats (
    user_id,
    project_id,
    date,
    word_count
  ) values (
    p_user_id,
    p_project_id,
    p_date,
    p_word_count
  )
  on conflict (user_id, project_id, date)
  do update set
    word_count = p_word_count,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- Drop the old document-based upsert function
drop function if exists upsert_daily_writing_stats(uuid, uuid, date, int);

-- Drop document-related RLS policies
drop policy if exists "Users can CRUD own documents" on documents;
drop policy if exists "Public documents are viewable by everyone" on documents;

-- Drop indexes on documents
drop index if exists documents_user_id_idx;
drop index if exists documents_updated_at_idx;
drop index if exists documents_is_public_idx;
drop index if exists documents_user_id_word_count_idx;
drop index if exists documents_user_id_is_public_idx;

-- Drop the trigger on documents
drop trigger if exists update_documents_updated_at on documents;

-- Finally, drop the documents table
drop table if exists documents;

-- Add index for project stats lookup by date
create index if not exists daily_writing_stats_project_date_idx
  on daily_writing_stats(project_id, date desc);
