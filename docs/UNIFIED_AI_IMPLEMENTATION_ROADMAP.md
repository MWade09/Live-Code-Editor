# Unified AI Mode - Implementation Roadmap

## Quick Start - What to Do First

### Immediate Actions (This Week)

1. **Create Unified AI Manager** - Merge Chat + Agent into one system
2. **Remove Mode Toggle** - Update UI to single AI interface
3. **Test Basic Flow** - Ensure conversation + editing works
4. **Add `/create` Command** - Enable quick file creation
5. **Update Documentation** - Guide users on new system

---

## Phase 1: Core Unification ⚡ PRIORITY

**Goal**: Single AI mode that can chat AND edit files

### Task 1.1: Create UnifiedAIManager.js

**File**: `website/public/editor/js/modules/UnifiedAIManager.js`

**What It Does:**
- Combines Chat mode (conversational) and Agent mode (file editing)
- Single entry point for all AI interactions
- Intelligent response routing

**Code Structure:**
```javascript
export class UnifiedAIManager {
    constructor(editor, fileManager, projectContextManager) {
        this.editor = editor;
        this.fileManager = fileManager;
        this.projectContextManager = projectContextManager;
        
        this.messages = []; // Conversation history
        this.commandParser = new CommandParser();
        this.responseParser = new ResponseParser();
        this.actionExecutor = new ActionExecutor(fileManager, editor);
    }
    
    /**
     * Main entry point - handles all user messages
     */
    async handleMessage(userMessage) {
        // 1. Check for special commands
        if (userMessage.startsWith('/')) {
            return await this.handleCommand(userMessage);
        }
        
        // 2. Build full context
        const context = this.buildContext();
        
        // 3. Call AI with unified prompt
        const aiResponse = await this.callAI(userMessage, context);
        
        // 4. Parse response for actions (edits, creates, etc.)
        const { conversation, actions } = this.responseParser.parse(aiResponse);
        
        // 5. Display conversational part
        this.addMessage('assistant', conversation);
        
        // 6. Execute actions if present
        if (actions.length > 0) {
            await this.executeActions(actions);
        }
        
        return { conversation, actions };
    }
    
    /**
     * Build complete context for AI
     */
    buildContext() {
        return {
            currentFile: this.getCurrentFileContext(),
            selectedFiles: this.getSelectedFilesContext(),
            projectStructure: this.projectContextManager?.getSummary(),
            recentMessages: this.messages.slice(-10),
            editorErrors: this.getErrors()
        };
    }
    
    /**
     * Call AI API with unified prompt
     */
    async callAI(message, context) {
        const systemPrompt = this.buildSystemPrompt(context);
        
        const response = await fetch('/api/ai/unified', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...this.messages,
                    { role: 'user', content: message }
                ],
                model: this.getSelectedModel()
            })
        });
        
        return await response.json();
    }
    
    /**
     * System prompt for unified AI
     */
    buildSystemPrompt(context) {
        return `You are an advanced AI coding assistant.

CAPABILITIES:
- Natural conversation about code
- Direct file editing (FILE_EDIT marker)
- New file creation (CREATE_FILE marker)
- Terminal commands (TERMINAL marker)
- Project planning (PLAN marker)

CURRENT CONTEXT:
- File: ${context.currentFile?.name || 'none'}
- Project: ${context.projectStructure?.type || 'unknown'}
- Selected Files: ${context.selectedFiles?.length || 0}

RESPONSE FORMAT:
You can combine multiple response types:

1. CONVERSATIONAL: Natural language explanation
2. FILE_EDIT: filename.ext
   [new content]
   END_FILE_EDIT
3. CREATE_FILE: filename.ext
   [content]
   END_CREATE_FILE

Be concise, actionable, and helpful.`;
    }
}
```

**Checklist:**
- [ ] Create file structure
- [ ] Implement `handleMessage()` method
- [ ] Implement `buildContext()` method
- [ ] Implement `callAI()` method
- [ ] Test basic conversation
- [ ] Test file editing
- [ ] Test file creation

---

