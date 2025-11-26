# Editor Save & AI Usage Display - Implementation Plan

## Issues Identified

### 1. ❌ Save Button Not Visible
**Problem:** The Save button IS being created in the code, but it's only added when editing a project loaded from the website (`?project=id` URL parameter). When creating a new project or working standalone, the save button doesn't appear.

**Root Cause:** Save button creation is inside the `if (projectId)` block at line 334 in app.js

**Solution:** Always show the Save button, but adapt its behavior based on context

### 2. ⚠️ "Unsaved Changes" Warning on Navigation
**Problem:** The `beforeunload` event listener (line 1581) checks if any files are "dirty" and shows a warning. Even with auto-save running, the dirty flags aren't being cleared properly.

**Root Cause:** Auto-save clears dirty flags only on successful save, but the timing might be off or auto-save might fail silently

**Solution:** 
- Ensure auto-save clears dirty flags on success
- Add visual feedback for save status
- Make auto-save more reliable

### 3. ❌ No AI Usage Display
**Problem:** AI usage is being tracked in the database (`ai_usage` table) and logged via the `/api/ai/premium` endpoint, but there's no user-facing page to view this data.

**Current State:**
- ✅ Backend tracking works (tokens, cost, markup all logged)
- ✅ Database table exists
- ✅ RLS policies allow users to view their own usage
- ❌ No frontend UI to display this data

**Solution:** Create a usage dashboard page

---

## Implementation Tasks

### Task 1: Fix Save Button Visibility ✅ Priority 1

**Changes needed in `/website/public/editor/js/app.js`:**

1. Move save button creation outside of the `if (projectId)` block
2. Always show save button in header
3. Adapt behavior:
   - If editing website project → save to database
   - If standalone/new project → download JSON or prompt to sign in

**Code Location:** Lines 330-480

### Task 2: Improve Auto-Save & Clear Dirty Flags ✅ Priority 1

**Changes needed:**

1. Make auto-save more aggressive (save after every change with 2-second debounce)
2. Always clear dirty flags on successful save
3. Add visual indicator showing "Saved" status
4. Clear dirty flag immediately after auto-save succeeds

**Code Location:** Lines 490-520 (auto-save hook)

### Task 3: Add Ctrl+S Keyboard Shortcut ✅ Priority 2

**Changes needed:**

1. Add global keyboard listener for Ctrl+S / Cmd+S
2. Trigger save button click
3. Prevent default browser save dialog

**Code Location:** Add near keyboard manager initialization

### Task 4: Create AI Usage Dashboard Page 🎯 Priority 3

**New files to create:**

```
website/src/app/profile/usage/
├── page.tsx          ← Main usage dashboard
└── loading.tsx       ← Loading state
```

**Features:**
- Display total tokens used (all time + this month)
- Show cost breakdown (base cost, markup, total)
- List recent AI requests with model and timestamp
- Chart showing usage over time (optional)
- Export usage data as CSV (optional)

### Task 5: Add Usage Widget to Dashboard 🎯 Priority 4

**File to modify:** `website/src/components/dashboard/dashboard-content.tsx`

**Changes:**
- Add a card showing current month AI usage
- Display: Tokens used, Cost, Remaining quota (if applicable)
- Link to full usage page

---

## Detailed Implementation

### 1. Save Button Fix

**Before:**
```javascript
// Line 330 - Inside if (projectId) block
if (controls && themeToggle) {
    const saveBtn = document.createElement('button');
    // ... save button code
    controls.insertBefore(saveBtn, themeToggle);
}
```

**After:**
```javascript
// Move save button creation to always run
const controls = document.querySelector('header .controls .view-controls');
const themeToggle = document.getElementById('theme-toggle');

if (controls && themeToggle) {
    // Always create save button
    const saveBtn = document.createElement('button');
    saveBtn.id = 'project-save-btn';
    saveBtn.className = 'deploy-btn';
    saveBtn.title = 'Save Project (Ctrl+S)';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> <span>Save</span>';
    
    saveBtn.addEventListener('click', async () => {
        if (projectId && projectSync) {
            // Save to website/database
            const result = await projectSync.saveToWebsite();
            // Handle result...
        } else {
            // Download as JSON or prompt sign-in
            promptSaveAction();
        }
    });
    
    controls.insertBefore(saveBtn, themeToggle);
}
```

