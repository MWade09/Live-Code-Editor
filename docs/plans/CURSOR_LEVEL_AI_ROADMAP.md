# AI Chat Roadmap: Cursor-Level Quality

> **Goal:** Transform the Live Code Editor's AI Chat into a world-class coding assistant capable of building full applications with complete project context understanding.

**Created:** November 25, 2025  
**Status:** Phase 2 Complete ✅ | Phase 3 Next  
**Target:** Developer-focused editor experience (Website App Builder will follow with more autonomous approach)

---

## Executive Summary

The current Unified AI system provides a solid foundation with file editing, project context, and inline suggestions. To reach Cursor-level quality, we need to implement:

1. **Intelligent Context Management** - Hybrid embeddings for semantic codebase understanding
2. **Streaming Responses** - Real-time token display for better UX
3. **Human-in-Loop Agent** - Autonomous analysis with approval checkpoints for actions
4. **Smart Diff Application** - Granular line-level patches instead of full file replacement
5. **Terminal Feedback Loop** - Iterative debugging with error capture and AI suggestions
6. **Model Cascade System** - Fast models for routing, powerful models for generation
7. **Composer Mode** - Coordinated multi-file editing with batch operations

---

## Current State Assessment

### What We Have ✅

| Feature | Implementation | Location |
|---------|---------------|----------|
| Unified AI Mode | Chat + Agent combined | `UnifiedAIManager.js` |
| Multi-file Context | Manual selection, 100KB limit | `ProjectContextManager.js` |
| File Editing | Preview + approve workflow | `ActionExecutor.js` |
| File Creation | With overwrite warnings | `AIFileCreationManager.js` |
| Inline Suggestions | Ghost text completions | `InlineAIManager.js` |
| Code Actions | Right-click explain/refactor/test | `AICodeActionsManager.js` |
| Project Structure | Framework detection, dependency mapping | `ProjectContextManager.js` |
| Response Parsing | FILE_EDIT, CREATE_FILE, TERMINAL markers | `ResponseParser.js` |
| Model Selection | 3 free models + custom API key | `model-manager.js` |

### What's Missing ❌

| Feature | Gap | Impact |
|---------|-----|--------|
| Codebase Indexing | Manual file selection required | Poor context for large projects |
| Streaming | Wait for full response | Slow perceived UX |
| Autonomous Agent Loop | No plan→execute→observe cycle | Can't iterate on errors |
| Smart Diffs | Full file replacement only | Risky, loses user edits |
| Terminal Feedback | No output capture to AI | Can't debug iteratively |
| Cross-session Memory | Session-only history | No project continuity |

---

## Architecture Decisions

### 1. Embedding Storage: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    Hybrid Embeddings                        │
├─────────────────────────────────────────────────────────────┤
│  IndexedDB (Local)          │  Supabase pgvector (Cloud)   │
│  ─────────────────          │  ────────────────────────    │
│  • Fast read/write          │  • Persistent storage        │
│  • Per-project database     │  • Cross-device sync         │
│  • Keyed by project ID      │  • Collaboration ready       │
│  • First-access priority    │  • Backup/recovery           │
└─────────────────────────────────────────────────────────────┘

