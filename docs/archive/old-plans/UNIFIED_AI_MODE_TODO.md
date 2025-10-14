# 🎯 UNIFIED AI MODE TODO

**Created**: October 10, 2025  
**Status**: Planning Phase  
**Priority**: HIGH - Major Architectural Improvement

---

## 🎯 Vision

Remove the Chat/Agent mode split and create ONE unified AI assistant that can:
- ✅ Have natural conversations  
- ✅ Edit files directly  
- ✅ Create new files  
- ✅ Plan projects  
- ✅ Execute terminal commands  
- ✅ All seamlessly without mode switching

**Inspiration**: Cursor, Claude Code, GitHub Copilot - they all use a single AI mode.

**Documentation**: 
- `docs/UNIFIED_AI_MODE_PLAN.md` - Full architectural plan
- `docs/UNIFIED_AI_IMPLEMENTATION_ROADMAP.md` - Step-by-step implementation

---

## Phase 1: Core Unification ⚡

### Task 1.1: Create UnifiedAIManager.js
- [ ] **Status**: Not Started
- [ ] **Priority**: CRITICAL
- [ ] **Estimate**: 4-6 hours
- [ ] **File**: `js/modules/UnifiedAIManager.js` (new)

**What It Does**:
- Single entry point for all AI interactions
- Merges Chat mode (conversational) + Agent mode (file editing)
- Intelligent response routing
- Context builder (files, project, conversation)

**Key Methods**:
```javascript
handleMessage(userMessage)     // Main entry point
buildContext()                  // Build full AI context
callAI(message, context)       // Unified API call
buildSystemPrompt(context)     // Dynamic system prompt
```

---

### Task 1.2: Create ResponseParser.js
- [ ] **Status**: Not Started
- [ ] **Priority**: CRITICAL
- [ ] **Estimate**: 2-3 hours
- [ ] **File**: `js/modules/ResponseParser.js` (new)

**What It Does**:
- Parses AI responses for different action types
- Extracts FILE_EDIT, CREATE_FILE, TERMINAL, PLAN markers
- Separates conversational text from actions

**Key Methods**:
```javascript
parse(aiResponse)               // Main parser
extractFileEdits(response)      // Find edit actions
extractFileCreations(response)  // Find create actions
extractTerminalCommands()       // Find terminal commands
cleanConversation(text)         // Remove markers
```

---

### Task 1.3: Create ActionExecutor.js
- [ ] **Status**: Not Started
- [ ] **Priority**: CRITICAL
- [ ] **Estimate**: 3-4 hours
- [ ] **File**: `js/modules/ActionExecutor.js` (new)

**What It Does**:
- Executes parsed actions with user approval
- Shows beautiful action preview cards
- Handles edits, creates, terminal commands, plans

**Key Methods**:
```javascript
executeActions(actions)         // Execute action array
executeEdit(action)             // Handle file edit
executeCreate(action)           // Create new file
executeTerminal(action)         // Run terminal command
showActionCard(config)          // Display preview UI
```

---

### Task 1.4: Remove Mode Toggle from UI
- [ ] **Status**: Not Started
- [ ] **Priority**: HIGH
- [ ] **Estimate**: 1-2 hours
- [ ] **Files**: `index.html`, `chat-panel-clean.css`, `chat-panel.js`

**Changes**:

**Remove**:
- Mode toggle buttons (Chat/Agent)
- Mode-specific descriptions
- Mode switching event listeners

**Add**:
- Commands help button (🔘)
- Command help panel
- Updated input placeholder

**Before**:
```html
<div class="mode-toggle">
    <button id="chat-mode-btn">💬</button>
    <button id="agent-mode-btn">🤖</button>
</div>
```

**After**:
```html
<div class="ai-header">
    <h3>AI Assistant</h3>
    <button id="commands-help-btn">
        <i class="fas fa-terminal"></i>
    </button>
</div>
```

---

### Task 1.5: Update chat-panel.js
- [ ] **Status**: Not Started
- [ ] **Priority**: HIGH
- [ ] **Estimate**: 2 hours
- [ ] **File**: `js/chat-panel.js`

