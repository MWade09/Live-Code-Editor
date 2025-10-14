# Multi-File Project Display Fix

## Overview
Fixed the project detail page (`/projects/[id]`) to properly display multi-file projects instead of showing broken/missing content.

## Problem
The project detail page was designed for single-file projects and attempted to display `project.content` as a string. With the introduction of multi-file projects, `project.content` is now JSONB with structure:
```json
{
  "files": [
    { "name": "index.html", "content": "...", "type": "html", "isMain": true },
    { "name": "styles.css", "content": "...", "type": "css" }
  ],
  "version": "2.0",
  "lastModified": "2025-01-11T..."
}
```

Trying to display this as a string resulted in broken/missing content.

## Solution Implemented

### 1. TypeScript Interfaces (Lines 32-44)
```typescript
interface ProjectFile {
  id?: string
  name: string
  content: string
  type: string
  isMain?: boolean
}

interface ProjectContent {
  files?: ProjectFile[]
  version?: string
  lastModified?: string
}
```

### 2. ProjectPreview Component (Lines 47-142)
Created a new component that:
- Accepts an array of `ProjectFile` objects
- Finds the main HTML file or first HTML file
- Injects CSS files as `<style>` tags before `</head>`
- Injects JS files as `<script>` tags before `</body>`
- Renders the complete project in an iframe
- Handles edge cases (no HTML file, missing tags)

### 3. Component State (Lines 162-163)
```typescript
const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0)
const [showPreview, setShowPreview] = useState<boolean>(false)
```

### 4. Content Parsing Logic (Lines 171-192)
```typescript
const projectFiles = useMemo((): ProjectFile[] => {
  if (!project?.content) return []
  
  // Multi-file format (JSONB)
  if (typeof project.content === 'object' && Array.isArray((project.content as ProjectContent).files)) {
    return (project.content as ProjectContent).files || []
  }
  
  // Legacy single-file format (string)
  if (typeof project.content === 'string') {
    return [{
      name: `${project.title || 'index'}.${project.language?.toLowerCase() || 'html'}`,
      content: project.content,
      type: project.language?.toLowerCase() || 'html',
      isMain: true
    }]
  }
  
  return []
}, [project?.content, project?.title, project?.language])
```

This `useMemo` hook ensures backward compatibility with legacy single-file projects.

### 5. Updated copyCode Function (Lines 345-367)
```typescript
const copyCode = async () => {
  if (projectFiles.length === 0) return
  
  setCopying(true)
  try {
    let textToCopy: string
    
    if (projectFiles.length === 1) {
      // Single file - just copy its content
      textToCopy = projectFiles[0].content
    } else {
      // Multi-file - copy all files with separators
      textToCopy = projectFiles.map(file => 
        `// ===== ${file.name} =====\n${file.content}`
      ).join('\n\n')
    }
    
    await navigator.clipboard.writeText(textToCopy)
    setTimeout(() => setCopying(false), 2000)
  } catch (error) {
    console.error('Error copying code:', error)
    setCopying(false)
  }
}
```

### 6. New UI Elements (Lines 1245-1345)
Replaced the single code display section with:

**Header with Preview Toggle:**
- Shows file count badge for multi-file projects
- Preview toggle button (only shown if HTML files exist)
- Updated Copy Code button

**File Tabs:**
- Only displayed for multi-file projects (2+ files)
- Tab per file with icon and filename
- Active tab highlighted with border
- Horizontal scroll for many files

**Preview/Code Toggle:**
- Preview mode: Shows iframe with full project rendered
- Code mode: Shows syntax-highlighted code with line numbers
- Preserves selected file when switching modes

**Code Display:**
- Uses `projectFiles[selectedFileIndex]` instead of `project.content`
- Automatically detects file type for syntax highlighting
- Shows "No code content available" for empty projects
- Falls back to project.language for type detection

## Benefits

### ✅ Backward Compatibility
- Legacy single-file projects still work
- Automatically converts string content to single-file array
- No database migration needed

### ✅ Multi-File Support
- Displays all project files with tabs
- Live preview renders HTML + CSS + JS together
- Copy function includes all files with separators

### ✅ User Experience
- Preview toggle for visual feedback
- Tab navigation between files
- Clear file count indicator
- Responsive design (horizontal scroll for many files)

### ✅ Code Quality
- TypeScript interfaces for type safety
- useMemo for performance optimization
- Error handling in preview component
- Sandbox iframe for security

## Testing Checklist

- [ ] Legacy single-file projects display correctly
- [ ] Multi-file projects show all files in tabs
- [ ] Switching tabs updates code display
- [ ] Preview toggle button only shows for HTML projects
- [ ] Preview renders HTML + CSS + JS correctly
- [ ] Copy code works for single-file projects
- [ ] Copy code works for multi-file projects (with separators)
- [ ] File count badge shows correct number
- [ ] Syntax highlighting works per file type
- [ ] Mobile responsive (tabs scroll horizontally)
- [ ] Empty projects show friendly message
- [ ] Projects without HTML show fallback in preview

## Files Modified
- `website/src/app/projects/[id]/page.tsx` - Complete multi-file display implementation

## Related Systems
- **ProjectSyncManager.js** - Already exports multi-file format
- **Preview.js** - Editor preview system (same logic as ProjectPreview component)
- **Database Schema** - `projects.content` is JSONB
- **Editor** - Already loads and saves multi-file projects

## Next Steps (Optional Enhancements)
1. Add file tree view for projects with many files (5+)
2. Add full-screen preview mode
3. Add download all files as ZIP
4. Add individual file download buttons
5. Show file sizes in tabs
6. Add search within files
7. Add collapsible file sections
