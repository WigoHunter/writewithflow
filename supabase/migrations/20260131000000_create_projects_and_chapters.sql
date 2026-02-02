-- Create projects table
create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  user_id uuid references auth.users(id) on delete cascade not null,
  is_public boolean not null default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for projects
create index projects_user_id_idx on projects(user_id);
create index projects_updated_at_idx on projects(updated_at desc);
create index projects_is_public_idx on projects(is_public) where is_public = true;

-- Enable RLS on projects
alter table projects enable row level security;

-- RLS policies for projects
create policy "Users can CRUD own projects" on projects
  for all using (auth.uid() = user_id);

create policy "Public projects are viewable by everyone" on projects
  for select using (is_public = true);

-- Trigger to update updated_at on projects
create trigger update_projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at_column();

-- Create chapters table
create table chapters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  word_count int not null default 0,
  "order" int not null,
  is_public boolean not null default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for chapters
create index chapters_project_id_idx on chapters(project_id);
create index chapters_order_idx on chapters(project_id, "order");
create index chapters_is_public_idx on chapters(is_public) where is_public = true;

-- Enable RLS on chapters
alter table chapters enable row level security;

-- RLS policies for chapters
create policy "Users can CRUD own chapters" on chapters
  for all using (
    project_id in (select id from projects where user_id = auth.uid())
  );

create policy "Public chapters are viewable by everyone" on chapters
  for select using (
    is_public = true
    and project_id in (select id from projects where is_public = true)
  );

-- Trigger to update updated_at on chapters
create trigger update_chapters_updated_at
  before update on chapters
  for each row
  execute function update_updated_at_column();

-- Add project_id to daily_writing_stats
alter table daily_writing_stats
  add column project_id uuid references projects(id) on delete cascade;

-- Index for project stats
create index daily_writing_stats_project_id_idx on daily_writing_stats(project_id);

-- Update RLS for daily_writing_stats to support project stats
create policy "Users can CRUD own project stats" on daily_writing_stats
  for all using (
    project_id is not null and
    project_id in (select id from projects where user_id = auth.uid())
  );

-- Helper function: Calculate project total word count
create or replace function get_project_word_count(p_project_id uuid)
returns int as $$
  select coalesce(sum(word_count), 0)::int
  from chapters
  where project_id = p_project_id;
$$ language sql stable;

-- Note: upsert_project_writing_stats will be created after data migration
-- when the unique constraint is added
