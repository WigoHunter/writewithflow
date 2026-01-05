# Storyhenge

AI-powered writing platform that treats AI as an editorial team, not an autocomplete tool.

## Vision

Writers hate revision -- not because it's not valuable, but because the opportunity cost is too high. Storyhenge lets AI handle editorial passes asynchronously while writers stay in creative flow. Every suggestion requires explicit human approval.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), React, TypeScript
- **Editor:** Tiptap (ProseMirror-based, extensible for custom diff marks)
- **Styling:** Tailwind CSS
- **Charts:** Recharts（折線圖）、react-activity-calendar（heatmap）
- **State:** Zustand
- **Backend:** Next.js API routes (start simple, extract if needed)
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Job Queue:** Inngest (serverless, works well with Next.js)
- **AI:** Anthropic Claude API

## Core Features (MVP)

### 1. Landing Page
- Hero section: the core value proposition (AI editor partner, let you focus on writing) and CTA for sign up / login
- Feature highlights
- Privacy policy and terms of service (P1)
- Minimalist, calm and clean design
- Traditional Chinese for the MVP

### 2. Writing Editor
- Rich text editing (bold, italic, headings)
- Auto-save with version snapshots
- Chapter/section organization
- Word count
- Traditional Chinese for the MVP

### 3. Dashboard
- Document List: Recently edited documents, create new document
- Writing Stats
  - Today's word count, current streak 
  - Heatmap (similar to GitHub contribution graph)
  - Cumulative word count line chart
- Quick access to the last edited document

### 4. AI Editor Agent
Like a real editor reviewing your manuscript. Produces an "Editorial Review" (similar to a PR) with:

**Summary Section:**
- Overall impression of the writing
- Key strengths to preserve
- Main areas for improvement
- Structural/pacing observations

**Line-by-Line Suggestions:**
- Prose improvements: sentence structure, word choice, flow, clarity
- Does NOT change plot, character decisions, or author voice
- Granular suggestions (word/phrase/sentence level)
- Each suggestion includes reasoning

### 5. Inline Diff View
- Strikethrough for deletions (gray)
- Highlight for additions (light blue)
- Inline, not side-by-side—preserves reading flow
- Example: `她覺得這件事情~~非常地~~很重要`

### 6. Review Flow
- One-by-one: Accept / Reject
- Navigation: next/prev suggestion, filter by type

### 7. Revision History
- Timeline of all editorial passes
- Records: suggestions made, user decisions, document states
- Serves as proof of authorship
- Ask back-and-forth questions to the AI editor agent

## Data Models (Supabase)

```sql
-- Users handled by Supabase Auth

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content jsonb not null, -- ProseMirror doc format
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table chapters (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  title text not null,
  "order" int not null
);

create table revisions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content_snapshot jsonb not null, -- 審閱當下的文件快照
  summary text,                    -- Editor's overall feedback
  strengths text[],                -- Key strengths identified
  improvements text[],             -- Main areas for improvement  
  status text default 'pending',   -- pending, processing, completed, failed
  created_at timestamptz default now()
);

create table suggestions (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid references revisions(id) on delete cascade,
  type text not null,        -- word_choice, sentence_structure, clarity, flow, grammar, redundancy
  original text not null,
  suggested text not null,
  reasoning text not null,
  location jsonb not null,   -- { start: number, end: number }
  status text default 'pending' -- pending, accepted, rejected
);

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

-- Enable RLS
alter table documents enable row level security;
alter table chapters enable row level security;
alter table revisions enable row level security;
alter table suggestions enable row level security;
alter table daily_writing_stats enable row level security;

-- RLS policies (user can only access their own data)
create policy "Users can CRUD own documents" on documents
  for all using (auth.uid() = user_id);

create policy "Users can CRUD own chapters" on chapters
  for all using (
    document_id in (select id from documents where user_id = auth.uid())
  );

create policy "Users can CRUD own revisions" on revisions
  for all using (
    document_id in (select id from documents where user_id = auth.uid())
  );

create policy "Users can CRUD own suggestions" on suggestions
  for all using (
    revision_id in (
      select r.id from revisions r
      join documents d on r.document_id = d.id
      where d.user_id = auth.uid()
    )
  );

create policy "Users can CRUD own daily_writing_stats" on daily_writing_stats
  for all using (auth.uid() = user_id);
```

## Agent Interface

