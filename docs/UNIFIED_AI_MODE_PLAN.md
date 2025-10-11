# Unified AI Mode - Implementation Plan

## Overview

Consolidate Chat Mode and Agent Mode into a **single, powerful AI assistant** that can:
- Have natural conversations
- Edit files directly
- Create new files
- Plan projects
- Execute terminal commands
- All without mode switching

## Rationale

### Why Unify?

**Current Problems:**
- Users need to switch between Chat and Agent modes
- Confusion about which mode to use
- Agent can't chat conversationally
- Chat can't edit files directly
- Duplicate code paths for similar functionality
- More complex to maintain and extend

**Benefits of Unified Mode:**
- **Simpler UX**: One mode does everything
- **More Powerful**: AI decides when to chat vs edit
- **Like Cursor**: Professional tools use single AI mode
- **Easier Maintenance**: One code path, not two
- **Better Context**: AI has full conversation + file history
- **Special Commands**: Advanced users get power features

### Inspiration

**Cursor AI:**
- Single AI mode
- Decides when to edit vs respond
- Uses `@` symbols for references (@file, @folder)
- Natural language + actions

**Claude Code (Anthropic):**
- Conversational interface
- Direct file manipulation
- Terminal integration
- Planning capabilities

**GitHub Copilot Chat:**
- Single unified interface
- Special commands (`/explain`, `/fix`, `/tests`)
- Context-aware suggestions

---

## Architecture Design

### Current State

**Chat Mode (`chat-panel.js`):**
```javascript
// Conversational responses
// Shows code in markdown blocks
// Diff view for multi-file edits
// No direct file modification
```

**Agent Mode (`AIManager.executeAgentMode()`):**
```javascript
// Direct file editing
// Creates new files
// Minimal conversation
// JSON response format
```

### Unified Architecture

**Single AI Mode:**
```javascript
class UnifiedAIAssistant {
    // Handles all interactions in one system
    
    async handleUserMessage(message) {
        // 1. Parse for special commands
        if (message.startsWith('/')) {
            return this.handleCommand(message);
        }
        
        // 2. Build context (files, project, conversation)
        const context = this.buildFullContext();
        
        // 3. Send to AI with unified prompt
        const response = await this.callAI(message, context);
        
        // 4. Parse response for actions
        const actions = this.parseResponse(response);
        
        // 5. Execute actions (edit, create, chat, terminal)
        await this.executeActions(actions);
        
        // 6. Show response to user
        this.displayResponse(response, actions);
    }
}
```

---

## Special Commands System

### Command Structure

Commands start with `/` for advanced features:

```
/plan        - Create project implementation plan
/edit        - Focus AI on editing specific file
/create      - Create new file with AI
/terminal    - Execute terminal command
/search      - Search codebase
/refactor    - Suggest refactoring
/debug       - Help debug current issue
/test        - Generate tests
/optimize    - Performance optimization suggestions
/security    - Security audit
/docs        - Generate documentation
/explain     - Explain code
/fix         - Fix errors/warnings
```

### Implementation

**Command Parser:**
```javascript
parseCommand(message) {
    const match = message.match(/^\/(\w+)\s*(.*)$/);
    if (!match) return null;
    
    return {
        command: match[1],
        args: match[2].trim()
    };
}

async handleCommand(message) {
    const { command, args } = this.parseCommand(message);
    
    switch(command) {
        case 'plan':
            return this.handlePlanCommand(args);
        case 'edit':
            return this.handleEditCommand(args);
        case 'create':
            return this.handleCreateCommand(args);
        case 'terminal':
            return this.handleTerminalCommand(args);
        // ... etc
    }
}
```

### Command Examples

**`/plan` - Project Planning:**
```
User: /plan Build a todo app with React and Firebase

AI Response:
📋 Project Plan: Todo App with React + Firebase

Phase 1: Setup
- [ ] Initialize React app (Vite)
- [ ] Install Firebase SDK
- [ ] Configure Firebase project

Phase 2: Components
- [ ] Create TodoList component
- [ ] Create TodoItem component
- [ ] Create AddTodo form

Phase 3: Firebase Integration
- [ ] Set up Firestore database
- [ ] Implement CRUD operations
- [ ] Add real-time listeners

Would you like me to start implementing Phase 1?
```