### Task 1.2: Create Response Parser

**File**: `website/public/editor/js/modules/ResponseParser.js`

**What It Does:**
- Parses AI responses for different action types
- Extracts conversational text vs action markers
- Returns structured action objects

**Code Structure:**
```javascript
export class ResponseParser {
    /**
     * Parse unified AI response
     * @returns {Object} { conversation: string, actions: Array }
     */
    parse(aiResponse) {
        const actions = [];
        let conversation = aiResponse;
        
        // Extract FILE_EDIT actions
        const fileEdits = this.extractFileEdits(aiResponse);
        actions.push(...fileEdits);
        
        // Extract CREATE_FILE actions
        const fileCreations = this.extractFileCreations(aiResponse);
        actions.push(...fileCreations);
        
        // Extract TERMINAL commands
        const terminalCommands = this.extractTerminalCommands(aiResponse);
        actions.push(...terminalCommands);
        
        // Extract PLAN sections
        const plans = this.extractPlans(aiResponse);
        actions.push(...plans);
        
        // Remove action markers from conversation
        conversation = this.cleanConversation(conversation, actions);
        
        return { conversation, actions };
    }
    
    extractFileEdits(response) {
        const pattern = /FILE_EDIT:\s*([^\n]+)\n([\s\S]*?)END_FILE_EDIT/g;
        const edits = [];
        let match;
        
        while ((match = pattern.exec(response)) !== null) {
            edits.push({
                type: 'edit',
                file: match[1].trim(),
                content: match[2].trim(),
                raw: match[0]
            });
        }
        
        return edits;
    }
    
    extractFileCreations(response) {
        const pattern = /CREATE_FILE:\s*([^\n]+)\n([\s\S]*?)END_CREATE_FILE/g;
        const creations = [];
        let match;
        
        while ((match = pattern.exec(response)) !== null) {
            creations.push({
                type: 'create',
                file: match[1].trim(),
                content: match[2].trim(),
                raw: match[0]
            });
        }
        
        return creations;
    }
    
    extractTerminalCommands(response) {
        const pattern = /TERMINAL:\s*([^\n]+)/g;
        const commands = [];
        let match;
        
        while ((match = pattern.exec(response)) !== null) {
            commands.push({
                type: 'terminal',
                command: match[1].trim(),
                raw: match[0]
            });
        }
        
        return commands;
    }
    
    extractPlans(response) {
        const pattern = /PLAN:\n([\s\S]*?)END_PLAN/g;
        const plans = [];
        let match;
        
        while ((match = pattern.exec(response)) !== null) {
            plans.push({
                type: 'plan',
                content: match[1].trim(),
                raw: match[0]
            });
        }
        
        return plans;
    }
    
    cleanConversation(text, actions) {
        let cleaned = text;
        
        // Remove all action markers
        actions.forEach(action => {
            cleaned = cleaned.replace(action.raw, '');
        });
        
        // Clean up extra whitespace
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
        
        return cleaned;
    }
}
```

**Checklist:**
- [ ] Create ResponseParser class
- [ ] Implement FILE_EDIT extraction
- [ ] Implement CREATE_FILE extraction
- [ ] Implement TERMINAL extraction
- [ ] Implement PLAN extraction
- [ ] Test with sample responses
- [ ] Handle edge cases (nested markers, etc.)

---

### Task 1.3: Create Action Executor

**File**: `website/public/editor/js/modules/ActionExecutor.js`

**What It Does:**
- Executes parsed actions (edit, create, terminal, plan)
- Shows action preview UI
- Handles user approval/rejection

