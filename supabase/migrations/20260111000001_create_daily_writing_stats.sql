-- Create daily_writing_stats table
create table daily_writing_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  document_id uuid references documents(id) on delete cascade not null,
  date date not null,
  word_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, document_id, date)
);

-- Indexes for performance
create index daily_writing_stats_user_id_idx on daily_writing_stats(user_id);
create index daily_writing_stats_document_id_idx on daily_writing_stats(document_id);
create index daily_writing_stats_date_idx on daily_writing_stats(date desc);
create index daily_writing_stats_user_date_idx on daily_writing_stats(user_id, date desc);
create index daily_writing_stats_doc_date_idx on daily_writing_stats(document_id, date desc);

-- RLS policies
alter table daily_writing_stats enable row level security;

create policy "Users can CRUD own daily_writing_stats" on daily_writing_stats
  for all using (
    document_id in (select id from documents where user_id = auth.uid())
  );

-- Trigger to update updated_at
create trigger update_daily_writing_stats_updated_at
  before update on daily_writing_stats
  for each row
  execute function update_updated_at_column();

-- Database function to upsert daily writing stats
create or replace function upsert_daily_writing_stats(
  p_user_id uuid,
  p_document_id uuid,
  p_date date,
  p_word_count int
)
returns void as $$
begin
  insert into daily_writing_stats (
    user_id,
    document_id,
    date,
    word_count
  ) values (
    p_user_id,
    p_document_id,
    p_date,
    p_word_count
  )
  on conflict (user_id, document_id, date)
  do update set
    word_count = p_word_count,
    updated_at = now();
end;
$$ language plpgsql security definer;
