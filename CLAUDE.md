# Storyhenge

**GitHub for Writers** — A platform where writers build their portfolio, track their writing journey, and share works with readers.

## Vision

Writers need a home for their work — a place to write, track progress, and share with readers. Like GitHub transformed how developers showcase their code, Storyhenge gives writers a platform to:
- Build a public writing portfolio
- Track writing habits and streaks
- Share selected works with beta readers and the community
- Own their creative journey with full revision history

**Phase 2 (Future):** AI-powered editorial tools that act as an editorial team, not autocomplete — helping writers revise asynchronously while staying in creative flow.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), React, TypeScript
- **Editor:** Tiptap (ProseMirror-based)
- **Styling:** Tailwind CSS
- **Charts:** Recharts (line charts), react-activity-calendar (heatmap)
- **State:** Zustand
- **Backend:** Next.js API routes
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **AI (Phase 2):** Anthropic Claude API, Inngest for background jobs

## Core Features

### Phase 1: GitHub for Writers (Current Focus)

#### 1. Landing Page ✅
- Hero section with core value proposition
- Feature highlights
- Minimalist, calm design
- Traditional Chinese for MVP

#### 2. Writing Editor ✅
- Rich text editing (bold, italic, headings)
- Auto-save
- Word count
- Clean, distraction-free interface

#### 3. Dashboard ✅
- Document list with recently edited
- Writing stats: today's word count, current streak
- Heatmap (GitHub contribution graph style)
- Cumulative word count chart

#### 4. Writer Profile (Next Up)
- Public profile page at `/u/[username]`
- Display name, bio, profile picture
- Writing stats showcase (total words, streak, heatmap)
- List of public works
- Clean, minimal design

#### 5. Public/Private Documents
- Each document can be set as public or private
- Public documents appear on writer's profile
- Clean reading view for public documents
- Share link for public works

#### 6. Projects & Chapters (Future in Phase 1)
- Organize documents into projects (books/series)
- Chapter ordering within projects
- Per-chapter visibility settings
- Project-level metadata (genre, description, cover)

### Phase 2: AI Editorial Tools (Future)

#### AI Editor Agent
Like a real editor reviewing your manuscript:
- **Summary:** Overall impression, strengths, areas for improvement
- **Line-by-line suggestions:** Prose improvements at word/sentence level
- Preserves author voice, only suggests — never overwrites

#### Inline Diff View
- Strikethrough for deletions, highlight for additions
- Example: `她覺得這件事情~~非常地~~很重要`

#### Review Flow
- Accept/Reject suggestions one by one
- Navigation between suggestions
- Revision history as proof of authorship

## Data Models (Supabase)

```sql
-- Users handled by Supabase Auth

-- User profiles (public info)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents (current structure, with visibility)
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content jsonb not null, -- ProseMirror doc format
  user_id uuid references auth.users(id) on delete cascade,
  is_public boolean default false,
  published_at timestamptz, -- when first made public
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Daily writing stats
create table daily_writing_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  words_added int not null default 0,
  words_deleted int not null default 0,
  net_words int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- Phase 1.5: Projects & Chapters (future migration)
-- create table projects (
--   id uuid primary key default gen_random_uuid(),
--   title text not null,
--   description text,
--   user_id uuid references auth.users(id) on delete cascade,
--   is_public boolean default false,
--   created_at timestamptz default now(),
--   updated_at timestamptz default now()
-- );

-- Phase 2: AI Editorial (future)
-- create table revisions (...);
-- create table suggestions (...);

-- Enable RLS
alter table profiles enable row level security;
alter table documents enable row level security;
alter table daily_writing_stats enable row level security;

-- RLS policies
create policy "Profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can CRUD own documents" on documents
  for all using (auth.uid() = user_id);

create policy "Public documents are viewable by everyone" on documents
  for select using (is_public = true);

create policy "Users can CRUD own daily_writing_stats" on daily_writing_stats
  for all using (auth.uid() = user_id);
```

## File Structure

```
storyhenge/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx                # Landing page
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Dashboard
│   │   ├── documents/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # Editor view
│   │   │   └── page.tsx            # Document list
│   │   ├── settings/
│   │   │   └── profile/
│   │   │       └── page.tsx        # Edit profile
│   │   └── layout.tsx
│   ├── u/
│   │   └── [username]/
│   │       ├── page.tsx            # Public writer profile
│   │       └── [documentId]/
│   │           └── page.tsx        # Public document reader
│   ├── api/
│   │   └── ...
│   └── layout.tsx
├── components/
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── CTA.tsx
│   ├── dashboard/
│   │   ├── RecentDocuments.tsx
│   │   ├── WritingSummary.tsx
│   │   └── QuickActions.tsx
│   ├── editor/
│   │   ├── Editor.tsx
│   │   └── Toolbar.tsx
│   ├── profile/
│   │   ├── ProfileHeader.tsx       # Avatar, name, bio, stats
│   │   ├── PublicWorksList.tsx     # List of public documents
│   │   ├── WritingHeatmap.tsx      # Public heatmap
│   │   └── EditProfileForm.tsx
│   ├── reader/
│   │   └── DocumentReader.tsx      # Clean reading view
│   ├── stats/
│   │   ├── WritingHeatmap.tsx
│   │   ├── WordCountChart.tsx
│   │   └── MilestoneCard.tsx
│   └── ui/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── word-count.ts
├── supabase/
│   └── migrations/
└── stores/
    └── editor.ts
```

## Current Milestones

### Phase 1: GitHub for Writers

1. ~~Landing page, auth, basic setup~~ ✅
2. ~~Writing editor with auto-save~~ ✅
3. ~~Dashboard, writing stats (heatmap + chart)~~ ✅
4. **User profiles table + username setup** ← Next
5. **Public profile page (`/u/[username]`)**
6. **Document visibility (public/private toggle)**
7. **Public document reader view**
8. Polish, deploy, beta users

### Phase 2: AI Editorial Tools (Future)

1. Inngest setup for background jobs
2. Claude API integration
3. AI Editor agent implementation
4. Inline diff view with Tiptap marks
5. Review flow UI (accept/reject)
6. Revision history

## Out of Scope (Future)

- Projects & chapters organization (Phase 1.5)
- Comments/feedback from readers
- Multi-author collaboration
- Mobile app
- Export (ePub, PDF)
- Additional AI agents (dialogue, continuity)

## Commands

```bash
# Development
npm run dev

# Supabase
npx supabase start          # Local dev
npx supabase db push        # Push migrations
npx supabase gen types typescript --local > lib/supabase/types.ts
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
# Phase 2
ANTHROPIC_API_KEY="sk-ant-..."
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```
