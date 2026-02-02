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
- **Drag & Drop:** @dnd-kit/core, @dnd-kit/sortable
- **State:** Zustand
- **Backend:** Next.js API routes, Server Actions
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **AI (Phase 2):** Anthropic Claude API, Inngest for background jobs

## Core Features

### Phase 1: GitHub for Writers (Current)

#### 1. Landing Page ✅
- Hero section with core value proposition
- Feature highlights
- Minimalist, calm design
- Traditional Chinese for MVP

#### 2. Projects & Chapters ✅
- Organize writing into projects with multiple chapters
- Chapter ordering via drag-and-drop
- Per-chapter content editing with auto-save
- Word count per chapter and project total
- Clean, distraction-free interface

#### 3. Dashboard ✅
- Project list with recently edited
- Writing stats: today's word count, current streak
- Heatmap (GitHub contribution graph style)
- Cumulative word count chart

#### 4. Writer Profile ✅
- Public profile page at `/u/[username]`
- Display name, bio, profile picture
- Writing stats showcase (total words, streak, heatmap)
- List of public projects
- Clean, minimal design

#### 5. Public/Private Projects ✅
- Two-level visibility: project and chapter
- "Publish first N chapters" for serialized works
- Public projects appear on writer's profile
- Clean reading view for public works
- Share link for public projects

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

-- Projects (books/series)
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

-- Chapters within projects
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

-- Daily writing stats (per project)
create table daily_writing_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  date date not null,
  word_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, project_id, date)
);

-- Enable RLS
alter table profiles enable row level security;
alter table projects enable row level security;
alter table chapters enable row level security;
alter table daily_writing_stats enable row level security;

-- RLS policies
create policy "Profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can CRUD own projects" on projects
  for all using (auth.uid() = user_id);

create policy "Public projects are viewable by everyone" on projects
  for select using (is_public = true);

create policy "Users can CRUD own chapters" on chapters
  for all using (
    project_id in (select id from projects where user_id = auth.uid())
  );

create policy "Public chapters are viewable by everyone" on chapters
  for select using (
    is_public = true
    and project_id in (select id from projects where is_public = true)
  );
```

## File Structure

```
storyhenge/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   └── page.tsx                  # Dashboard
│   ├── projects/
│   │   ├── page.tsx                  # Project list
│   │   └── [projectId]/
│   │       ├── page.tsx              # Project editor
│   │       ├── ProjectEditorClient.tsx
│   │       └── preview/
│   │           └── page.tsx          # Full book preview
│   ├── u/
│   │   └── [username]/
│   │       ├── page.tsx              # Public writer profile
│   │       └── projects/
│   │           └── [projectId]/
│   │               └── page.tsx      # Public project reader
│   ├── settings/
│   │   └── profile/
│   │       └── page.tsx              # Edit profile
│   ├── actions/
│   │   ├── projects.ts               # Project CRUD
│   │   ├── chapters.ts               # Chapter CRUD
│   │   ├── writing-stats.ts          # Stats tracking
│   │   └── auth.ts
│   └── layout.tsx
├── components/
│   ├── project/
│   │   ├── ProjectCard.tsx           # List item card
│   │   ├── ProjectSidebar.tsx        # Chapter navigation
│   │   ├── ChapterListItem.tsx       # Draggable chapter item
│   │   ├── ChapterEditor.tsx         # Editor wrapper
│   │   ├── ProjectPreview.tsx        # Full book preview
│   │   ├── ProjectSettingsModal.tsx  # Settings modal
│   │   └── PublicProjectReader.tsx   # Public reading view
│   ├── editor/
│   │   ├── FloatingToolbar.tsx
│   │   └── ChapterSidebar.tsx
│   ├── dashboard/
│   │   ├── TodayStats.tsx
│   │   ├── WritingHeatmap.tsx
│   │   └── CumulativeChart.tsx
│   ├── profile/
│   │   └── ProfileHeatmap.tsx
│   └── ui/
│       └── Header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── word-count.ts
│   ├── stats-transform.ts
│   ├── streak.ts
│   └── hooks/
│       └── useDebounce.ts
├── supabase/
│   └── migrations/
├── scripts/
│   └── migrate-documents-to-projects.ts
└── stores/
    └── editor.ts
```

## Current Milestones

### Phase 1: GitHub for Writers ✅

1. ~~Landing page, auth, basic setup~~ ✅
2. ~~Writing editor with auto-save~~ ✅
3. ~~Dashboard, writing stats (heatmap + chart)~~ ✅
4. ~~User profiles + public profile page~~ ✅
5. ~~Projects & Chapters structure~~ ✅
6. ~~Chapter visibility (public/private)~~ ✅
7. ~~Public project reader view~~ ✅
8. Polish, deploy, beta users

### Phase 2: AI Editorial Tools (Future)

1. Inngest setup for background jobs
2. Claude API integration
3. AI Editor agent implementation
4. Inline diff view with Tiptap marks
5. Review flow UI (accept/reject)
6. Revision history

## Out of Scope (Future)

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

# Data Migration (documents -> projects)
npm run migrate:projects
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