**Changes**:
- Remove `window.currentMode` variable
- Remove mode switching event listeners
- Simplify `sendMessage()` to use UnifiedAIManager
- Remove mode-specific message handling

**Before**:
```javascript
if (window.currentMode === 'agent') {
    // Agent logic
} else {
    // Chat logic
}
```

**After**:
```javascript
await window.unifiedAI.handleMessage(message);
```

---

### Task 1.6: Update app.js Integration
- [ ] **Status**: Not Started
- [ ] **Priority**: HIGH
- [ ] **Estimate**: 1 hour
- [ ] **File**: `js/app.js`

**Changes**:
```javascript
import { UnifiedAIManager } from './modules/UnifiedAIManager.js';
import { ResponseParser } from './modules/ResponseParser.js';
import { ActionExecutor } from './modules/ActionExecutor.js';

// Initialize
window.unifiedAI = new UnifiedAIManager(
    editor,
    fileManager,
    projectContextManager
);
```

---

## Phase 2: Command System 🚀

### Task 2.1: Create CommandParser.js
- [ ] **Status**: Not Started
- [ ] **Priority**: MEDIUM
- [ ] **Estimate**: 3 hours
- [ ] **File**: `js/modules/CommandParser.js` (new)

**Commands to Implement**:
- `/plan` - Create project implementation plan
- `/create [filename]` - Create new file
- `/edit [filename]` - Focus on editing file
- `/terminal [command]` - Execute terminal command
- `/refactor` - Suggest code improvements
- `/debug` - Help debug issues
- `/test` - Generate tests
- `/search [query]` - Search codebase

---

### Task 2.2: Implement Command Handlers
- [ ] **Status**: Not Started
- [ ] **Priority**: MEDIUM
- [ ] **Estimate**: 2-3 hours
- [ ] **File**: `js/modules/UnifiedAIManager.js`

**Methods to Add**:
```javascript
handleCommand(message)          // Route commands
parseCommand(message)           // Extract command + args
buildCommandContext(cmd)        // Command-specific context
```

---

### Task 2.3: Add Command Autocomplete
- [ ] **Status**: Not Started
- [ ] **Priority**: LOW
- [ ] **Estimate**: 2 hours
- [ ] **Files**: `js/chat-panel.js`, `css/chat-panel-clean.css`

**Features**:
- Show hints when "/" is typed
- Filter commands as user types
- Click or Tab to complete
- Keyboard navigation (↑↓)

---

## Phase 3: Polish & Testing ✨

### Task 3.1: Add Action Card Styling
- [ ] **Status**: Not Started
- [ ] **Priority**: MEDIUM
- [ ] **Estimate**: 2 hours
- [ ] **File**: `css/chat-panel-clean.css`

**Features**:
- Different colors per action type
- Code preview with syntax highlighting
- Apply/Cancel buttons
- Smooth animations

---

### Task 3.2: Comprehensive Testing
- [ ] **Status**: Not Started
- [ ] **Priority**: HIGH
- [ ] **Estimate**: 4-6 hours

**Test Cases**:
- [ ] Basic conversation
- [ ] File edit requests
- [ ] File creation
- [ ] Terminal commands
- [ ] Project planning
- [ ] Multi-action responses
- [ ] Error handling
- [ ] Model switching
- [ ] Persistence across reloads

---

### Task 3.3: Update Documentation
- [ ] **Status**: Not Started
- [ ] **Priority**: MEDIUM
- [ ] **Estimate**: 3 hours

**Files to Create/Update**:
- [ ] `docs/AI_COMMANDS_REFERENCE.md` (new)
- [ ] `docs/AI_ASSISTANT_GUIDE.md` (new)
- [ ] `README.md` (update features)
- [ ] `docs/changelog.md` (document change)

---

## ✅ Completed Features to Preserve

These features work and should be integrated:

