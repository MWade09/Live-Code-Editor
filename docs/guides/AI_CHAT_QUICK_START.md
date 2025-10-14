# AI Chat Features - Quick Start Guide

A quick reference for the 5 Enhanced AI Chat features in the Live Editor.

---

## 🎯 Quick Reference

### 1. Multi-File Context
**Purpose:** Include multiple files in your AI request for better context

**How to Use:**
1. Click **"Select Files for Context"** button in chat panel
2. Check boxes next to files you want AI to see
3. Watch the context size indicator (stay under 100KB)
4. Send your AI request - selected files are automatically included

**Example Request:**
> "I've selected Header.js and styles.css. How can I make the header responsive?"

**Tips:**
- Select only relevant files to save tokens
- Uncheck files if you hit the 100KB limit
- File list auto-updates when you add/remove files

---

### 2. Project-Wide Context
**Purpose:** AI automatically understands your entire project structure

**How to Use:**
1. Click the **toggle button** in chat header (looks like 📁)
2. Button turns blue when active
3. All AI requests now include project analysis

**What AI Sees:**
- Framework detected (React, Vue, Angular, etc.)
- File structure tree
- Dependencies from package.json
- Import relationships between files

**Example Request:**
> "Where should I add authentication in this React app?"
> *(AI knows it's React and sees your folder structure)*

**Tips:**
- Leave it on for general project questions
- Turn off for simple code questions to save tokens

---

### 3. Multi-File Edit Suggestions
**Purpose:** AI can edit multiple files at once with visual diff preview

**How to Use:**
1. Ask AI to make changes: *"Add dark mode to the app"*
2. AI responds with `<file-edit>` tags for each file
3. **Diff viewer automatically appears**
4. Review each file's changes (red = removed, green = added)
5. Click **"Apply"** for files you want, **"Skip"** for others
6. Or click **"Apply All"** to accept everything

**Example Request:**
> "Split the Button component into Button.js and Button.css"

**AI Response Format:**
```html
<file-edit>
filename: Button.js
action: modify
```javascript
import './Button.css';
export function Button() { ... }
```
</file-edit>

<file-edit>
filename: Button.css
action: create
```css
.button { ... }
```
</file-edit>
```

**Tips:**
- Review each file before applying
- You can skip some edits and apply others
- Changes integrate with undo/redo system

---

### 4. Syntax-Highlighted Code Blocks
**Purpose:** Beautiful, readable code with copy functionality

**How to Use:**
- Just ask AI for code - highlighting happens automatically!
- Click **"Copy"** button to copy code to clipboard
- Look for the language badge (e.g., "JAVASCRIPT")

**Supported Languages:**
- JavaScript / TypeScript
- JSX / TSX (React)
- HTML / CSS
- Python
- JSON, Markdown, Bash

**Example Request:**
> "Show me a React component for a login form"

**Features:**
- ✅ Automatic language detection
- ✅ Line numbers
- ✅ Dark theme compatible
- ✅ Copy button with confirmation
- ✅ Language badge in header

**Tips:**
- Copy button shows "Copied!" for 2 seconds
- Preview collapses to first 10 lines (click "Show Full Code" to expand)

---

### 5. AI File Creation
**Purpose:** AI creates new files directly in your project

**How to Use:**
1. Ask AI to create files: *"Create a new Header component"*
2. AI responds with `<create-file>` tags
3. **Preview dialog automatically appears**
4. Review each file:
   - Click **"Preview"** to see the code
   - Click **"Create"** to add to your project
5. Or click **"Create All Files"** for batch creation

**Example Request:**
> "Create a utils folder with date formatting helpers"

**AI Response Format:**
```html
<create-file>
filename: src/utils/dateHelpers.js
description: Date formatting utilities
```javascript
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}
```
</create-file>
```

**Safety Features:**
- 🟡 **"FILE EXISTS"** badge warns if file already exists
- 🔄 **"Overwrite"** button text for existing files
- 👁️ **Preview** before creating
- ⏭️ Can skip individual files

**Tips:**
- Check "FILE EXISTS" warnings before overwriting
- Preview shows syntax-highlighted code
- Files appear immediately in file explorer