**Code Structure:**
```javascript
export class ActionExecutor {
    constructor(fileManager, editor) {
        this.fileManager = fileManager;
        this.editor = editor;
    }
    
    /**
     * Execute array of actions
     */
    async executeActions(actions) {
        for (const action of actions) {
            await this.executeAction(action);
        }
    }
    
    /**
     * Execute single action based on type
     */
    async executeAction(action) {
        switch(action.type) {
            case 'edit':
                return await this.executeEdit(action);
            case 'create':
                return await this.executeCreate(action);
            case 'terminal':
                return await this.executeTerminal(action);
            case 'plan':
                return await this.displayPlan(action);
            default:
                console.warn('Unknown action type:', action.type);
        }
    }
    
    /**
     * Execute file edit action
     */
    async executeEdit(action) {
        // Find the file
        const file = this.fileManager.files.find(f => f.name === action.file);
        
        if (!file) {
            console.error('File not found:', action.file);
            return;
        }
        
        // Show action card with preview
        this.showActionCard({
            type: 'edit',
            title: `Edit: ${action.file}`,
            icon: '✏️',
            preview: this.createDiffPreview(file.content, action.content),
            onApply: () => {
                // Update file content
                file.content = action.content;
                this.fileManager.saveFilesToStorage();
                
                // Update editor if this file is open
                if (this.fileManager.getCurrentFile()?.id === file.id) {
                    this.editor.setValue(action.content);
                }
                
                this.showSuccessMessage(`Updated ${action.file}`);
            },
            onReject: () => {
                this.showInfoMessage('Edit cancelled');
            }
        });
    }
    
    /**
     * Execute file creation action
     */
    async executeCreate(action) {
        // Check if file already exists
        const exists = this.fileManager.files.some(f => f.name === action.file);
        
        if (exists) {
            if (!confirm(`File ${action.file} already exists. Overwrite?`)) {
                return;
            }
        }
        
        // Show action card with preview
        this.showActionCard({
            type: 'create',
            title: `Create: ${action.file}`,
            icon: '✨',
            preview: this.createCodePreview(action.content),
            onApply: () => {
                // Create the file
                if (exists) {
                    // Overwrite existing
                    const file = this.fileManager.files.find(f => f.name === action.file);
                    file.content = action.content;
                } else {
                    // Create new
                    this.fileManager.createNewFile(action.file, action.content);
                }
                
                this.showSuccessMessage(`Created ${action.file}`);
            },
            onReject: () => {
                this.showInfoMessage('File creation cancelled');
            }
        });
    }
    
    /**
     * Execute terminal command
     */
    async executeTerminal(action) {
        this.showActionCard({
            type: 'terminal',
            title: 'Run Command',
            icon: '🖥️',
            preview: `<code>$ ${action.command}</code>`,
            onApply: async () => {
                if (window.terminalManager) {
                    const result = await window.terminalManager.executeCommand(action.command);
                    this.showTerminalOutput(result);
                } else {
                    this.showErrorMessage('Terminal not available');
                }
            },
            onReject: () => {
                this.showInfoMessage('Command cancelled');
            }
        });
    }
    
    /**
     * Display project plan
     */
    async displayPlan(action) {
        this.showActionCard({
            type: 'plan',
            title: 'Project Plan',
            icon: '📋',
            preview: this.formatPlan(action.content),
            onApply: () => {
                // Save plan to a new file
                const planContent = `# Project Plan\n\n${action.content}`;
                this.fileManager.createNewFile('PROJECT_PLAN.md', planContent);
                this.showSuccessMessage('Plan saved to PROJECT_PLAN.md');
            },
            onReject: () => {
                this.showInfoMessage('Plan discarded');
            }
        });
    }
    
    /**
     * Show action card UI
     */
    showActionCard(config) {
        const card = document.createElement('div');
        card.className = `action-card ${config.type}-action`;
        card.innerHTML = `
            <div class="action-header">
                <span class="action-icon">${config.icon}</span>
                <strong>${config.title}</strong>
            </div>
            <div class="action-preview">
                ${config.preview}
            </div>
            <div class="action-buttons">
                <button class="apply-btn">Apply</button>
                <button class="reject-btn">Cancel</button>
            </div>
        `;
        
        // Add to chat
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.appendChild(card);
        
        // Wire up buttons
        card.querySelector('.apply-btn').addEventListener('click', () => {
            config.onApply();
            card.remove();
        });
        
        card.querySelector('.reject-btn').addEventListener('click', () => {
            config.onReject();
            card.remove();
        });
    }
}
```

**Checklist:**
- [ ] Create ActionExecutor class
- [ ] Implement executeEdit()
- [ ] Implement executeCreate()
- [ ] Implement executeTerminal()
- [ ] Implement displayPlan()
- [ ] Create action card UI
- [ ] Test each action type
- [ ] Add error handling

---

### Task 1.4: Update UI - Remove Mode Toggle

**Files:**
- `website/public/editor/index.html`
- `website/public/editor/css/chat-panel-clean.css`

**Changes to index.html:**

**Remove:**
```html
<!-- DELETE THIS -->
<div class="mode-toggle">
    <button id="chat-mode-btn" class="mode-btn active" title="Chat Mode">
        <i class="fas fa-comments"></i>
    </button>
    <button id="agent-mode-btn" class="mode-btn" title="Agent Mode">
        <i class="fas fa-robot"></i>
    </button>
