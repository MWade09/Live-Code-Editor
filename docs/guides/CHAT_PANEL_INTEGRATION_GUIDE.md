# Chat Panel Integration - Usage Guide

## Overview
All 5 Enhanced AI Chat features are now fully integrated into the **Chat Panel** and work with both **Chat Mode** and **Agent Mode**.

---

## 🎯 How to Access Features

### 1. File Context Selector
**Location:** Chat panel header (📄 icon button with badge)

**How to Use:**
1. Click the **file icon button** in the chat header
2. A dropdown appears showing all your project files
3. **Check the boxes** next to files you want AI to see
4. The badge shows how many files are selected (e.g., "3")
5. Context size is tracked at the bottom (max 100KB)

**When to Use:**
- AI needs to understand multiple files
- You're asking about relationships between files
- You want AI to suggest changes considering multiple files

---

### 2. Project Context Toggle
**Location:** Chat panel header (🌲 sitemap icon with ~2KB badge)

**How to Use:**
1. Click the **sitemap icon button** in the chat header
2. Button turns **blue** when active
3. All AI requests now include:
   - Project file structure
   - Detected framework (React, Vue, etc.)
   - Dependencies from package.json
   - File relationships (imports/exports)

**When to Use:**
- Questions about overall project architecture
- "Where should I add X feature?"
- Framework-specific questions
- Understanding project organization

---

### 3. Chat Mode vs Agent Mode

#### 💬 **Chat Mode** (Default)
- **Purpose:** Conversation, brainstorming, Q&A
- **Behavior:** 
  - AI responds with explanations and code suggestions
  - Code appears with syntax highlighting
  - You manually copy/use the code
  - Can include multi-file edit proposals
  - Can suggest creating new files

**Example:**
> "How should I structure my authentication system?"

**AI Response:**
- Explanation of auth patterns
- Code examples with syntax highlighting
- May propose multi-file changes via diff viewer
- May suggest creating new files

---

#### 🤖 **Agent Mode** 
- **Purpose:** Direct file editing
- **Behavior:**
  - AI **automatically edits** your current file
  - Changes are applied immediately
  - File is saved and editor updates
  - Best for quick modifications

**Example:**
> "Add error handling to this function"

**AI Response:**
- Analyzes current file
- Generates updated code
- **Automatically applies changes** to the file
- Shows success message

---

### 4. Multi-File Edit Proposals

**How It Works:**
1. Ask AI to make changes across multiple files
2. AI responds with `<file-edit>` tags
3. **Diff viewer automatically appears** as a modal
4. Review each file's changes:
   - **Red lines** = removed code
   - **Green lines** = added code
5. Click **"Apply"** for individual files or **"Apply All"**

**Example Request:**
> "Split the Button component into Button.js and Button.css"

**What Happens:**
- Diff viewer shows both files
- You see exactly what changes
- Apply selectively or all at once

---

### 5. File Creation Proposals

**How It Works:**
1. Ask AI to create new files
2. AI responds with `<create-file>` tags
3. **Preview dialog automatically appears**
4. Review each file:
   - Click **"Preview"** to see code (with syntax highlighting)
   - See file size and type
   - Warning if file already exists
5. Click **"Create"** for individual files or **"Create All Files"**

**Example Request:**
> "Create a utils.js file with date formatting helpers"

**What Happens:**
- Preview dialog shows the proposed file
- You can review the code
- Create with one click
- File appears in file explorer

---

### 6. Syntax-Highlighted Code Blocks

**Automatic Features:**
- All code in AI responses is **syntax highlighted**
- **Language badge** shows detected language (JAVASCRIPT, PYTHON, etc.)
- **Copy button** for easy copying
- Supports: JS, TS, JSX, TSX, Python, HTML, CSS, JSON, Markdown, Bash

**No action needed** - happens automatically!

---

## 🔄 Typical Workflows

### Workflow 1: Understanding Existing Code
```
1. Enable Project Context (sitemap icon)
2. Select relevant files (file icon)
3. Switch to Chat Mode
4. Ask: "How does the authentication flow work?"

Result: AI sees your project structure + selected files
```

---

