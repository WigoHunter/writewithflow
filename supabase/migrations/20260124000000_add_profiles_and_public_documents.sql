-- Create profiles table for public writer information
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add visibility fields to documents
alter table documents
  add column is_public boolean not null default false,
  add column published_at timestamptz;

-- Enable RLS on profiles
alter table profiles enable row level security;

-- RLS policies for profiles
-- Everyone can view profiles
create policy "Profiles are viewable by everyone" on profiles
  for select using (true);

-- Users can insert their own profile
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Update documents RLS: add policy for public documents
create policy "Public documents are viewable by everyone" on documents
  for select using (is_public = true);

-- Indexes
create index profiles_username_idx on profiles(username);
create index documents_is_public_idx on documents(is_public) where is_public = true;
create index documents_user_id_is_public_idx on documents(user_id, is_public);

-- Trigger to update updated_at on profiles
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- Function to validate username format (alphanumeric, underscores, 3-30 chars)
create or replace function validate_username()
returns trigger as $$
begin
  if new.username !~ '^[a-zA-Z0-9_]{3,30}$' then
    raise exception 'Username must be 3-30 characters and contain only letters, numbers, and underscores';
  end if;
  -- Convert to lowercase for consistency
  new.username = lower(new.username);
  return new;
end;
$$ language plpgsql;

create trigger validate_username_trigger
  before insert or update on profiles
  for each row
  execute function validate_username();
