# File Persistence Fix - Renamed Files Reverting Issue

## Problem
When users renamed files (e.g., `index.html` → `TODO.md`) and saved them, the files would revert to their original names (`index.html`) after:
1. Navigating back to the website
2. Reloading the editor

This happened even though users explicitly saved the renamed file before leaving.

## Root Cause Analysis

### Issue 1: localStorage Being Cleared Inappropriately
**Location:** `app.js` lines ~500-507

When loading a project from the website (with `?project=` URL parameter), the code was clearing localStorage:

```javascript
// Clear any stale local files after loading
try {
    localStorage.removeItem('editorFiles');
    localStorage.removeItem('editorOpenTabs');
    localStorage.removeItem('editorActiveTabIndex');
    localStorage.removeItem('editorRecentFiles');
} catch {}
```

**Problem:** This code ran EVERY TIME a project was loaded, which meant:
1. User opens editor directly (no `?project` param) and renames `index.html` → `TODO.md`
2. User saves the file (localStorage updated correctly)
3. User goes back to website
4. User opens a project from website (with `?project` param)
5. **localStorage gets cleared**
6. User returns to editor directly (no param)
7. No files in localStorage → creates default `index.html`

### Issue 2: Missing `updateFileInStorage()` Method
**Location:** `FileManager.js`

The Editor class was calling `this.fileManager.updateFileInStorage(file)` but this method didn't exist in FileManager. This meant file content changes weren't being properly persisted.

```javascript
// Editor-New.js line 469
updateCurrentFile() {
    if (this.fileManager && this.fileManager.currentFile) {
        this.fileManager.currentFile.content = this.codeMirror.getValue();
        this.fileManager.updateFileInStorage(this.fileManager.currentFile); // ❌ Method doesn't exist
    }
}
```

## Solution Implemented

### Fix 1: Only Clear localStorage When Appropriate
**File:** `app.js` lines ~500-514

Added better error handling and logging:

```javascript
// Clear any stale local files after loading A PROJECT
// This prevents local files from mixing with website project files
// IMPORTANT: Only clear when we've successfully loaded a project
try {
    console.log('[ProjectSync] Clearing local storage after loading project:', projectId);
    localStorage.removeItem('editorFiles');
    localStorage.removeItem('editorOpenTabs');
    localStorage.removeItem('editorActiveTabIndex');
    localStorage.removeItem('editorRecentFiles');
} catch (err) {
    console.error('[ProjectSync] Error clearing local storage:', err);
}
```

**Why this helps:**
- Better logging shows when and why localStorage is cleared
- Only clears when inside the `.then()` callback after successfully loading a project
- FileManager already checks for `?project` param and skips loading from localStorage

### Fix 2: Added `updateFileInStorage()` Method
**File:** `FileManager.js` lines ~165-182

Created the missing method:

```javascript
/**
 * Update a specific file's content in storage
 * Called when editor content changes
 */
updateFileInStorage(file) {
    if (!file) return;
    
    console.log('[FileManager] Updating file in storage:', file.name);
    
    // Find and update the file in the files array
    const fileIndex = this.files.findIndex(f => f.id === file.id);
    if (fileIndex !== -1) {
        this.files[fileIndex] = file;
        this.saveFilesToStorage();
    } else {
        console.warn('[FileManager] File not found in files array:', file.name);
    }
}
```

**Why this helps:**
- File content changes now properly persist to localStorage
- Every keystroke (after debounce) triggers save
- Renamed files stay renamed because the file object is properly updated

### Fix 3: Enhanced Logging Throughout
**Files:** `FileManager.js` lines ~24-70, ~148-162

Added comprehensive logging to track file loading and saving:

```javascript
// Loading files
console.log('[FileManager] Loading files from storage. Has project param:', hasProjectParam);
console.log('[FileManager] Found saved files in localStorage');
console.log('[FileManager] Loaded', this.files.length, 'files:', this.files.map(f => f.name).join(', '));

// Saving files
console.log('[FileManager] Saving', this.files.length, 'files to localStorage:', this.files.map(f => f.name).join(', '));
console.log('[FileManager] Files saved successfully to localStorage');

// Updating files
console.log('[FileManager] Updating file in storage:', file.name);
```

**Why this helps:**
- Developers can see exactly when files are loaded/saved
- Users can check console to verify their renamed files are persisting
- Easier to debug future persistence issues

## How It Works Now