```typescript
interface EditorialAgent {
  id: string;
  name: string;
  scope: 'document' | 'chapter' | 'selection';
  run(content: string, context: AgentContext): Promise<EditorialReview>;
}

// The full editorial review (like a PR)
interface EditorialReview {
  summary: string;           // Overall impression and feedback
  strengths: string[];       // Key strengths to preserve
  improvements: string[];    // Main areas for improvement
  suggestions: Suggestion[]; // Line-by-line changes
}

interface Suggestion {
  type: SuggestionType;
  original: string;
  suggested: string;
  reasoning: string;
  location: { start: number; end: number };
  confidence: number;
}

type SuggestionType = 
  | 'word_choice' 
  | 'sentence_structure' 
  | 'clarity' 
  | 'flow' 
  | 'grammar' 
  | 'redundancy';

interface AgentContext {
  language: 'zh-TW' | 'en';
  documentTitle?: string;
  chapterTitle?: string;
  previousContent?: string; // for context
}
```

## AI Editor Implementation

### System Prompt（繁體中文）

```typescript
// lib/agents/editor.ts

export const EDITOR_SYSTEM_PROMPT = `你是一位資深的文字編輯，正在審閱一份書稿。你的任務是提供專業、有建設性的編輯回饋，同時尊重作者獨特的聲音與風格。

## 你的角色

你像一位真正的編輯夥伴，而非自動校正工具。你理解：
- 每位作者都有自己的聲音，你的工作是讓這個聲音更清晰，而非取代它
- 好的編輯是隱形的——讀者不會注意到編輯的痕跡，只會感受到流暢的閱讀體驗
- 有些「不完美」是刻意的風格選擇，你應該尊重這些選擇

## 審閱產出

你的審閱報告應包含：

### 1. 整體回饋（summary）
用 2-3 段文字描述你對這份稿件的整體印象，包括：
- 文字的整體質感與風格
- 敘事節奏與結構觀察
- 最值得肯定的地方
- 最需要關注的改進方向

### 2. 亮點（strengths）
列出 2-4 個這份稿件的亮點，這些是作者應該保留並繼續發揮的特質。

### 3. 改進方向（improvements）
列出 2-4 個主要的改進方向，這些是整體性的觀察，而非逐行修改。

### 4. 逐行建議（suggestions）
針對具體文字提出修改建議。每個建議必須包含：
- type：建議類型（word_choice/sentence_structure/clarity/flow/grammar/redundancy）
- original：原文
- suggested：建議修改後的文字
- reasoning：為什麼這樣改會更好（用一句話解釋）
- location：原文在文件中的位置（start, end）

## 建議類型說明

- word_choice（用詞選擇）：更精準、更生動、或更適合語境的詞彙
- sentence_structure（句子結構）：句子的組織方式，讓意思更清楚或節奏更好
- clarity（清晰度）：讓意思更明確，減少歧義
- flow（流暢度）：讓句子之間的銜接更自然
- grammar（文法）：修正文法錯誤
- redundancy（冗餘）：刪除不必要的重複或贅字

## 重要原則

1. **不改變內容**：不修改劇情、角色設定、或作者的創意決定
2. **細緻而非大改**：每個建議應該是字詞或句子層級，不是整段重寫
3. **解釋理由**：每個建議都要說明為什麼，讓作者能學習並做出判斷
4. **尊重風格**：如果某個用法看起來是刻意的風格選擇，不要建議修改
5. **品質優先**：寧可提出 10 個高品質的建議，也不要 50 個瑣碎的建議

## 繁體中文注意事項

- 使用繁體中文書寫習慣（「」而非""，不使用簡體字）
- 注意中文特有的節奏感，避免過度歐化的句式
- 尊重台灣用語習慣
- 注意「的、地、得」的正確使用
- 注意贅字（如不必要的「了」「的」「很」）`;
```

### Structured Output（Tool Use）

```typescript
// lib/agents/editor.ts

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const EDITORIAL_REVIEW_TOOL = {
  name: "submit_editorial_review",
  description: "提交完成的編輯審閱報告",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description: "整體回饋，2-3 段文字"
      },
      strengths: {
        type: "array",
        items: { type: "string" },
        description: "2-4 個亮點"
      },
      improvements: {
        type: "array",
        items: { type: "string" },
        description: "2-4 個改進方向"
      },
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["word_choice", "sentence_structure", "clarity", "flow", "grammar", "redundancy"]
            },
            original: { type: "string" },
            suggested: { type: "string" },
            reasoning: { type: "string" },
            location: {
              type: "object",
              properties: {
                start: { type: "number" },
                end: { type: "number" }
              },
              required: ["start", "end"]
            }
          },
          required: ["type", "original", "suggested", "reasoning", "location"]
        }
      }
    },
    required: ["summary", "strengths", "improvements", "suggestions"]
  }
};

export async function runEditorialReview(
  content: string,
  context: AgentContext
): Promise<EditorialReview> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8096,
    system: EDITOR_SYSTEM_PROMPT,
    tools: [EDITORIAL_REVIEW_TOOL],
    tool_choice: { type: "tool", name: "submit_editorial_review" },
    messages: [
      {
        role: "user",
        content: `請審閱以下稿件：