**`/create` - Quick File Creation:**
```
User: /create utils.js with helper functions for date formatting

AI Response:
✨ Creating file: utils.js

[Shows file content preview]
[Button: Create File]

Created utils.js with:
- formatDate()
- formatTime()
- formatRelative()
- parseISODate()
```

**`/terminal` - Terminal Integration:**
```
User: /terminal npm install react-router-dom

AI Response:
🖥️ Executing: npm install react-router-dom

[Shows terminal output]

✅ Package installed successfully!
Would you like me to set up routing in your app?
```

**`/refactor` - Code Improvement:**
```
User: /refactor improve performance of this component

AI Response:
🔧 Refactoring Suggestions:

1. Memoize expensive calculations
2. Use useCallback for event handlers
3. Implement virtual scrolling for list

Apply changes?
[Button: Apply All] [Button: Show Diff]
```

---

## Response Format System

### Unified Response Structure

AI responses can contain multiple action types in one message:

```json
{
  "type": "unified",
  "conversational": "I'll help you create a todo component...",
  "actions": [
    {
      "type": "edit",
      "file": "TodoList.js",
      "changes": "...",
      "explanation": "Updated to use useCallback"
    },
    {
      "type": "create",
      "file": "TodoItem.js",
      "content": "...",
      "explanation": "Created new component"
    },
    {
      "type": "terminal",
      "command": "npm install uuid",
      "explanation": "Install dependency for unique IDs"
    }
  ]
}
```

### Response Parsing

**Smart Detection:**
```javascript
parseUnifiedResponse(aiResponse) {
    const actions = [];
    
    // Detect file edits
    if (aiResponse.includes('FILE_EDIT:')) {
        actions.push(this.parseFileEdit(aiResponse));
    }
    
    // Detect file creation
    if (aiResponse.includes('CREATE_FILE:')) {
        actions.push(this.parseFileCreation(aiResponse));
    }
    
    // Detect terminal commands
    if (aiResponse.includes('TERMINAL:')) {
        actions.push(this.parseTerminalCommand(aiResponse));
    }
    
    // Extract conversational response
    const conversation = this.extractConversation(aiResponse);
    
    return { conversation, actions };
}
```

### Action Execution

**Unified Executor:**
```javascript
async executeActions(actions) {
    for (const action of actions) {
        switch(action.type) {
            case 'edit':
                await this.editFile(action);
                break;
            case 'create':
                await this.createFile(action);
                break;
            case 'terminal':
                await this.runTerminal(action);
                break;
            case 'search':
                await this.searchCodebase(action);
                break;
        }
    }
}
```

---

## UI Changes

### Remove Mode Toggle

**Before:**
```html
<div class="mode-toggle">
    <button id="chat-mode-btn" class="mode-btn active">💬</button>
    <button id="agent-mode-btn" class="mode-btn">🤖</button>
</div>
```

**After:**
```html
<!-- Single AI assistant - no toggle needed -->
<div class="ai-header">
    <h3>AI Assistant</h3>
    <button id="commands-help-btn" title="View Commands">
        <i class="fas fa-terminal"></i>
    </button>
</div>
```

### Unified Input Area

**Enhanced Input with Command Hints:**
```html
<div class="chat-input-area">
    <div class="command-hints" id="command-hints" style="display: none;">
        <div class="hint">/plan - Create project plan</div>
        <div class="hint">/create - Create new file</div>
        <div class="hint">/edit - Edit specific file</div>
        <div class="hint">/terminal - Run command</div>
    </div>
    
    <textarea 
        id="chat-input" 
        placeholder="Ask anything, request edits, or use /commands..."
        rows="3"
    ></textarea>
    
    <div class="input-actions">
        <button id="attach-files-btn" title="Attach Files">📎</button>
        <button id="chat-send-btn" class="primary">Send</button>
    </div>
</div>
```

