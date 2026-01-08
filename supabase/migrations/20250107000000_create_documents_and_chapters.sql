-- Create documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content jsonb not null default '{}'::jsonb, -- ProseMirror doc format
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create chapters table
create table chapters (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  title text not null,
  "order" int not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table documents enable row level security;
alter table chapters enable row level security;

-- RLS policies (user can only access their own data)
create policy "Users can CRUD own documents" on documents
  for all using (auth.uid() = user_id);

create policy "Users can CRUD own chapters" on chapters
  for all using (
    document_id in (select id from documents where user_id = auth.uid())
  );

-- Add index for better query performance
create index documents_user_id_idx on documents(user_id);
create index documents_updated_at_idx on documents(updated_at desc);
create index chapters_document_id_idx on chapters(document_id);
create index chapters_order_idx on chapters("order");

-- Add trigger to update updated_at on documents
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_documents_updated_at
  before update on documents
  for each row
  execute function update_updated_at_column();