- [x] **Multi-File Context System** - File attachment UI, context building
- [x] **Project-Wide Context Awareness** - ProjectContextManager, toggle
- [x] **Multi-File Edit Suggestions** - MultiFileEditManager, diff viewer
- [x] **Syntax-Highlighted Code Blocks** - Prism.js (partial)
- [x] **AI File Creation** - Agent Mode capability (merge into unified)

---

## Timeline 📅

### Week 1: Core Unification
**Goal**: Single AI mode working

- [x] Create UnifiedAIManager
- [x] Create ResponseParser
- [x] Create ActionExecutor
- [x] Remove mode toggle
- [x] Basic conversation + editing working

### Week 2: Command System
**Goal**: Special commands functional

- [ ] Command parser
- [ ] Basic commands (/plan, /create, /terminal)
- [ ] Command autocomplete
- [ ] Terminal integration

### Week 3: Polish
**Goal**: Production-ready

- [ ] UI refinement
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Bug fixes
- [ ] User feedback

**Total: ~3 weeks to production**

---

## Success Criteria ✅

### Must Have (Minimum Viable Product)
- [ ] Single AI mode (no toggle)
- [ ] Natural conversations work
- [ ] Can edit files directly
- [ ] Can create new files
- [ ] Action preview cards
- [ ] User can approve/reject actions

### Should Have (Enhanced Experience)
- [ ] Special commands (/plan, /create, etc.)
- [ ] Command autocomplete
- [ ] Terminal integration
- [ ] Multi-action support
- [ ] Error recovery

### Nice to Have (Future Enhancements)
- [ ] AI-suggested commands
- [ ] Keyboard shortcuts
- [ ] Custom user commands
- [ ] Action history/undo
- [ ] Voice input
- [ ] AI learns user preferences

---

## Migration Plan 🔄

### Backward Compatibility
- Old chat histories will be migrated
- Existing file context system preserved
- Project context system preserved
- All completed features kept

### Breaking Changes
- Mode toggle removed from UI
- Separate chat/agent histories merged
- API calls unified to `/api/ai/unified`

### User Communication
- [ ] Changelog entry
- [ ] User guide update
- [ ] "What's New" modal on first load
- [ ] Migration notice for existing users

---

## Next Steps 🚀

**START HERE**: 

1. Read `docs/UNIFIED_AI_MODE_PLAN.md` for full context
2. Read `docs/UNIFIED_AI_IMPLEMENTATION_ROADMAP.md` for detailed code examples
3. Begin Task 1.1: Create `UnifiedAIManager.js`

**Development Approach**:
- Build incrementally
- Test after each task
- Get user feedback early
- Iterate based on feedback

---

## Questions & Decisions

### Resolved ✅
- Q: Keep mode toggle or remove?
- A: **Remove** - Single unified mode is clearer

- Q: Support existing chat histories?
- A: **Yes** - Migrate on first load

- Q: What commands to support?
- A: Start with /plan, /create, /terminal, /refactor

### Open ❓
- Q: Should AI auto-apply simple edits without confirmation?
- Q: Rate limiting strategy for commands?
- Q: Max number of files in context?
- Q: Terminal command security (whitelist/blacklist)?

---

## Resources 📚

**Documentation**:
- Full plan: `docs/UNIFIED_AI_MODE_PLAN.md`
- Implementation: `docs/UNIFIED_AI_IMPLEMENTATION_ROADMAP.md`
- Multi-file sync fix: `docs/MULTI_FILE_PROJECT_SYNC_FIX.md`

**Inspiration**:
- Cursor AI: https://cursor.sh
- Claude Code: Anthropic's coding assistant
- GitHub Copilot: https://copilot.github.com

**Similar Projects**:
- Aider: AI pair programming in terminal
- Continue: VS Code extension for AI coding
- Codium: Open-source AI code assistant

---

## Progress Tracking

**Last Updated**: October 10, 2025  
**Phase**: Planning  
**Next Milestone**: Complete Phase 1 (Week 1)  
**Blocked By**: None  
**Blockers**: None

**Notes**:
- User confirmed this is the right direction
- Focus on simplicity over feature bloat
- Get Week 1 working before adding commands
- Test with real users early and often
