# Enhanced AI Chat Implementation Plan

**Created:** October 9, 2025  
**Status:** In Progress  
**Goal:** Transform the AI chat into a Cursor-like experience with multi-file awareness and advanced capabilities

---

## 🎯 Overview

This document outlines the implementation of 5 major features to enhance the AI chat system:

1. **Multi-File Context System** - AI can see and reference multiple files
2. **Project-Wide Context Awareness** - AI understands the entire project structure
3. **Multi-File Edit Suggestions** - AI can propose changes across multiple files
4. **Syntax-Highlighted Code Blocks** - Better code rendering with proper syntax highlighting
5. **AI File Creation Capability** - AI can create new files as part of suggestions

---

## 📋 Feature 1: Multi-File Context System

### Goal
Allow users to select multiple files from their project to include as context in AI conversations.

### UI Components

**File Context Selector Panel**
- Location: Above the AI prompt input in chat panel
- Shows collapsible list of project files with checkboxes
- Selected files badge counter (e.g., "3 files selected")
- "Clear All" and "Select All" buttons
- File size indicator (warn if context > 50KB)

**Visual Design**
```
┌─────────────────────────────────────────┐
│ 📁 Include Files in Context (2)         │
│ ┌─────────────────────────────────────┐ │
│ │ ☑ index.html (2.3 KB)               │ │
│ │ ☑ app.js (15.7 KB)                  │ │
│ │ ☐ styles.css (4.2 KB)               │ │
│ │ ☐ FileManager.js (18.5 KB)          │ │
│ │   Clear All | Select All            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Implementation Details

**AIManager.js Changes**
```javascript
class AIManager {
    constructor(editor, fileManager) {
        // ... existing code ...
        this.selectedFileIds = new Set(); // Track selected files for context
        this.initializeFileSelector();
    }
    
    initializeFileSelector() {
        // Build file selector UI
        // Add event listeners for checkboxes
        // Calculate total context size
    }
    
    buildContextFromFiles() {
        // Gather content from selected files
        // Format as structured context for AI
        // Return formatted string
    }
    
    async sendMessage() {
        // ... existing code ...
        // Add file context to system message or user message
        const fileContext = this.buildContextFromFiles();
        // Include in API request
    }
}
```

**Data Structure**
```javascript
{
    selectedFiles: [
        {
            id: 'file_123',
            name: 'app.js',
            content: '...',
            size: 16032,
            language: 'javascript'
        }
    ],
    totalSize: 45234,
    maxContextSize: 51200 // 50KB
}
```

### Files to Modify
- `website/public/editor/js/modules/AIManager.js` - Core logic
- `website/public/editor/css/chat-panel-clean.css` - File selector styling
- `website/public/editor/index.html` - Add file selector HTML structure

---

## 📋 Feature 2: Project-Wide Context Awareness

### Goal
AI understands the complete project structure, dependencies, and relationships between files.

### Components

**ProjectContextManager.js** (New Module)
```javascript
export class ProjectContextManager {
    constructor(fileManager) {
        this.fileManager = fileManager;
        this.projectStructure = null;
        this.dependencies = null;
        this.frameworkInfo = null;
    }
    
    analyzeProject() {
        // Build file tree structure
        // Detect framework (React, Vue, vanilla, etc.)
        // Parse package.json if exists
        // Map import/export relationships
        // Return structured project summary
    }
    
    generateProjectSummary() {
        // Create concise description for AI
        // Include: file count, framework, dependencies, structure
        // Keep under 2KB for efficiency
    }
    
    detectFramework() {
        // Check for React, Vue, Angular patterns
        // Look for framework-specific files
        // Return framework info
    }
    
    parseImportExports() {
        // Scan JS files for import/export statements
        // Build dependency graph
        // Identify entry points
    }
}
```

**Project Summary Format**
```
Project: Multi-file Web App
Framework: React (detected from imports)
Structure:
  - /src (8 files)
    - components/ (5 files)
    - utils/ (2 files)
    - App.js (entry point)
  - /public (3 files)
  - package.json
Dependencies: react, react-dom, axios
Total: 15 files, 142 KB
```

### UI Integration

**Toggle Button in Chat Header**
```html
<button id="include-project-context" class="context-toggle-btn">
    <svg>...</svg>
    Include Project Context
    <span class="badge" title="Adds ~2KB to each request">~2KB</span>
</button>
```

### Files to Create/Modify
- `website/public/editor/js/modules/ProjectContextManager.js` - **NEW**
- `website/public/editor/js/modules/AIManager.js` - Integration
- `website/public/editor/js/app.js` - Initialize new module
- `website/public/editor/css/chat-panel-clean.css` - Toggle button styling

---

## 📋 Feature 3: Multi-File Edit Suggestions

### Goal
AI can propose changes to multiple files simultaneously with a visual diff interface.

### Workflow

1. User asks AI to refactor or make changes
2. AI responds with special format indicating multi-file edits
3. System parses response and shows diff UI
4. User can review each file's changes
5. User applies changes selectively or all at once

### AI Response Format

```markdown
I'll help you refactor this into separate components. Here are the changes:

<file-edit>
filename: src/App.js
action: modify
```javascript
// New refactored code here
```
</file-edit>

<file-edit>
filename: src/components/Header.js
action: create
```javascript
// New component code
```
</file-edit>

<file-edit>
filename: src/components/Footer.js
action: create
```javascript
// New component code
```
</file-edit>
```

### UI Components

**Multi-File Diff Viewer**
```
┌─────────────────────────────────────────────┐
│ 📝 Proposed Changes (3 files)               │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ ✏️ src/App.js (Modified)               │ │
│ │ [View Diff] [Apply] [Skip]              │ │
│ │ ┌───────────────────────────────────┐   │ │
│ │ │ - old line removed                │   │ │
│ │ │ + new line added                  │   │ │
│ │ └───────────────────────────────────┘   │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ➕ src/components/Header.js (New)      │ │
│ │ [Preview] [Create] [Skip]               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Apply All Changes] [Cancel All]            │
└─────────────────────────────────────────────┘
```

### Implementation

**MultiFileEditManager.js** (New Module)
```javascript
export class MultiFileEditManager {
    constructor(fileManager, editor) {
        this.fileManager = fileManager;
        this.editor = editor;
        this.pendingEdits = [];
    }
    
    parseEditProposals(aiResponse) {
        // Parse <file-edit> tags from AI response
        // Extract filename, action, content
        // Return array of edit objects
    }
    
    showDiffViewer(edits) {
        // Create diff UI for each file
        // Show side-by-side or unified diff
        // Add action buttons
    }
    
    applyEdit(editIndex) {
        // Apply single file edit
        // Update file in FileManager
        // Refresh editor if currently open
        // Mark file as dirty
    }
    
    applyAllEdits() {
        // Apply all pending edits
        // Create new files as needed
        // Update existing files
        // Show success notification
    }
    
    generateUnifiedDiff(oldContent, newContent) {
        // Create unified diff format
        // Highlight additions/deletions
        // Return formatted HTML
    }
}
```

### Files to Create/Modify
- `website/public/editor/js/modules/MultiFileEditManager.js` - **NEW**
- `website/public/editor/js/modules/AIManager.js` - Parser integration
- `website/public/editor/css/chat-panel-clean.css` - Diff viewer styling
- `website/public/editor/js/app.js` - Initialize module

---

## 📋 Feature 4: Syntax-Highlighted Code Blocks

### Goal
Display code in chat with proper syntax highlighting for better readability.

### Library Choice

**Prism.js** (Recommended)
- Lightweight (core ~2KB gzipped)
- Supports 200+ languages
- Extensible with plugins
- Auto-language detection
- Line numbers, line highlighting

**Integration**
```html
<!-- In index.html -->
<link href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
```

### Implementation

**Enhanced Code Rendering**
```javascript
// In AIManager.js
renderCodeBlock(code, language) {
    const highlighted = Prism.highlight(
        code,
        Prism.languages[language] || Prism.languages.javascript,
        language
    );
    
    return `
        <div class="code-block-container">
            <div class="code-header">
                <span class="language-badge">${language}</span>
                <button class="copy-code-btn">Copy</button>
            </div>
            <pre class="language-${language}"><code>${highlighted}</code></pre>
        </div>
    `;
}
```

**Language Detection**
```javascript
detectLanguage(code, hint) {
    // Try hint from code fence (```javascript)
    if (hint && Prism.languages[hint]) {
        return hint;
    }
    
    // Pattern matching for common patterns
    if (code.includes('<!DOCTYPE html>')) return 'html';
    if (code.includes('function') || code.includes('=>')) return 'javascript';
    if (code.match(/\.(class|id)\s*\{/)) return 'css';
    if (code.includes('def ') || code.includes('import ')) return 'python';
    
    return 'javascript'; // default
}
```

### Styling Enhancements

**Code Block Theme**
```css
.code-block-container {
    background: var(--code-bg, #1e1e1e);
    border-radius: 8px;
    overflow: hidden;
    margin: 12px 0;
}

.code-header {
    background: rgba(255, 255, 255, 0.05);
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.language-badge {
    font-size: 11px;
    text-transform: uppercase;
    color: #61afef;
    font-weight: 600;
    letter-spacing: 0.5px;
}

.copy-code-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #abb2bf;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
}

.copy-code-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #61afef;
    color: #61afef;
}
```

### Files to Modify
- `website/public/editor/index.html` - Add Prism.js CDN links
- `website/public/editor/js/modules/AIManager.js` - Update renderMessage method
- `website/public/editor/css/chat-panel-clean.css` - Enhanced code block styles

---

## 📋 Feature 5: AI File Creation Capability

### Goal
Allow AI to create new files as part of its suggestions, not just modify existing ones.

### AI Response Format

```markdown
I'll create a new component for you:

<create-file>
filename: src/components/UserProfile.js
description: User profile component with avatar and details
```javascript
import React from 'react';

export default function UserProfile({ user }) {
    return (
        <div className="user-profile">
            <img src={user.avatar} alt={user.name} />
            <h2>{user.name}</h2>
            <p>{user.email}</p>
        </div>
    );
}
```
</create-file>
```

### UI Components

**File Creation Preview**
```
┌─────────────────────────────────────────────┐
│ 📄 Create New File                          │
├─────────────────────────────────────────────┤
│ Filename: src/components/UserProfile.js     │
│ Type: JavaScript Component                  │
│ Size: 287 bytes                             │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ import React from 'react';              │ │
│ │                                         │ │
│ │ export default function UserProfile...  │ │
│ │   ...                                   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Create File] [Edit Filename] [Cancel]     │
└─────────────────────────────────────────────┘
```

### Implementation

**AIManager.js Enhancements**
```javascript
class AIManager {
    parseFileCreationRequests(aiResponse) {
        // Look for <create-file> tags
        // Extract filename and content
        // Validate filename (no invalid chars, no overwrite)
        // Return array of creation requests
    }
    