</div>

<!-- DELETE THIS -->
<li><strong>Chat Mode:</strong> Natural conversation...</li>
<li><strong>Agent Mode:</strong> Direct file editing...</li>
```

**Add:**
```html
<!-- ADD THIS -->
<div class="ai-header">
    <h3>AI Assistant</h3>
    <button id="commands-help-btn" class="icon-btn" title="View Commands">
        <i class="fas fa-terminal"></i>
    </button>
</div>

<!-- ADD THIS -->
<div class="command-help-panel" id="command-help-panel" style="display: none;">
    <h4>Available Commands</h4>
    <div class="command-list">
        <div class="command-item">
            <code>/plan</code>
            <span>Create project implementation plan</span>
        </div>
        <div class="command-item">
            <code>/create [filename]</code>
            <span>Create new file</span>
        </div>
        <div class="command-item">
            <code>/edit [filename]</code>
            <span>Focus on editing specific file</span>
        </div>
        <div class="command-item">
            <code>/terminal [command]</code>
            <span>Execute terminal command</span>
        </div>
        <div class="command-item">
            <code>/refactor</code>
            <span>Suggest code improvements</span>
        </div>
        <div class="command-item">
            <code>/debug</code>
            <span>Help debug issues</span>
        </div>
    </div>
</div>
```

**Update Input Placeholder:**
```html
<textarea 
    id="chat-input" 
    placeholder="Ask anything, request changes, or use /commands..."
    rows="3"
></textarea>
```

**Checklist:**
- [ ] Remove mode toggle HTML
- [ ] Remove mode descriptions
- [ ] Add commands help button
- [ ] Add command help panel
- [ ] Update input placeholder
- [ ] Test UI layout

---

### Task 1.5: Update chat-panel.js

**File**: `website/public/editor/js/chat-panel.js`

**Changes:**

**Remove:**
```javascript
// DELETE MODE SWITCHING LOGIC
window.currentMode = 'chat';

chatModeBtn.addEventListener('click', function() {
    window.currentMode = 'chat';
    // ...
});

agentModeBtn.addEventListener('click', function() {
    window.currentMode = 'agent';
    // ...
});
```

**Simplify sendMessage():**
```javascript
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addUserMessage(message);
    chatInput.value = '';
    
    // Show loading indicator
    showLoadingIndicator();
    
    try {
        // Use unified AI manager
        if (window.unifiedAI) {
            await window.unifiedAI.handleMessage(message);
        } else {
            console.error('Unified AI not initialized');
        }
    } catch (error) {
        console.error('AI error:', error);
        addErrorMessage('Sorry, something went wrong. Please try again.');
    } finally {
        hideLoadingIndicator();
    }
}
```

**Checklist:**
- [ ] Remove mode switching code
- [ ] Simplify sendMessage() function
- [ ] Remove mode-specific logic
- [ ] Update initialization
- [ ] Test message sending
- [ ] Test error handling

---

### Task 1.6: Update app.js Integration

**File**: `website/public/editor/js/app.js`

**Add Unified AI Initialization:**
```javascript
import { UnifiedAIManager } from './modules/UnifiedAIManager.js';
import { ResponseParser } from './modules/ResponseParser.js';
import { ActionExecutor } from './modules/ActionExecutor.js';

