# Storyhenge TODO

## Week 1: Landing Page & Auth

### Project Setup
- [x] Initialize Next.js 14 project with App Router
- [x] Setup TypeScript, Tailwind CSS
- [x] Setup Supabase project
- [x] Configure environment variables
- [x] Setup Supabase client (browser + server)

### Auth
- [x] Supabase Auth integration
- [x] Login page
- [x] Register page
- [x] Auth middleware (protect `/app/*` routes)
- [x] Logout functionality

### Landing Page
- [x] Hero section for core features
- [x] Features sections
- [x] Responsive design
- [x] Privacy policy and terms of service

---

## Week 2: Writing Editor

### Database
- [x] Create `documents` table
- [x] Create `chapters` table
- [x] Setup RLS policies
- [x] Run migrations

### Editor Core
- [x] Install & configure Tiptap
- [x] /documents/[id] page for the editor UI
- [x] Basic rich text editing (bold, italic, headings)
- [x] Word count display
- [x] Auto-save (debounced)

### Document Management
- [x] Create new document
- [x] Document list page
- [x] Open/edit existing document
- [ ] Delete document
- [x] Rename document

### Chapter Organization
- [x] Chapter sidebar
- [x] Navigate between chapters

---

## Week 3: Dashboard & Writing Stats

### Database
- [x] Create `daily_writing_stats` table
- [x] Create `upsert_daily_writing_stats` function
- [x] Setup RLS policies

### Word Count Tracking
- [x] `countWords()` utility (Chinese + English)

### Dashboard
- [x] Dashboard page layout
- [x] Recent documents list
- [x] Quick actions (new doc, continue last doc)
- [x] Today's word count summary
- [x] Current streak display

### Writing Stats
- [x] Writing heatmap (react-activity-calendar)
- [x] Cumulative word count chart (Recharts)

---

## Week 4: Agent Infrastructure

### Inngest Setup
- [ ] Install Inngest
- [ ] Configure Inngest client
- [ ] Setup `/api/inngest` webhook route
- [ ] Test local dev server

### Database
- [ ] Create `revisions` table
- [ ] Create `suggestions` table
- [ ] Setup RLS policies

### Claude API Integration
- [ ] Setup Anthropic SDK
- [ ] Create `lib/ai.ts` wrapper
- [ ] Implement `EDITOR_SYSTEM_PROMPT`
- [ ] Implement `EDITORIAL_REVIEW_TOOL` schema
- [ ] Test basic API call

### Chunking
- [ ] Implement `chunkContent()`
- [ ] Implement `mergeSuggestions()`
- [ ] Test with long documents

---

## Week 5-6: AI Editor Agent

### Agent Implementation
- [ ] `runEditorialReview()` function
- [ ] Handle tool use response parsing
- [ ] Error handling & retries
- [ ] Rate limiting consideration

### Inngest Job
- [ ] Define `editorial/review.requested` event
- [ ] Implement editorial review job
- [ ] Store results in `revisions` + `suggestions`
- [ ] Update revision status

### Editor Integration
- [ ] "Run Editorial Pass" button in editor
- [ ] Create revision record
- [ ] Trigger Inngest event
- [ ] Loading state while processing

### Realtime Updates
- [ ] Supabase Realtime subscription
- [ ] Notify user when review complete
- [ ] Navigate to review mode

---

## Week 7-8: Review Mode

### Inline Diff View
- [ ] Create `SuggestionMark` Tiptap extension
- [ ] Strikethrough styling for deletions
- [ ] Highlight styling for additions
- [ ] Render suggestions inline

### Review Summary
- [ ] Review summary component
- [ ] Display overall feedback
- [ ] Display strengths list
- [ ] Display improvements list

### Suggestion Navigation
- [ ] Suggestion list sidebar
- [ ] Click to jump to suggestion
- [ ] Filter by type
- [ ] Keyboard navigation (j/k)

### Accept/Reject Flow
- [ ] Accept suggestion → apply change
- [ ] Reject suggestion → dismiss
- [ ] Update suggestion status in DB
- [ ] Visual feedback on action

---

## Week 9: Revision History & Polish

### Revision History
- [ ] Revision history page/panel
- [ ] List all past reviews
- [ ] View revision details
- [ ] Show acceptance rate stats

### Polish
- [ ] Loading states everywhere
- [ ] Error handling & toasts
- [ ] Empty states
- [ ] Mobile responsiveness check
- [ ] Performance optimization

### Testing
- [ ] Test with real writing samples
- [ ] Test Chinese content thoroughly
- [ ] Test long documents (10k+ chars)
- [ ] Fix bugs

---

## Week 10: Deploy & Beta

### Deployment
- [ ] Setup Vercel project
- [ ] Configure production env vars
- [ ] Setup production Supabase
- [ ] Setup production Inngest
- [ ] Deploy & test

### Beta Launch
- [ ] Invite 10-20 beta users
- [ ] Setup feedback channel
- [ ] Monitor for errors
- [ ] Collect feedback

---

## Backlog (Post-MVP)

### Additional Agents
- [ ] Dialogue agent
- [ ] Continuity agent
- [ ] World-building agent
- [ ] Pacing agent

### Features
- [ ] Story bible/wiki generation
- [ ] Export (ePub, PDF, docx)
- [ ] Multi-author collaboration
- [ ] Branching/parallel versions
- [ ] Mobile app
- [ ] Offline mode

### Improvements
- [ ] Voice calibration (user preferences)
- [ ] English system prompt
- [ ] More granular diff algorithm
- [ ] Revision comparison view