### Action Response UI

**Action Preview Cards:**
```html
<div class="ai-response">
    <div class="conversation-part">
        <p>I'll help you create a todo component...</p>
    </div>
    
    <div class="actions-part">
        <div class="action-card edit-action">
            <div class="action-header">
                <span class="action-icon">✏️</span>
                <span class="action-type">Edit File</span>
                <strong>TodoList.js</strong>
            </div>
            <div class="action-preview">
                <code>...</code>
            </div>
            <div class="action-buttons">
                <button class="apply-btn">Apply</button>
                <button class="diff-btn">View Diff</button>
            </div>
        </div>
        
        <div class="action-card create-action">
            <div class="action-header">
                <span class="action-icon">✨</span>
                <span class="action-type">Create File</span>
                <strong>TodoItem.js</strong>
            </div>
            <div class="action-preview">
                <code>...</code>
            </div>
            <div class="action-buttons">
                <button class="create-btn">Create</button>
                <button class="preview-btn">Preview</button>
            </div>
        </div>
    </div>
</div>
```

---

## System Prompt Design

### Unified System Prompt

```javascript
const UNIFIED_SYSTEM_PROMPT = `You are an advanced AI coding assistant integrated into a code editor.

CAPABILITIES:
- Have natural conversations about code and projects
- Edit existing files directly
- Create new files
- Execute terminal commands
- Plan and architect projects
- Debug and optimize code

RESPONSE FORMAT:
You can respond in multiple ways simultaneously:

1. CONVERSATIONAL: Natural language explanation
2. FILE_EDIT: Direct file modifications
   Format: FILE_EDIT: filename.ext
           [new file content]
           END_FILE_EDIT

3. CREATE_FILE: New file creation
   Format: CREATE_FILE: filename.ext
           [file content]
           END_CREATE_FILE

4. TERMINAL: Terminal command execution
   Format: TERMINAL: command
           [explanation of what it does]

5. PLAN: Project planning breakdown
   Format: PLAN:
           - [ ] Task 1
           - [ ] Task 2
           END_PLAN

GUIDELINES:
- Be concise and actionable
- Edit files directly when user requests changes
- Explain what you're doing and why
- Suggest next steps after completing actions
- Use terminal commands when appropriate
- Always maintain code quality

USER CONTEXT:
- Current file: {currentFile}
- Project files: {fileList}
- Selected files for context: {selectedFiles}
- Recent conversation: {conversationHistory}
`;
```

### Context Builder

```javascript
buildFullContext() {
    return {
        currentFile: {
            name: this.fileManager.getCurrentFile()?.name,
            content: this.fileManager.getCurrentFile()?.content,
            language: this.fileManager.getCurrentFile()?.type
        },
        
        allFiles: this.fileManager.files.map(f => ({
            name: f.name,
            type: f.type,
            size: f.content.length
        })),
        
        selectedFiles: Array.from(this.selectedFileIds).map(id => {
            const file = this.fileManager.files.find(f => f.id === id);
            return {
                name: file.name,
                content: file.content,
                type: file.type
            };
        }),
        
        projectStructure: this.projectContextManager?.getProjectSummary(),
        
        conversationHistory: this.messages.slice(-10), // Last 10 messages
        
        errors: this.getEditorErrors(), // If linter is active
        
        terminal: this.getLastTerminalOutput() // If terminal is active
    };
}
```

---

## Terminal Integration

### Enhanced Terminal Commands

**Terminal Manager Integration:**
```javascript
class TerminalCommandManager {
    async executeCommand(command, showOutput = true) {
        // Send to terminal manager
        if (window.terminalManager) {
            const result = await window.terminalManager.executeCommand(command);
            
            if (showOutput) {
                this.displayTerminalOutput(result);
            }
            
            return result;
        }
    }
    
    displayTerminalOutput(result) {
        const outputHTML = `
            <div class="terminal-output">
                <div class="terminal-command">$ ${result.command}</div>
                <pre class="terminal-result">${result.output}</pre>
                ${result.error ? `<div class="terminal-error">${result.error}</div>` : ''}
            </div>
        `;
        
        this.addToChat(outputHTML);
    }
}
```