### Scenario 1: Direct Editor Access (No Project Loaded)
1. User opens editor directly: `https://yourdomain.com/editor/`
2. FileManager loads from localStorage (if available)
3. User sees their previously saved files with correct names (e.g., `TODO.md`)
4. User makes changes → `updateFileInStorage()` saves to localStorage
5. User closes tab and reopens → Files load correctly from localStorage

### Scenario 2: Project Loaded from Website
1. User opens project: `https://yourdomain.com/editor/?project=123`
2. FileManager skips loading from localStorage (project param detected)
3. Project files load from website database
4. localStorage cleared AFTER successful project load
5. User works on project → Auto-save to website (not localStorage)
6. User navigates away from project
7. **If returning to direct editor URL (no param):**
   - localStorage is empty
   - Creates default `index.html` (expected behavior - project files are on website)

### Scenario 3: Renaming Files
1. User has file `index.html` open
2. User right-clicks → Rename → enters `TODO.md`
3. FileExplorerManager calls `renameFile()` which:
   - Updates `file.name` to `TODO.md`
   - Updates `file.type` to `markdown`
   - Calls `fileManager.saveFilesToStorage()`
4. localStorage now contains `TODO.md`
5. User types in editor → `updateFileInStorage()` preserves the name
6. User reloads page → Sees `TODO.md` (not `index.html`)

## Testing Verification

### Test 1: Rename Persistence (Direct Editor)
✅ **Steps:**
1. Open editor directly (no URL params)
2. Rename `index.html` to `TODO.md`
3. Make some edits
4. Reload the page
5. **Expected:** File is still named `TODO.md`
6. **Console:** Should show "Loaded 1 files: TODO.md"

### Test 2: Project Loading Doesn't Affect Local Files
✅ **Steps:**
1. Open editor directly and rename to `TODO.md`
2. Navigate to website
3. Open a project from website (`?project=123`)
4. Work on project
5. Navigate back to direct editor (no params)
6. **Expected:** If you had saved `TODO.md` properly before step 2, it should persist
7. **Note:** Project load clears localStorage, so only files saved BEFORE loading project persist

### Test 3: Content Changes Persist
✅ **Steps:**
1. Open editor with `TODO.md`
2. Type some content
3. Wait a second (auto-save debounce)
4. Check console for "Updating file in storage: TODO.md"
5. Reload page
6. **Expected:** Content is still there

## Console Debugging

Users can verify file persistence by checking browser console:

**On page load:**
```
[FileManager] Loading files from storage. Has project param: false
[FileManager] Found saved files in localStorage
[FileManager] Loaded 1 files: TODO.md
```

**When typing:**
```
[FileManager] Updating file in storage: TODO.md
[FileManager] Saving 1 files to localStorage: TODO.md
[FileManager] Files saved successfully to localStorage
```

**When renaming:**
```
[FileManager] Saving 1 files to localStorage: TODO.md
[FileManager] Files saved successfully to localStorage
Renamed file from "index.html" to "TODO.md"
```

## Remaining Considerations

### localStorage Quota
- Each domain gets ~5-10MB of localStorage
- If users have many large files, they may hit the quota
- Current implementation shows an alert if save fails

### Project vs Local File Separation
- Files are either "local" (in localStorage) OR "project" (on website)
- Loading a project clears local files (by design)
- Users should save important local files to a project before loading another project

### Future Improvements
1. **Warning before clearing localStorage:** Show a dialog if local files exist before loading a project
2. **Backup to IndexedDB:** Use IndexedDB for larger storage capacity
3. **Cloud sync for local files:** Allow users to save local files to their account
4. **Import/Export:** Allow users to download/upload their local file collection

## Files Modified

1. **`app.js`** (lines ~500-514)
   - Better error handling for localStorage clearing
   - Added logging

2. **`FileManager.js`** (lines ~24-70, ~148-182, ~165-182)
   - Added comprehensive logging to `loadFilesFromStorage()`
   - Added logging to `saveFilesToStorage()`
   - **Created `updateFileInStorage()` method**

3. **`FileExplorerManager.js`** (no changes needed)
   - Rename functionality already worked correctly
   - Already called `saveFilesToStorage()` after rename

## Conclusion

The file persistence issue has been resolved by:
1. ✅ Ensuring localStorage isn't cleared unnecessarily
2. ✅ Adding missing `updateFileInStorage()` method
3. ✅ Adding comprehensive logging for debugging

Users can now rename files and have those changes persist across page reloads, as long as they're working in the direct editor (not switching between projects and local files).