${context.chapterTitle ? `## 章節：${context.chapterTitle}\n\n` : ""}${content}`
      }
    ]
  });

  // Extract tool use result
  const toolUse = response.content.find(
    (block) => block.type === "tool_use"
  );
  
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("No editorial review returned");
  }

  return toolUse.input as EditorialReview;
}
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
│   │   │   └── page.tsx            # Dashboard (logged-in home)
│   │   ├── documents/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx        # Editor view
│   │   │   │   └── review/
│   │   │   │       └── page.tsx    # Review mode (PR-style)
│   │   │   └── page.tsx            # Document list
│   │   ├── stats/
│   │   │   └── page.tsx            # Writing stats dashboard
│   │   └── layout.tsx
│   ├── api/
│   │   ├── inngest/
│   │   │   └── route.ts            # Inngest webhook handler
│   │   └── ...
│   └── layout.tsx
├── components/
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── CTA.tsx
│   ├── dashboard/
│   │   ├── RecentDocuments.tsx
│   │   ├── WritingSummary.tsx      # 今日字數、streak
│   │   └── QuickActions.tsx
│   ├── editor/
│   │   ├── Editor.tsx
│   │   ├── DiffMark.tsx            # Custom Tiptap extension
│   │   └── Toolbar.tsx
│   ├── review/
│   │   ├── ReviewMode.tsx
│   │   ├── ReviewSummary.tsx       # Editor's overall feedback
│   │   ├── SuggestionCard.tsx
│   │   └── SuggestionList.tsx
│   ├── stats/
│   │   ├── WritingHeatmap.tsx      # GitHub-style contribution graph
│   │   ├── WordCountChart.tsx      # Cumulative word count line chart
│   │   └── MilestoneCard.tsx       # 里程碑卡片
│   └── ui/                         # Shared UI components
├── lib/
│   ├── agents/
│   │   ├── base.ts                 # Agent interface
│   │   └── editor.ts               # Editor agent implementation
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── middleware.ts           # Auth middleware
│   ├── inngest/
│   │   ├── client.ts               # Inngest client
│   │   └── functions.ts            # Background job definitions
│   ├── diff.ts                     # Diff computation utilities
│   ├── word-count.ts               # Word count tracking utilities
│   └── ai.ts                       # Claude API wrapper
├── supabase/
│   └── migrations/                 # SQL migrations
└── stores/
    ├── editor.ts
    └── review.ts
```

## Key Implementation Notes

### Diff Computation
- Use word-level diffing, not line-level
- Libraries to consider: `diff`, `fast-diff`, or custom implementation
- Map diff results to ProseMirror positions for inline marks

### Tiptap Custom Extension
Create a custom mark for showing suggestions:
```typescript
const SuggestionMark = Mark.create({
  name: 'suggestion',
  addAttributes() {
    return {
      suggestionId: { default: null },
      type: { default: 'replace' }, // 'replace' | 'delete' | 'insert'
      original: { default: '' },
      suggested: { default: '' },
    }
  },
  // ... rendering logic for strikethrough/highlight
})
```

### AI Prompt Strategy
- Process document in chunks (~2000 chars) with overlap for context
- System prompt should emphasize:
  - Preserve author voice
  - Granular suggestions only
  - Always provide reasoning
  - Language-aware (Traditional Chinese nuances)

### Background Job Flow (Inngest)
1. User clicks "Run Editorial Pass"
2. Create Revision record (status: pending)
3. Send event to Inngest: `editorial/review.requested`
4. Inngest function processes content, calls Claude API
5. Store editorial review (summary + suggestions), update status to completed
6. Supabase Realtime notifies frontend of completion

## MVP Milestones

1. **Week 1:** Landing page, auth (Supabase), basic project setup
2. **Week 2:** Writing editor with auto-save, chapter org
3. **Week 3:** Dashboard, writing stats (heatmap + chart)
4. **Week 4:** Agent infra, Inngest, Claude integration
5. **Week 5-6:** AI Editor agent, suggestion generation
6. **Week 7-8:** Review mode UI, inline diff, accept/reject
7. **Week 9:** Revision history, polish
8. **Week 10:** Deploy, beta users

## Out of Scope (Future)

- Additional agents (dialogue, continuity, world-building)
- Story bible/wiki generation
- Multi-author collaboration
- Mobile app
- Offline mode
- Export (ePub, PDF)
- Branching/parallel versions

## Commands

```bash
# Development
npm run dev

# Supabase
npx supabase start          # Local dev
npx supabase db push        # Push migrations
npx supabase gen types typescript --local > lib/supabase/types.ts

# Inngest
npx inngest-cli dev         # Local Inngest dev server
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
ANTHROPIC_API_KEY="sk-ant-..."
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```