Project Switching Logic:
1. User opens Project B while Project A is loaded
2. Save Project A embeddings to IndexedDB (if dirty)
3. Clear in-memory embedding cache
4. Load Project B from IndexedDB (fast) or Supabase (fallback)
5. Background sync to Supabase if needed
```

**Decision:** Background worker generation (best UX)
- Generate embeddings in Web Worker on project open
- Non-blocking - user can start working immediately
- Progressive enhancement - basic context first, semantic search as ready

### 2. Agent Autonomy: Human-in-Loop

```
┌─────────────────────────────────────────────────────────────┐
│                 Human-in-Loop Agent Model                   │
├─────────────────────────────────────────────────────────────┤
│  AUTONOMOUS (No Approval)    │  CHECKPOINT (Needs Approval) │
│  ────────────────────────    │  ─────────────────────────── │
│  • Read file contents        │  • Write/modify files        │
│  • Analyze code structure    │  • Create new files          │
│  • Search codebase           │  • Execute terminal commands │
│  • Generate plans            │  • Install dependencies      │
│  • Explain code              │  • Multi-file batch changes  │
│  • Suggest improvements      │  • Delete files              │
└─────────────────────────────────────────────────────────────┘
```

**Decision:** Per-phase approval with batch preview
- AI generates complete plan with all proposed changes
- User reviews changes in Composer UI
- Approve/reject individual changes or entire batch
- Autonomous retry on errors (with approval for fixes)

### 3. Model Cascade: Tiered Selection

```
┌─────────────────────────────────────────────────────────────┐
│                   Model Cascade System                      │
├─────────────────────────────────────────────────────────────┤
│  TIER 1: Fast Router        │  TIER 2: Code Generation     │
│  ───────────────────        │  ─────────────────────────   │
│  • DeepSeek Chat            │  • Claude 3.5 Sonnet         │
│  • Gemini Flash             │  • GPT-4o                    │
│  • Intent detection         │  • Claude 3 Opus (complex)   │
│  • Context routing          │  • DeepSeek Coder (fallback) │
│  • Simple Q&A               │  • Full code generation      │
├─────────────────────────────────────────────────────────────┤
│  FREE TIER                  │  PREMIUM TIER                │
│  ──────────                 │  ────────────                │
│  • DeepSeek (routing+code)  │  • All models available      │
│  • Limited requests/day     │  • Priority routing          │
│  • Basic context (50KB)     │  • Full context (500KB+)     │
│  • No Composer mode         │  • Composer mode enabled     │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3) ✅ IMPLEMENTED
**Goal:** Streaming responses and improved UX

**Status:** Complete (November 25, 2025)

#### 1.1 Streaming Response Support ✅
- [x] Modify `/api/ai/free` and `/api/ai/premium` for Server-Sent Events
- [x] Update `UnifiedAIManager.js` with EventSource handling
- [x] Real-time `ResponseParser.js` marker detection during stream
- [x] Progressive UI updates in chat panel
- [x] Handle stream interruption gracefully (AbortController)

**Implementation Notes:**
- Added `stream: true` parameter to API routes
- Created `callAIStreaming()` method with real-time token display
- Streaming cursor animation (`▊`) shows response progress
- Stream can be cancelled via `cancelStream()` method
- Fallback to non-streaming mode available via `useStreaming` flag

**Files modified:**
- `website/src/app/api/ai/free/route.ts` - Added SSE streaming support
- `website/src/app/api/ai/premium/route.ts` - Added SSE streaming support
- `website/public/editor/js/modules/UnifiedAIManager.js` - New streaming methods
- `website/public/editor/js/modules/ResponseParser.js` - Partial marker detection
- `website/public/editor/css/chat-panel-clean.css` - Streaming cursor styles

#### 1.2 Smart Diff/Patch Application ✅
- [x] Create DiffManager.js with LCS-based diff algorithm
- [x] Modify `ActionExecutor.js` for line-level patches
- [x] Add inline diff visualization in action cards
- [x] Implement conflict detection for concurrent edits
- [x] Add undo support for AI changes

**Implementation Notes:**
- `DiffManager.js` implements LCS diff algorithm with HTML visualization
- Conflict detection compares original cached content vs current
- Three-way merge support for resolving concurrent edits
- Undo button appears on success messages (10s timeout)
- Change history tracked (max 50 changes) for rollback

**New files:**
- `website/public/editor/js/modules/DiffManager.js`

**Files modified:**
- `website/public/editor/js/modules/ActionExecutor.js`
- `website/public/editor/js/app.js` - Wired up DiffManager

---

### Phase 2: Intelligence (Weeks 4-6) ✅ COMPLETE
**Goal:** Semantic codebase understanding

#### 2.1 Embeddings Infrastructure ✅
- [x] Create `EmbeddingsManager.js` with Web Worker
- [x] Set up IndexedDB schema for local embedding storage
- [x] Add Supabase `project_embeddings` table with pgvector
- [x] Implement project-keyed storage/retrieval
- [x] Build project-switching logic (clean swap)

**Implementation Notes:**
- `EmbeddingsManager.js` provides hybrid embeddings (IndexedDB + Supabase)
- Web Worker runs in inline blob for chunking, hashing, similarity computation
- IndexedDB stores embeddings locally per-project for fast access
- Supabase pgvector provides cloud persistence and cross-device sync
- Project switching saves dirty embeddings, clears cache, loads new project

**New files:**
- `website/public/editor/js/modules/EmbeddingsManager.js`
- `website/src/app/api/embeddings/route.ts` - Embedding generation API
- `website/src/app/api/embeddings/sync/route.ts` - Cloud sync API
- `website/src/app/api/embeddings/search/route.ts` - Semantic search API
- `website/database-migrations/005_project_embeddings.sql`