// Initialize Unified AI (replaces old AIManager)
const responseParser = new ResponseParser();
const actionExecutor = new ActionExecutor(fileManager, editor);

window.unifiedAI = new UnifiedAIManager(
    editor,
    fileManager,
    projectContextManager
);

window.unifiedAI.responseParser = responseParser;
window.unifiedAI.actionExecutor = actionExecutor;

console.log('✅ Unified AI initialized');
```

**Remove:**
```javascript
// DELETE old AIManager initialization if separate
// DELETE mode switching logic
```

**Checklist:**
- [ ] Import new modules
- [ ] Initialize UnifiedAIManager
- [ ] Wire up dependencies
- [ ] Remove old code
- [ ] Test initialization
- [ ] Verify no console errors

---

## Phase 2: Command System 🚀

**Goal**: Add special commands for power users

### Task 2.1: Create Command Parser

**File**: `website/public/editor/js/modules/CommandParser.js`

```javascript
export class CommandParser {
    constructor() {
        this.commands = new Map([
            ['plan', this.parsePlanCommand],
            ['create', this.parseCreateCommand],
            ['edit', this.parseEditCommand],
            ['terminal', this.parseTerminalCommand],
            ['refactor', this.parseRefactorCommand],
            ['debug', this.parseDebugCommand],
            ['test', this.parseTestCommand],
            ['search', this.parseSearchCommand]
        ]);
    }
    
    /**
     * Parse command from user input
     */
    parse(message) {
        const match = message.match(/^\/(\w+)\s*(.*)$/);
        if (!match) return null;
        
        const [, command, args] = match;
        const handler = this.commands.get(command.toLowerCase());
        
        if (!handler) {
            return {
                command: command,
                error: `Unknown command: /${command}`
            };
        }
        
        return handler.call(this, args);
    }
    
    parsePlanCommand(args) {
        return {
            command: 'plan',
            description: args || 'the current project',
            systemPrompt: `Create a detailed implementation plan for: ${args || 'the current project'}.
            
Format as a phased checklist with:
- Phase names
- Tasks per phase
- Dependencies
- Estimated complexity

Use PLAN: ... END_PLAN markers.`
        };
    }
    
    parseCreateCommand(args) {
        const filename = args.trim();
        
        if (!filename) {
            return {
                command: 'create',
                error: 'Usage: /create <filename>'
            };
        }
        
        return {
            command: 'create',
            filename: filename,
            systemPrompt: `Create a new file named "${filename}" with appropriate boilerplate content based on its extension.
            
Use CREATE_FILE: ${filename} ... END_CREATE_FILE markers.`
        };
    }
    
    parseEditCommand(args) {
        return {
            command: 'edit',
            filename: args.trim(),
            systemPrompt: `Focus on editing the file: ${args || 'current file'}.`
        };
    }
    
    parseTerminalCommand(args) {
        if (!args.trim()) {
            return {
                command: 'terminal',
                error: 'Usage: /terminal <command>'
            };
        }
        
        return {
            command: 'terminal',
            terminalCommand: args.trim(),
            systemPrompt: `Execute terminal command: ${args}
            
Use TERMINAL: ${args} marker.`
        };
    }
    
    parseRefactorCommand(args) {
        return {
            command: 'refactor',
            scope: args || 'current file',
            systemPrompt: `Analyze and suggest refactoring improvements for ${args || 'the current file'}.
            
Focus on:
- Code organization
- Performance
- Readability
- Best practices

Provide FILE_EDIT markers with improvements.`
        };
    }
}
```

**Checklist:**
- [ ] Create CommandParser class
- [ ] Implement core commands
- [ ] Add command validation
- [ ] Add error messages
- [ ] Test each command
- [ ] Document command format

---

### Task 2.2: Implement Command Handlers in UnifiedAIManager

**Add to UnifiedAIManager:**

```javascript
/**
 * Handle special commands
 */