### AI-Suggested Terminal Commands

**Smart Command Suggestions:**
```javascript
async suggestTerminalCommands(context) {
    // AI analyzes context and suggests relevant commands
    
    const suggestions = [];
    
    // Package management
    if (context.hasPackageJson && context.missingDependencies) {
        suggestions.push({
            command: 'npm install',
            reason: 'Install missing dependencies',
            auto: false
        });
    }
    
    // Git operations
    if (context.hasUncommittedChanges) {
        suggestions.push({
            command: 'git add . && git commit -m "..."',
            reason: 'Commit recent changes',
            auto: false
        });
    }
    
    // Build/test
    if (context.hasTests && context.testsNotRun) {
        suggestions.push({
            command: 'npm test',
            reason: 'Run test suite',
            auto: true // Can run automatically
        });
    }
    
    return suggestions;
}
```

---

## Implementation Phases

### Phase 1: Core Unification (Week 1)

**Tasks:**
- [ ] Create new `UnifiedAIManager.js` module
- [ ] Merge Chat and Agent functionality
- [ ] Remove mode toggle from UI
- [ ] Update system prompts
- [ ] Test basic conversation + editing

**Files:**
- `js/modules/UnifiedAIManager.js` (new)
- `js/chat-panel.js` (simplify)
- `index.html` (remove mode toggle)
- `css/chat-panel-clean.css` (update UI)

### Phase 2: Command System (Week 1-2)

**Tasks:**
- [ ] Implement command parser
- [ ] Add `/plan` command
- [ ] Add `/create` command
- [ ] Add `/edit` command
- [ ] Add command autocomplete

**Files:**
- `js/modules/CommandParser.js` (new)
- `js/modules/UnifiedAIManager.js` (extend)
- `css/chat-panel-clean.css` (command hints UI)

### Phase 3: Response Actions (Week 2)

**Tasks:**
- [ ] Unified response parser
- [ ] Action executor system
- [ ] Action preview UI
- [ ] Apply/reject action buttons
- [ ] Multi-action support

**Files:**
- `js/modules/ActionExecutor.js` (new)
- `js/modules/ResponseParser.js` (new)
- `css/chat-panel-clean.css` (action cards)

### Phase 4: Terminal Integration (Week 2-3)

**Tasks:**
- [ ] `/terminal` command
- [ ] Terminal output in chat
- [ ] AI-suggested commands
- [ ] Command approval system
- [ ] Terminal history integration

**Files:**
- `js/modules/TerminalIntegration.js` (new)
- `js/modules/TerminalManager.js` (enhance)
- `js/modules/UnifiedAIManager.js` (integrate)

### Phase 5: Advanced Commands (Week 3)

**Tasks:**
- [ ] `/search` - Codebase search
- [ ] `/refactor` - Code refactoring
- [ ] `/debug` - Debugging assistance
- [ ] `/test` - Test generation
- [ ] `/docs` - Documentation generation

**Files:**
- `js/modules/AdvancedCommands.js` (new)
- `js/modules/UnifiedAIManager.js` (extend)

### Phase 6: Polish & Documentation (Week 3-4)

**Tasks:**
- [ ] Command reference panel
- [ ] Keyboard shortcuts
- [ ] User documentation
- [ ] Video tutorials
- [ ] Migration guide

**Files:**
- `docs/AI_COMMANDS_REFERENCE.md` (new)
- `docs/UNIFIED_AI_GUIDE.md` (new)
- `index.html` (help panel)

---

## Code Migration Strategy

### Preserve Existing Functionality

**What to Keep:**
- ✅ Multi-file context selection
- ✅ Project-wide context awareness
- ✅ Multi-file edit suggestions (diff UI)
- ✅ Syntax-highlighted code blocks
- ✅ File creation capability

**What to Consolidate:**
- 🔄 Chat panel and AI modal → Single AI panel
- 🔄 Chat mode and Agent mode → Unified mode
- 🔄 Multiple API call methods → Single unified caller