**Database migration:**
```sql
-- Implemented in 005_project_embeddings.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE project_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  content_hash TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, file_path, chunk_index)
);

CREATE INDEX ON project_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Plus: RLS policies, search functions, trigger for updated_at
```

#### 2.2 Semantic Search Integration ✅
- [x] Implement similarity search in `EmbeddingsManager.js`
- [x] Add automatic context retrieval based on query
- [x] Replace manual file selection with smart suggestions
- [x] Build relevance scoring for context prioritization
- [x] Add "Show retrieved context" transparency toggle

**Implementation Notes:**
- `searchRelevantFiles()` computes cosine similarity against query embedding
- `getSuggestedContext()` returns top-K relevant files with size limits
- `buildContextWithSemanticSearch()` in UnifiedAIManager auto-adds files
- Auto-context indicator shows which files were semantically retrieved
- Toggle button allows user to enable/disable auto-context
- System prompt distinguishes manually-selected vs auto-included files

**Files modified:**
- `website/public/editor/js/modules/UnifiedAIManager.js` - Auto-context integration
- `website/public/editor/js/app.js` - EmbeddingsManager initialization
- `website/public/editor/css/chat-panel-clean.css` - Auto-context UI styles

---

### Phase 3: Agent Loop (Weeks 7-9)
**Goal:** Autonomous analysis with human checkpoints

#### 3.1 Agent Orchestrator
- [ ] Create `AgentOrchestrator.js` with state machine
- [ ] Implement plan→execute→observe→iterate loop
- [ ] Define tool interfaces (read, write, search, terminal)
- [ ] Add checkpoint system for approval gates
- [ ] Build action queue with dependency ordering

**New files:**
- `website/public/editor/js/modules/AgentOrchestrator.js`
- `website/public/editor/js/modules/AgentTools.js`

**Agent State Machine:**
```
IDLE → PLANNING → AWAITING_APPROVAL → EXECUTING → OBSERVING → COMPLETE
                       ↓                              ↓
                   CANCELLED                    PLANNING (on error)
```

#### 3.2 Terminal Feedback Integration
- [ ] Enhance `TerminalManager.js` with output capture
- [ ] Create stdout/stderr buffer for AI context
- [ ] Implement error pattern detection
- [ ] Add "AI Fix" button on terminal errors
- [ ] Build iterative retry loop with approval

**Files to modify:**
- `website/public/editor/js/modules/TerminalManager.js`
- `website/public/editor/js/modules/AgentOrchestrator.js`

---

### Phase 4: Composer (Weeks 10-12)
**Goal:** Coordinated multi-file operations

#### 4.1 Composer UI
- [ ] Design Composer panel layout (sidebar or modal)
- [ ] Build file change tree visualization
- [ ] Add per-file and batch approve/reject controls
- [ ] Implement change dependency visualization
- [ ] Create rollback mechanism

**New files:**
- `website/public/editor/js/modules/ComposerManager.js`
- `website/public/editor/css/composer.css`
- `website/public/editor/components/ComposerPanel.js`

#### 4.2 Multi-File Coordination
- [ ] Implement change ordering based on dependencies
- [ ] Add atomic batch application (all-or-nothing option)
- [ ] Build progress tracking for batch operations
- [ ] Create change preview diff for each file
- [ ] Add "Generate more" for incomplete plans

**Files to modify:**
- `website/public/editor/js/modules/ActionExecutor.js`
- `website/public/editor/js/modules/MultiFileEditManager.js`

---

### Phase 5: Model Intelligence (Weeks 13-14)
**Goal:** Smart model routing and optimization

#### 5.1 Model Cascade Implementation
- [ ] Create `ModelRouter.js` for intelligent routing
- [ ] Implement intent classification (fast model)
- [ ] Add complexity scoring for model selection
- [ ] Build fallback chains for API failures
- [ ] Track model performance metrics

**New files:**
- `website/public/editor/js/modules/ModelRouter.js`

#### 5.2 Context Optimization
- [ ] Implement smart context compression
- [ ] Add token counting and budget management
- [ ] Build context relevance pruning
- [ ] Create "context too large" handling with suggestions
- [ ] Optimize prompt templates per model

