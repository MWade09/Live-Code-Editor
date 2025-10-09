# Save Button Fix - Variable Scope Error

**Date:** October 6, 2025  
**Error:** `ReferenceError: project is not defined at ProjectSyncManager.js:67`

---

## Root Cause

### JavaScript Scope Issue ❌

**File:** `website/public/editor/js/modules/ProjectSyncManager.js`  
**Line:** 67

**Problem:**
```javascript
try {
  const res = await fetch(url, { headers: { ...authHeader } })
  const project = await res.json()  // ❌ Declared INSIDE try block
  
  // ... use project ...
  
} catch (e) {
  console.warn('Failed to import project structure', e)
}

this.currentProject = project  // ❌ LINE 67: 'project' is out of scope!
```

The variable `project` was declared with `const` inside the `try` block, making it block-scoped. When line 67 tried to access it outside the try block, it was undefined, causing a `ReferenceError`.

---

## Fix Applied ✅

### Solution: Declare Variable Outside Try Block

**Before:**
```javascript
async loadWebsiteProject(projectId) {
  // ...
  try {
    const res = await fetch(url, { headers: { ...authHeader } })
    const project = await res.json()  // ❌ Block scoped
    // ...
  } catch (e) {
    console.warn('Failed to import project structure', e)
  }
  
  this.currentProject = project  // ❌ ReferenceError!
  this.syncEnabled = true
  return project
}
```

**After:**
```javascript
async loadWebsiteProject(projectId) {
  // ...
  let project = null;  // ✅ Declare outside try block
  
  try {
    const res = await fetch(url, { headers: { ...authHeader } })
    project = await res.json()  // ✅ Assign to outer variable
    // ...
  } catch (e) {
    console.warn('Failed to import project structure', e)
  }
  
  this.currentProject = project  // ✅ Now accessible!
  this.projectId = projectId      // ✅ Also store project ID
  this.syncEnabled = true
  return project
}
```

---

## Additional Improvement ✅

### Store Project ID Separately

Added `this.projectId = projectId` to store the project ID independently. This ensures:
- Save button code can check `if (projectSync.projectId)` to determine if in project mode
- Even if project loading fails, we still have the ID
- More robust error handling

---

## Expected Behavior After Fix

### On Page Load with `?project=ID`:

1. ✅ Project loads successfully from API
2. ✅ `this.currentProject` contains project data
3. ✅ `this.projectId` contains the project ID
4. ✅ `this.syncEnabled = true`
5. ✅ Save and Sync buttons appear in header
6. ✅ Auto-save starts working
7. ✅ No more `ReferenceError`

### Console Logs (Expected):
```
[ProjectSync] Using same-origin API: /api
[ProjectSync] Loading project from: /api/projects/[ID]
[ProjectSync] Loaded project from website
[SaveButton] Controls element: <div class="view-controls">...
[SaveButton] Theme toggle: <button id="theme-toggle">...
[SaveButton] Inserting save button: <button id="project-save-btn">...
[SaveButton] Buttons inserted successfully
```

---

## Testing Steps

1. **Push Changes**
   ```bash
   git add .
   git commit -m "Fix: ProjectSyncManager variable scope error"
   git push origin main
   ```

2. **Hard Refresh Browser**
   - Press `Ctrl+Shift+R` (Windows/Linux)
   - Or `Cmd+Shift+R` (Mac)
   - This clears cached JavaScript

3. **Open Project**
   - Go to your profile
   - Click on a project
   - Should redirect to editor with `?project=ID&site=...`

4. **Verify in Console**
   - Press F12 to open DevTools
   - Check Console tab
   - Should see successful load messages
   - NO `ReferenceError`

5. **Check Header**
   - Save button should appear
   - Sync button should appear
   - Both should be clickable

6. **Test Saving**
   - Make a change in the editor
   - Wait 2 seconds (auto-save triggers)
   - Should see "Saved ✓" appear on button
   - Or click Save button manually

---

## Files Changed

### `website/public/editor/js/modules/ProjectSyncManager.js`
- **Line 43:** Added `let project = null;` before try block
- **Line 52:** Changed `const project` to `project = ` (assignment)
- **Line 70:** Added `this.projectId = projectId`

---

## Why This Happened

This is a classic JavaScript scope error. The `const` and `let` keywords create block-scoped variables, meaning they only exist within the `{ }` block where they're declared. 

The original code tried to use a variable outside its scope:
```javascript
try {
  const x = 5;  // Only exists inside try block
}
console.log(x);  // ❌ ReferenceError: x is not defined
```

The fix moves the declaration outside:
```javascript
let x = null;   // Exists in function scope
try {
  x = 5;        // Assignment works
}
console.log(x); // ✅ Works! x = 5
```

---

## Summary

**Problem:** Variable `project` declared inside `try` block, but used outside it  
**Solution:** Declare `let project = null` outside try block  
**Bonus:** Also store `this.projectId` for better reliability  
**Result:** Project loads successfully, save button appears and works!  

This should completely fix the save button issue! 🎉