### Workflow 2: Quick File Edit
```
1. Open the file you want to edit
2. Switch to Agent Mode (🤖)
3. Type: "Add error handling"

Result: AI edits file automatically
```

---

### Workflow 3: Multi-File Refactor
```
1. Select files involved in refactor
2. Enable Project Context
3. Chat Mode: "Extract authentication logic into separate files"

Result: 
- AI proposes creating new files (preview dialog)
- AI proposes changes to existing files (diff viewer)
- You review and apply
```

---

### Workflow 4: New Feature Development
```
1. Enable Project Context
2. Chat Mode: "Add a user profile page"

Result:
- AI suggests creating new files (ProfilePage.js, etc.)
- AI suggests edits to existing files (routes, navigation)
- Preview and apply changes
```

---

## 🎨 Visual Indicators

### Header Buttons
- **📄 File Context** - Badge shows count (0, 3, etc.)
- **🌲 Project Context** - Blue when active, grey when off
- **💬 Chat Mode** - Blue when active
- **🤖 Agent Mode** - Blue when active

### Context Size Warnings
- **Green (< 50KB)** - Good, plenty of room
- **Yellow (50-100KB)** - Warning, approaching limit
- **Red (> 100KB)** - Error, too much context

### Code Blocks
- **Language Badge** - Top right (e.g., "JAVASCRIPT")
- **Copy Button** - Click to copy code
- **Syntax Colors** - Green (strings), Purple (keywords), etc.

---

## 💡 Pro Tips

### 1. Combine Features
Enable both Project Context + File Selection for maximum context:
- Project Context: Gives AI the big picture
- File Selection: Gives AI specific details

### 2. Use Agent Mode for Speed
For simple edits, Agent Mode is faster:
- No need to copy/paste code
- Changes apply instantly
- Great for small fixes

### 3. Use Chat Mode for Planning
For complex changes, Chat Mode gives you control:
- Review proposals before applying
- Understand WHY changes are needed
- Apply changes selectively

### 4. Check File Exists Warnings
When creating files, the dialog warns you if a file exists:
- **Yellow "FILE EXISTS" badge**
- Button says "Overwrite" instead of "Create"
- Be careful not to accidentally overwrite important files

### 5. Preview Before Applying
Always preview multi-file edits and file creations:
- Diff viewer shows exact changes
- File creation dialog shows full code
- Syntax highlighting helps spot issues

---

## 🚨 Troubleshooting

### "Context size too large"
**Solution:** Uncheck some files or disable project context

### Features not working
**Check:**
1. Is the chat panel visible?
2. Do you have an API key (or using free models)?
3. Are the buttons in the header?
4. Check browser console for errors (F12)

### Syntax highlighting not showing
**Check:**
1. Internet connection (Prism.js loads from CDN)
2. Browser console for errors
3. Code should auto-highlight - no action needed

### Multi-file edits not appearing
**Make sure:**
1. AI is using the `<file-edit>` tag format
2. You can tell AI: "Use the file-edit format to suggest changes"

### File creation not working
**Make sure:**
1. AI is using the `<create-file>` tag format
2. You can tell AI: "Create new files using the create-file format"

---

## 📋 Summary Checklist

Before testing, verify you can:

- [ ] See the file context button (📄 icon) in chat header
- [ ] See the project context button (🌲 icon) in chat header  
- [ ] Click file context button and see file list
- [ ] Check files and see count badge update
- [ ] Click project context and see it turn blue
- [ ] Switch between Chat/Agent modes
- [ ] Send a message and see syntax highlighting
- [ ] See copy button on code blocks
- [ ] Ask for multi-file changes and see diff viewer
- [ ] Ask to create files and see preview dialog

---

## 🎉 You're Ready!

All 5 features are now integrated and ready to use:

1. ✅ **Multi-File Context** - Select files in chat header
2. ✅ **Project Context** - Toggle in chat header
3. ✅ **Multi-File Edits** - Automatic diff viewer
4. ✅ **Syntax Highlighting** - Automatic code highlighting
5. ✅ **File Creation** - Automatic preview dialog

**Start testing and enjoy your enhanced AI assistant!** 🚀