    showFileCreationDialog(fileData) {
        // Show preview dialog
        // Allow filename editing
        // Show file size and type
        // Confirm before creating
    }
    
    createFileFromAI(filename, content) {
        // Validate filename doesn't exist
        // Create file using FileManager
        // Open file in new tab
        // Show success notification
        // Update file explorer
    }
}
```

**FileManager Integration**
```javascript
// In FileManager.js - already has createNewFile method
createNewFile(name, content = '') {
    const newFile = {
        id: `file_${Date.now()}_${this.fileCounter++}`,
        name: name || `file${this.fileCounter}.html`,
        content: content,
        language: this.detectLanguageFromFilename(name)
    };
    
    this.files.push(newFile);
    this.saveFilesToStorage();
    return newFile;
}
```

### Safety Features

1. **Filename Validation**
   - Check for invalid characters
   - Prevent path traversal (../)
   - Ensure unique filename (or prompt to overwrite)
   - Validate file extension

2. **Confirmation Dialog**
   - Show file preview
   - Allow filename editing
   - Warn if file exists
   - Cancel option

3. **Limits**
   - Max file size (100KB)
   - Max files per AI response (5)
   - Require user confirmation for each file

### Files to Modify
- `website/public/editor/js/modules/AIManager.js` - Parser and UI
- `website/public/editor/js/modules/FileManager.js` - Minor enhancements
- `website/public/editor/css/chat-panel-clean.css` - Dialog styling

---

## 🔄 Implementation Order

### Phase 1: Foundation (Features 1-2)
**Week 1**
1. Multi-File Context System
2. Project-Wide Context Awareness

### Phase 2: Advanced Features (Features 3-4)
**Week 2**
3. Syntax-Highlighted Code Blocks
4. Multi-File Edit Suggestions

### Phase 3: File Creation (Feature 5)
**Week 3**
5. AI File Creation Capability

---

## 📊 Success Metrics

- ✅ Users can select multiple files for AI context
- ✅ AI understands project structure and can reference other files
- ✅ AI can propose multi-file changes with clear diff view
- ✅ Code blocks are syntax-highlighted and easy to read
- ✅ AI can create new files with user confirmation
- ✅ Context size stays manageable (< 100KB per request)
- ✅ UI is intuitive and doesn't clutter the chat experience

---

## 🔧 Technical Considerations

### Performance
- Lazy-load Prism.js languages
- Cache project structure analysis
- Debounce file selection updates
- Limit max context size

### UX
- Clear visual feedback for selected files
- Context size warnings
- Smooth animations for diff viewer
- Keyboard shortcuts for common actions

### Error Handling
- Handle malformed AI responses gracefully
- Validate all file operations
- Show helpful error messages
- Allow manual correction of AI suggestions

---

## 📝 Testing Checklist

- [ ] Multi-file context includes correct content
- [ ] Project structure analysis is accurate
- [ ] Multi-file diffs render correctly
- [ ] Syntax highlighting works for all supported languages
- [ ] File creation validates filenames properly
- [ ] Large contexts don't break the chat
- [ ] Mobile responsive design works
- [ ] Dark/light theme compatibility

---

## 🚀 Future Enhancements

- **AI Model Context Caching** - Cache project structure between requests
- **Workspace Folders** - Support multiple project folders
- **Git Integration** - Show git status in file selector
- **AI Code Search** - Let AI search across files for patterns
- **Smart Context Selection** - Auto-select relevant files based on query
- **Diff Apply Partial** - Apply only selected lines from diff
- **File Templates** - AI uses project-specific templates
- **Conversation Branching** - Create alternative suggestions

---

**Document Version:** 1.0  
**Last Updated:** October 9, 2025  
**Author:** AI Development Team