async handleCommand(message) {
    const parsed = this.commandParser.parse(message);
    
    if (!parsed) {
        return await this.handleMessage(message); // Not a command
    }
    
    if (parsed.error) {
        this.addMessage('system', parsed.error);
        return;
    }
    
    // Show command being executed
    this.addMessage('system', `Executing: /${parsed.command}...`);
    
    // Build context with command-specific prompt
    const context = this.buildContext();
    context.commandPrompt = parsed.systemPrompt;
    
    // Call AI with command context
    const aiResponse = await this.callAI(parsed.description || '', context);
    
    // Parse and execute response
    const { conversation, actions } = this.responseParser.parse(aiResponse);
    
    this.addMessage('assistant', conversation);
    
    if (actions.length > 0) {
        await this.actionExecutor.executeActions(actions);
    }
}
```

**Checklist:**
- [ ] Add handleCommand() method
- [ ] Wire up CommandParser
- [ ] Test /plan command
- [ ] Test /create command
- [ ] Test /terminal command
- [ ] Handle command errors

---

### Task 2.3: Add Command Autocomplete UI

**Add to chat-panel-clean.css:**
```css
.command-hints {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    margin-bottom: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
}

.command-hint {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
}

.command-hint:hover,
.command-hint.selected {
    background: var(--accent-color);
    color: white;
}

.command-hint code {
    font-family: 'Courier New', monospace;
    background: rgba(0,0,0,0.2);
    padding: 2px 6px;
    border-radius: 3px;
}

.command-hint-description {
    font-size: 0.85em;
    opacity: 0.8;
}
```

**Add to chat-panel.js:**
```javascript
// Command autocomplete
chatInput.addEventListener('input', function(e) {
    const value = e.target.value;
    
    if (value.startsWith('/')) {
        showCommandHints(value);
    } else {
        hideCommandHints();
    }
});

function showCommandHints(input) {
    const commands = [
        { cmd: '/plan', desc: 'Create project plan' },
        { cmd: '/create', desc: 'Create new file' },
        { cmd: '/edit', desc: 'Edit specific file' },
        { cmd: '/terminal', desc: 'Run terminal command' },
        { cmd: '/refactor', desc: 'Suggest improvements' },
        { cmd: '/debug', desc: 'Debug assistance' }
    ];
    
    const filtered = commands.filter(c => 
        c.cmd.startsWith(input.toLowerCase())
    );
    
    if (filtered.length === 0) {
        hideCommandHints();
        return;
    }
    
    // Show hints UI
    let hintsEl = document.getElementById('command-hints');
    if (!hintsEl) {
        hintsEl = document.createElement('div');
        hintsEl.id = 'command-hints';
        hintsEl.className = 'command-hints';
        chatInput.parentElement.appendChild(hintsEl);
    }
    
    hintsEl.innerHTML = filtered.map((c, i) => `
        <div class="command-hint ${i === 0 ? 'selected' : ''}" data-command="${c.cmd}">
            <code>${c.cmd}</code>
            <span class="command-hint-description">${c.desc}</span>
        </div>
    `).join('');
    
    hintsEl.style.display = 'block';
    
    // Click to select
    hintsEl.querySelectorAll('.command-hint').forEach(hint => {
        hint.addEventListener('click', () => {
            chatInput.value = hint.dataset.command + ' ';
            chatInput.focus();
            hideCommandHints();
        });
    });
}

function hideCommandHints() {
    const hintsEl = document.getElementById('command-hints');
    if (hintsEl) {
        hintsEl.style.display = 'none';
    }
}
```

**Checklist:**
- [ ] Add command hints CSS
- [ ] Implement showCommandHints()
- [ ] Add keyboard navigation (arrow keys)
- [ ] Add Tab key completion
- [ ] Test autocomplete
- [ ] Add command descriptions

---

## Phase 3: Polish & Testing ✨

### Task 3.1: Add Action Card Styling

**File**: `website/public/editor/css/chat-panel-clean.css`

```css
/* Action Cards */
.action-card {
    margin: 12px 0;
    padding: 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    border-left: 4px solid var(--accent-color);
}