---

## 💡 Pro Tips

### Combining Features
Use multiple features together for powerful workflows:

1. **New Feature Development:**
   ```
   1. Enable project context toggle
   2. Ask AI: "I want to add user authentication"
   3. AI creates new files (auth.js, login component)
   4. AI suggests edits to existing files (App.js, routes)
   5. Review in diff viewer, apply changes
   ```

2. **Refactoring:**
   ```
   1. Select files you want to refactor
   2. Ask AI: "Split this into smaller components"
   3. Review multi-file edits
   4. Apply all changes at once
   ```

3. **Bug Fixing:**
   ```
   1. Select the buggy file + related files
   2. Ask AI: "Fix the login validation issue"
   3. AI suggests targeted changes
   4. Review diff, apply fix
   ```

### Context Management

**When to use file selection:**
- ✅ Specific questions about certain files
- ✅ When you hit the 100KB context limit
- ✅ Want AI to focus on particular code

**When to use project context:**
- ✅ General questions about architecture
- ✅ "Where should I add X feature?"
- ✅ Framework-specific questions
- ✅ Understanding import relationships

**When to use both:**
- ✅ Complex refactoring across related files
- ✅ Feature development that affects multiple areas
- ✅ When you need both breadth and depth

---

## 🚨 Common Issues

### "Context size too large"
- **Solution:** Uncheck some files in file selector
- **Limit:** 100KB maximum
- **Tip:** Select only the most relevant files

### "File creation failed"
- **Check:** Do you have permission to create files?
- **Tip:** Try creating manually to diagnose issue

### "Diff viewer not showing"
- **Check:** AI must use exact `<file-edit>` format
- **Tip:** Ask AI: *"Use the file-edit format to suggest changes"*

### "Syntax highlighting not working"
- **Check:** Internet connection (Prism.js loads from CDN)
- **Fallback:** Plain text shown if Prism unavailable

### "Copy button not working"
- **Check:** Browser clipboard permissions
- **Tip:** Use HTTPS in production for clipboard API

---

## 📝 Example Workflows

### Creating a New Component

```plaintext
You: "Create a Card component with a header, body, and footer. 
      Also create its CSS file and a test file."

AI: [Creates 3 files with <create-file> tags]

Preview Dialog:
✅ Card.js (Preview: React component)
✅ Card.css (Preview: Styled card layout)
✅ Card.test.js (Preview: Unit tests)

You: [Click "Create All Files"]

Result: 3 new files in your project ✨
```

### Refactoring Across Files

```plaintext
You: [Select App.js, Header.js, Footer.js]
     "Extract the navigation into a separate component"

AI: [Proposes changes with <file-edit> tags]

Diff Viewer:
📝 App.js (Remove navigation code)
📝 Header.js (Update import)
✨ Nav.js (New navigation component)

You: [Review diffs, click "Apply All"]

Result: Clean refactor across 3 files ✨
```

### Understanding Existing Code

```plaintext
You: [Enable project context + select AuthManager.js]
     "How does the authentication system work?"

AI: "Based on your React project structure and the AuthManager.js file,
     your authentication works like this:
     1. AuthManager handles login/logout
     2. Uses JWT tokens stored in localStorage
     3. Integrates with Supabase backend
     [detailed explanation...]"

Result: Context-aware explanation ✨
```

---

## 🎓 Learning More

- **Full Documentation:** See `ENHANCED_AI_CHAT_FEATURES.md`
- **Code Examples:** Look at the implementation in `AIManager.js`
- **Testing:** Try the testing checklist in full docs

---

## ✨ Summary

**5 Features, Seamless Integration:**

1. 📁 **Multi-File Context** - Select files for AI to see
2. 🌲 **Project Context** - AI understands your structure  
3. 📝 **Multi-File Edits** - Review and apply changes  
4. 🎨 **Syntax Highlighting** - Beautiful code blocks  
5. ✨ **File Creation** - AI creates new files  

**Result:** A powerful AI-assisted development environment! 🚀

Happy coding! 💻