**What to Remove:**
- ❌ Mode toggle buttons
- ❌ Duplicate code paths
- ❌ Mode-specific prompts
- ❌ Separate chat histories (merge into one)

### Backward Compatibility

**LocalStorage Migration:**
```javascript
// Migrate old chat histories
function migrateOldChatData() {
    const chatHistory = localStorage.getItem('chat_history');
    const agentHistory = localStorage.getItem('agent_history');
    
    if (chatHistory || agentHistory) {
        const unified = [
            ...(chatHistory ? JSON.parse(chatHistory) : []),
            ...(agentHistory ? JSON.parse(agentHistory) : [])
        ];
        
        localStorage.setItem('unified_ai_history', JSON.stringify(unified));
        localStorage.removeItem('chat_history');
        localStorage.removeItem('agent_history');
    }
}
```

---

## User Experience Flow

### Example 1: Simple Conversation
```
User: What's the best way to handle form validation in React?

AI: For React form validation, I recommend:

1. **Controlled Components** - Keep form state in React
2. **Validation Libraries** - Use Yup or Zod for schemas
3. **React Hook Form** - Popular, performant library

Would you like me to:
- Create a validated form component?
- Install react-hook-form?
- Show a complete example?
```

### Example 2: Direct Edit Request
```
User: Add error handling to the login function

AI: I'll add comprehensive error handling to your login function.

[Action Card: Edit auth.js]
✏️ Edit File: auth.js

Changes:
- Added try-catch block
- Specific error messages for different failure types
- Loading state management
- User-friendly error display

[Button: Apply Changes] [Button: View Diff]

The function now handles:
- Network errors
- Invalid credentials
- Server errors
- Timeout issues
```

### Example 3: Using Commands
```
User: /plan authentication system

AI: 📋 Authentication System Plan

Phase 1: Backend Setup
- [ ] Create user model
- [ ] Set up JWT token generation
- [ ] Create login/register endpoints
- [ ] Add password hashing

Phase 2: Frontend Components
- [ ] Login form component
- [ ] Register form component
- [ ] Auth context provider
- [ ] Protected route wrapper

Phase 3: Integration
- [ ] Connect forms to API
- [ ] Store tokens securely
- [ ] Add auto-login
- [ ] Handle token refresh

Would you like me to start with Phase 1?
[Button: Start Phase 1] [Button: Customize Plan]
```

### Example 4: Multi-Action Response
```
User: Set up React Router in my app

AI: I'll set up React Router for you.

[Action Card 1: Terminal Command]
🖥️ Run Command: npm install react-router-dom
Installing routing library...
[Button: Execute]

[Action Card 2: Create File]
✨ Create File: routes.js
Router configuration with main routes
[Button: Create]

[Action Card 3: Edit File]
✏️ Edit File: App.js
Wrap app with BrowserRouter
[Button: Apply]

After applying, your app will have:
- Home, About, Contact routes
- Navigation component
- 404 page handling

[Button: Apply All Changes]
```

---

## Testing Strategy

### Unit Tests
```javascript
describe('UnifiedAIManager', () => {
    test('should parse /plan command', () => {
        const result = parser.parseCommand('/plan Build todo app');
        expect(result.command).toBe('plan');
        expect(result.args).toBe('Build todo app');
    });
    
    test('should detect file edit actions', () => {
        const response = 'FILE_EDIT: test.js\nconsole.log("test");\nEND_FILE_EDIT';
        const actions = parser.parseUnifiedResponse(response);
        expect(actions.actions).toHaveLength(1);
        expect(actions.actions[0].type).toBe('edit');
    });
    
    test('should handle multiple actions', () => {
        const response = `
            Let me help you with that.
            FILE_EDIT: a.js\n...\nEND_FILE_EDIT
            CREATE_FILE: b.js\n...\nEND_CREATE_FILE
        `;
        const actions = parser.parseUnifiedResponse(response);
        expect(actions.actions).toHaveLength(2);
    });
});
```