### 2. Auto-Save Improvement

**Update auto-save to clear dirty flags:**

```javascript
// Line 490 - Auto-save hook
editor.codeMirror.on('change', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        if (!projectSync) return;
        
        const result = await projectSync.saveToWebsite();
        if (result.ok) {
            // ✅ Clear dirty flags on success
            const openFiles = fileManager.getOpenTabFiles();
            openFiles.forEach(f => fileManager.clearDirty(f.id));
            renderFileTabs();
            
            // Update save button to show "Saved"
            const saveBtn = document.getElementById('project-save-btn');
            if (saveBtn) {
                saveBtn.querySelector('span').textContent = 'Saved ✓';
                setTimeout(() => {
                    saveBtn.querySelector('span').textContent = 'Save';
                }, 2000);
            }
        }
    }, 2000); // 2 second debounce
});
```

### 3. Keyboard Shortcut

**Add near line 1700:**

```javascript
// Ctrl+S / Cmd+S to save
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const saveBtn = document.getElementById('project-save-btn');
        if (saveBtn) saveBtn.click();
    }
});
```

### 4. AI Usage Dashboard Page

**Create: `website/src/app/profile/usage/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UsagePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch usage data
  const { data: usage } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Calculate totals
  const totalTokens = usage?.reduce((sum, r) => sum + r.tokens_used, 0) || 0
  const totalCost = usage?.reduce((sum, r) => sum + r.total_usd, 0) || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI Usage</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-slate-400 text-sm mb-2">Total Requests</h3>
          <p className="text-3xl font-bold">{usage?.length || 0}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-slate-400 text-sm mb-2">Total Tokens</h3>
          <p className="text-3xl font-bold">{totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-slate-400 text-sm mb-2">Total Cost</h3>
          <p className="text-3xl font-bold">${totalCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Recent Usage Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Model</th>
              <th className="px-6 py-3 text-right text-sm font-medium">Tokens</th>
              <th className="px-6 py-3 text-right text-sm font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {usage?.map((record) => (
              <tr key={record.id} className="border-t border-slate-700">
                <td className="px-6 py-4 text-sm">
                  {new Date(record.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm">{record.model}</td>
                <td className="px-6 py-4 text-sm text-right">
                  {record.tokens_used.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  ${record.total_usd.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### 5. Dashboard Widget

**Add to `dashboard-content.tsx` around line 330:**

```tsx
{/* AI Usage Card */}
<div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6">
  <div className="flex items-center gap-3 mb-4">
    <Zap className="w-6 h-6 text-cyan-400" />
    <h3 className="font-semibold text-white">AI Usage This Month</h3>
  </div>
  <div className="space-y-2 mb-4">
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">Tokens:</span>
      <span className="text-white font-medium">{monthlyTokens.toLocaleString()}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">Cost:</span>
      <span className="text-white font-medium">${monthlyCost.toFixed(2)}</span>
    </div>
  </div>
  <Link
    href="/profile/usage"
    className="block w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all text-center text-sm"
  >
    View Full Usage
  </Link>
</div>
```

---

## Priority Order

1. **🔥 Critical - Save Button** (30 minutes)
   - Fix visibility issue
   - Add keyboard shortcut
   
2. **🔥 Critical - Auto-Save** (15 minutes)
   - Clear dirty flags properly
   - Prevent false warnings

3. **📊 High - Usage Dashboard** (2 hours)
   - Create usage page
   - Add dashboard widget

4. **✨ Nice-to-Have** (Future)
   - Usage charts/graphs
   - Export to CSV
   - Usage alerts/notifications

---

## Testing Checklist

- [ ] Save button appears in header
- [ ] Clicking save button saves project
- [ ] Ctrl+S triggers save
- [ ] Auto-save runs after edits (2 sec delay)
- [ ] No "unsaved changes" warning after auto-save
- [ ] Back button navigation works without warning
- [ ] Usage page loads at /profile/usage
- [ ] Usage data displays correctly
- [ ] Dashboard widget shows current month data

---

**Estimated Total Time:** 3-4 hours for complete implementation