**Files to modify:**
- `website/public/editor/js/modules/UnifiedAIManager.js`
- `website/public/editor/js/modules/ProjectContextManager.js`

---

### Phase 6: Polish & Memory (Weeks 15-16)
**Goal:** Cross-session continuity and UX refinement

#### 6.1 Project Memory
- [ ] Implement conversation summarization
- [ ] Store project-specific AI memory in Supabase
- [ ] Add "Remember this" explicit memory creation
- [ ] Build memory retrieval for relevant context
- [ ] Create memory management UI

**New files:**
- `website/public/editor/js/modules/ProjectMemoryManager.js`

**Database migration:**
```sql
CREATE TABLE project_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL, -- 'conversation', 'explicit', 'learned'
  content TEXT NOT NULL,
  embedding vector(1536),
  importance FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6.2 UX Polish
- [ ] Add keyboard shortcuts for common AI actions
- [ ] Implement "Escape to cancel" for all operations
- [ ] Build loading states and progress indicators
- [ ] Add success/error toast notifications
- [ ] Create onboarding tooltips for new features

---

## Success Metrics

### Performance Targets
| Metric | Current | Target |
|--------|---------|--------|
| Time to first token | ~3-5s | <1s |
| Context retrieval accuracy | N/A (manual) | >85% relevant |
| Successful code application | ~70% | >95% |
| Multi-file edit success | ~50% | >90% |
| Error recovery rate | 0% (manual) | >70% auto-suggest |

### User Experience Targets
| Metric | Current | Target |
|--------|---------|--------|
| Steps to apply edit | 3 clicks | 1 click + Enter |
| Context setup time | ~30s manual | <5s automatic |
| Project switch time | N/A | <2s |
| Undo after AI edit | Not possible | 1 click |

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Embedding generation slow | Web Worker + progressive loading |
| IndexedDB storage limits | Implement cleanup + cloud backup |
| Stream interruption | Graceful degradation to full response |
| Diff conflicts | Show conflict UI, let user resolve |
| Model API failures | Fallback chain + retry logic |

### User Experience Risks
| Risk | Mitigation |
|------|------------|
| AI changes break code | Preview + undo + atomic rollback |
| Context retrieval wrong files | Show retrieved context, allow override |
| Too many approval dialogs | Batch approvals + trust levels |
| Confusing Composer UI | Progressive disclosure + onboarding |

---

## Future: Website App Builder

After completing this editor roadmap, the Website App Builder will extend these capabilities with:

- **Full Autonomous Mode** - Execute entire plans without approval
- **Natural Language Interface** - No code shown by default
- **Template Starting Points** - Pre-built app scaffolds
- **Deployment Integration** - One-click deploy to Netlify/Vercel
- **Visual Preview** - Live preview alongside chat
- **Simpler Model Selection** - Auto-select best model per task

This autonomous approach is designed for non-developers building apps through conversation, contrasting with the developer-focused human-in-loop model in the editor.

---

## Appendix: File Structure After Implementation

```
website/public/editor/js/
├── modules/
│   ├── UnifiedAIManager.js      # Updated with streaming
│   ├── ResponseParser.js        # Updated with stream parsing
│   ├── ActionExecutor.js        # Updated with diff patches
│   ├── AgentOrchestrator.js     # NEW: Agent loop controller
│   ├── AgentTools.js            # NEW: Tool definitions
│   ├── EmbeddingsManager.js     # NEW: Hybrid embeddings
│   ├── DiffManager.js           # NEW: Diff/patch handling
│   ├── ModelRouter.js           # NEW: Smart model selection
│   ├── ComposerManager.js       # NEW: Multi-file coordination
│   ├── ProjectMemoryManager.js  # NEW: Cross-session memory
│   ├── ProjectContextManager.js # Updated with semantic search
│   ├── TerminalManager.js       # Updated with output capture
│   └── ...existing modules
├── workers/
│   └── embeddings-worker.js     # NEW: Background embedding gen
└── components/
    └── ComposerPanel.js         # NEW: Composer UI

website/src/app/api/
├── ai/
│   ├── free/route.ts            # Updated with SSE streaming
│   ├── premium/route.ts         # Updated with SSE streaming
│   └── usage/route.ts
├── embeddings/
│   └── route.ts                 # NEW: Embedding generation API
└── memory/
    └── route.ts                 # NEW: Project memory API
```

---

*This roadmap is a living document. Update as implementation progresses.*