.edit-action {
    border-left-color: #ffa500;
}

.create-action {
    border-left-color: #00d4ff;
}

.terminal-action {
    border-left-color: #00ff88;
}

.plan-action {
    border-left-color: #ff00ff;
}

.action-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 600;
}

.action-icon {
    font-size: 1.2em;
}

.action-preview {
    margin: 8px 0;
    padding: 8px;
    background: rgba(0,0,0,0.2);
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;
}

.action-preview code {
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
}

.action-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.action-buttons button {
    flex: 1;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
}

.apply-btn {
    background: var(--accent-color);
    color: white;
}

.apply-btn:hover {
    background: var(--accent-hover);
}

.reject-btn {
    background: var(--bg-tertiary);
    color: var(--text-color);
}

.reject-btn:hover {
    background: var(--bg-quaternary);
}
```

**Checklist:**
- [ ] Add action card styles
- [ ] Test different action types
- [ ] Verify responsive design
- [ ] Test dark/light themes
- [ ] Add animations

---

### Task 3.2: Comprehensive Testing

**Test Cases:**

**1. Basic Conversation:**
```
Input: "What's the best way to center a div?"
Expected: Conversational response with code examples
```

**2. File Edit Request:**
```
Input: "Add error handling to the login function"
Expected: 
- Conversational explanation
- FILE_EDIT action card
- Apply/Cancel buttons
```

**3. File Creation:**
```
Input: "/create utils.js"
Expected:
- CREATE_FILE action card
- Boilerplate content
- Create button
```

**4. Terminal Command:**
```
Input: "/terminal npm install react-router-dom"
Expected:
- TERMINAL action card
- Command preview
- Execute button
```

**5. Project Planning:**
```
Input: "/plan todo app with authentication"
Expected:
- PLAN action card
- Phased checklist
- Save to file option
```

**6. Multi-Action Response:**
```
Input: "Set up routing in my app"
Expected:
- Conversation
- TERMINAL action (npm install)
- CREATE_FILE action (routes.js)
- FILE_EDIT action (App.js)
- All actions shown
```

**Checklist:**
- [ ] Test all commands
- [ ] Test conversation flow
- [ ] Test action execution
- [ ] Test error handling
- [ ] Test with different models
- [ ] Test persistence (reload page)

---

### Task 3.3: Update Documentation

**Create**: `docs/AI_COMMANDS_REFERENCE.md`
**Update**: `docs/TODO.md` (mark unified mode as complete)
**Update**: `README.md` (update features section)

**Checklist:**
- [ ] Write command reference
- [ ] Create user guide
- [ ] Add screenshots
- [ ] Record demo video
- [ ] Update changelog

---

## Success Criteria ✅

### Must Have
- [x] Single AI mode (no Chat/Agent toggle)
- [x] Can have conversations
- [x] Can edit files directly
- [x] Can create new files
- [x] Special commands work (/plan, /create, etc.)
- [x] Action cards show preview before execution
- [x] User can approve/reject actions

### Should Have
- [ ] Command autocomplete
- [ ] Terminal integration
- [ ] Multi-action support
- [ ] Keyboard shortcuts
- [ ] Error recovery

### Nice to Have
- [ ] AI-suggested commands
- [ ] Command history
- [ ] Custom commands
- [ ] Action undo/redo

---

## Timeline Estimate

**Week 1:**
- Core unification (Task 1.1 - 1.6)
- Basic conversation + editing working
- Remove mode toggle

**Week 2:**
- Command system (Task 2.1 - 2.3)
- Action executor
- Response parser
- Basic commands working

**Week 3:**
- Polish UI
- Testing
- Documentation
- Bug fixes

**Total: ~3 weeks to production-ready**

---

## Next Steps

1. **Start with Task 1.1** - Create UnifiedAIManager.js
2. **Test incrementally** - Don't wait until everything is done
3. **Get user feedback early** - Show prototype after Week 1
4. **Iterate** - Adjust based on feedback

This unified AI mode will be a game-changer for the editor! 🚀