### Integration Tests
```javascript
describe('Unified AI Flow', () => {
    test('should handle conversation → edit flow', async () => {
        await ai.handleMessage('Can you add a header?');
        expect(chat.lastMessage.type).toBe('conversational');
        
        await ai.handleMessage('Yes, please add it');
        expect(chat.lastMessage.type).toBe('action');
        expect(chat.lastMessage.actions[0].type).toBe('edit');
    });
});
```

### User Acceptance Testing
- [ ] Users can have natural conversations
- [ ] AI can edit files without mode switch
- [ ] Commands work as expected
- [ ] Terminal integration functions correctly
- [ ] Multi-action responses work
- [ ] Action approval/rejection works

---

## Documentation Requirements

### User Guide: `AI_ASSISTANT_GUIDE.md`
- Getting started
- Basic conversation
- File editing
- Command reference
- Advanced features
- Tips and tricks

### Developer Guide: `AI_ARCHITECTURE.md`
- System architecture
- Adding new commands
- Response format specification
- Action executor plugins
- Testing guidelines

### Command Reference: `AI_COMMANDS.md`
```markdown
# AI Assistant Commands

## Planning
- `/plan <description>` - Create project implementation plan
- `/roadmap` - Generate development roadmap

## File Operations
- `/create <filename>` - Create new file
- `/edit <filename>` - Focus on editing specific file
- `/rename <old> <new>` - Rename file

## Code Quality
- `/refactor` - Suggest refactoring improvements
- `/optimize` - Performance optimization
- `/security` - Security audit
- `/test` - Generate tests

## Development
- `/terminal <command>` - Execute terminal command
- `/search <query>` - Search codebase
- `/debug` - Help debug current issue
- `/fix` - Fix errors/warnings

## Documentation
- `/docs` - Generate documentation
- `/explain` - Explain selected code
- `/comment` - Add comments to code
```

---

## Migration Checklist

### Pre-Migration
- [ ] Document current Chat mode functionality
- [ ] Document current Agent mode functionality
- [ ] Export user chat histories
- [ ] Create backup branch

### Migration Steps
- [ ] Create UnifiedAIManager.js
- [ ] Implement core functionality
- [ ] Migrate Chat mode features
- [ ] Migrate Agent mode features
- [ ] Update UI (remove toggle)
- [ ] Update system prompts
- [ ] Merge chat histories
- [ ] Test all scenarios

### Post-Migration
- [ ] Remove old Chat/Agent code
- [ ] Update documentation
- [ ] Create migration guide
- [ ] Announce to users
- [ ] Monitor for issues

---

## Success Metrics

### User Satisfaction
- Reduced confusion (no more "which mode?" questions)
- Increased usage (easier to use = more engagement)
- Positive feedback on unified experience

### Technical Metrics
- **Lines of Code**: Should decrease (less duplication)
- **Bug Rate**: Should decrease (fewer code paths)
- **Feature Velocity**: Should increase (easier to add features)

### Feature Adoption
- Command usage statistics
- Most popular commands
- Terminal integration usage
- Multi-action responses

---

## Future Enhancements

### AI-Powered Features
- **Code Review**: AI reviews code before commit
- **Auto-Fix**: Automatically fix common issues
- **Smart Refactor**: AI suggests when to refactor
- **Performance Monitor**: Track and optimize performance

### Collaboration Features
- **Shared AI Sessions**: Team members see AI suggestions
- **AI Comments**: AI adds inline code comments
- **Pair Programming Mode**: AI as coding partner

### Learning Features
- **Tutorials**: AI-guided tutorials
- **Best Practices**: AI teaches best practices
- **Code Explanations**: Deep dive into how code works

---

## Conclusion

Unifying Chat and Agent modes into a single AI assistant will:

✅ **Simplify** the user experience
✅ **Increase** AI capabilities
✅ **Reduce** code complexity
✅ **Enable** advanced features
✅ **Match** industry standards (Cursor, Claude Code)

The special commands system provides power users with advanced capabilities while keeping the basic interface simple and conversational.

This is the right architectural direction for the editor.
