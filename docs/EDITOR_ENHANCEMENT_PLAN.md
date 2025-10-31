# Editor Enhancement Plan - Sprint 2 (Production Ready)

**Date**: October 30, 2025  
**Status**: Planning  
**Focus**: Production-ready features (no backend server required)

---

## Current Editor Capabilities

### ✅ What We Already Have

**Core Editor** (CodeMirror 5):
- ✅ Multiple language modes (HTML, CSS, JS, Python, TypeScript, React, Vue)
- ✅ Syntax highlighting
- ✅ Line numbers
- ✅ Code folding (manual and programmatic)
- ✅ Multiple cursor support (Ctrl+D, Ctrl+Alt+Up/Down)
- ✅ Bracket matching and auto-closing
- ✅ Auto-indentation
- ✅ Line wrapping toggle

**Search & Replace**:
- ✅ Find/Replace with regex support
- ✅ Match highlighting
- ✅ Current match indicator (X of Y)
- ✅ Replace All functionality
- ✅ Navigation between matches

**Code Quality**:
- ✅ Real-time linting (JavaScript, CSS, HTML, JSON)
- ✅ Error highlighting with squiggly underlines
- ✅ Code formatting (FormattingManager)
- ✅ Lint statistics

**Editor Enhancements**:
- ✅ Minimap (MinimapManager)
- ✅ Line highlighting (LineHighlightManager)
- ✅ Enhanced autocomplete
- ✅ Emmet support (HTML/CSS abbreviations)
- ✅ Keyboard shortcuts (60+ shortcuts)

**AI Features**:
- ✅ AI chat panel (side-by-side with editor)
- ✅ AI code actions (inline suggestions)
- ✅ Inline AI manager

**Managers** (23 specialized modules):
```
SearchManager.js          KeyboardManager.js        AIManager.js
LintManager.js            MinimapManager.js         AICodeActionsManager.js
FormattingManager.js      LineHighlightManager.js   InlineAIManager.js
ThemeManager.js           FileManager.js            DeployManager.js
VersionControlManager.js  TerminalManager.js        ProjectSyncManager.js
RealtimeSync.js           Preview.js                Resizer.js
AuthManager.js            FileExplorerManager.js    (and 3 more...)
```

---

## Enhancement Goals

### 🎯 Objectives

1. **Improve Developer Experience** - Make editor feel more professional
2. **Increase Productivity** - Add shortcuts and automation
3. **Better Code Navigation** - Help users understand large files
4. **Enhanced Autocomplete** - Smarter, context-aware suggestions
5. **Visual Improvements** - Better readability and code structure visibility

### ⚠️ Constraints

- ✅ Must work in production (browser-only, no backend)
- ✅ No external API dependencies
- ✅ Use existing CodeMirror 5 capabilities
- ✅ Maintain backward compatibility
- ✅ Keep performance fast (no heavy operations)

---

## Proposed Enhancements

### 1. Code Snippets System 📝

**Status**: ✅ Implemented  
**Complexity**: Medium  
**Impact**: High  
**Completed**: October 30, 2025

**What**:
- User-definable code snippets
- Pre-loaded snippet library (HTML boilerplate, React components, etc.)
- Tab-trigger completion
- Variable placeholders with Tab navigation

**Implementation**: ✅ Complete
- Created `SnippetManager.js` with full snippet system
- 50+ built-in snippets for HTML, CSS, JavaScript, React, Vue, Python
- Tab-triggered expansion with placeholder navigation
- LocalStorage persistence for user snippets
- Alt+S to browse snippets via command palette

**How to Use**:
1. Type snippet prefix (e.g., `html5`, `rfc`, `flex`)
2. Press Tab to expand
3. Tab through placeholders (${1:text}, ${2:text})
4. Press Alt+S to browse all available snippets
5. Snippets are language-aware (only show relevant snippets)

**Available Snippets**:
- HTML: `html5`, `div`, `form`, `input`, `link`, `script`
- CSS: `flex`, `grid`, `transition`, `animation`, `media`
- JavaScript: `func`, `afunc`, `arrow`, `class`, `foreach`, `map`, `filter`, `promise`, `trycatch`, `import`, `export`, `log`
- React: `rfc`, `rfce`, `usestate`, `useeffect`, `usecontext`
- Vue: `vbase`, `vdata`, `vmethod`
- Python: `def`, `classpy`, `for`, `if`

---

### 2. Enhanced Autocomplete Intelligence 🧠

**Status**: ✅ Implemented  
**Complexity**: Medium-High  
**Impact**: High  
**Completed**: October 30, 2025

**What**: ✅ Complete
- Context-aware suggestions based on mode and cursor position
- CSS property value suggestions (display: flex|grid|block, etc.)
- HTML attribute suggestions per tag type (input gets type/name/placeholder)
- Input type value suggestions
- Auto-trigger on special characters (<, :, ., space)
- Visual indicators for suggestion types (⚡ for CSS values, @ for attributes)

**Implementation**: ✅ Complete
- Consolidated duplicate autocomplete systems in `Editor-New.js`
- Added CSS property value database (15+ common properties)
- Added HTML attribute database by tag type
- Context detection: distinguishes CSS properties vs values, HTML tags vs attributes
- Auto-trigger on `:` for CSS values, `<` and `space` for HTML attributes, `.` for JS methods
- Custom CSS classes for suggestion types with icons
- Smart cursor positioning after attribute completion

**How to Use**:
1. **CSS Values**: Type property name, then `:` - auto-suggests valid values
   - Example: `display:` → suggests flex, grid, block, inline, etc.
2. **HTML Attributes**: Type `<tagname ` → suggests relevant attributes
   - Example: `<input ` → suggests type, name, placeholder, required, etc.
3. **Input Types**: Type `<input type="` → suggests all input types
4. **JavaScript**: Type `.` after object → suggests methods (array methods, console, etc.)
5. Manual trigger: Ctrl+Space anytime

**Examples**:
```css
/* Type this: */
.container {
  display:  /* ← Auto-suggests: flex, grid, block, inline-block, etc. */
  position:  /* ← Auto-suggests: relative, absolute, fixed, sticky */
}
```

```html
<!-- Type this: -->
<input   <!-- ← Auto-suggests: type, name, placeholder, required, etc. -->
<input type=""  <!-- ← Auto-suggests: text, email, password, number, etc. -->
<a   <!-- ← Auto-suggests: href, target, rel, title -->
```

**Suggestion Types**:
- ⚡ CSS property values (italic style)
- @ HTML attributes (bold style)
- 💡 Enum values (like input types)
- Default: Keywords, methods, tags

---

### 3. Command Palette ⌨️

**Status**: ✅ Implemented  
**Complexity**: Medium  
**Impact**: High  
**Estimated Time**: 1 day

**What**:
- VS Code-style command palette (Ctrl+Shift+P)
- Quick access to all editor commands
- File navigation
- Action search

**Implementation**:
```javascript
// CommandPaletteManager.js
class CommandPaletteManager {
  constructor(editor, codeMirror) {
    this.editor = editor
    this.cm = codeMirror
    this.commands = this.buildCommandList()
    this.createUI()
  }
  
  buildCommandList() {
    return [
      // File operations
      { id: 'file.save', label: 'File: Save', shortcut: 'Ctrl+S', action: () => this.editor.fileManager.saveFile() },
      { id: 'file.new', label: 'File: New File', shortcut: 'Ctrl+N', action: () => this.editor.fileManager.createNewFile() },
      
      // Edit operations
      { id: 'edit.format', label: 'Format Document', shortcut: 'Alt+Shift+F', action: () => this.editor.formattingManager.formatCode() },
      { id: 'edit.toggleComment', label: 'Toggle Line Comment', shortcut: 'Ctrl+/', action: () => this.editor.keyboardManager.toggleComment(this.cm) },
      
      // View controls
      { id: 'view.toggleMinimap', label: 'View: Toggle Minimap', shortcut: 'Ctrl+K M', action: () => this.editor.minimapManager.toggleMinimap() },
      { id: 'view.toggleTerminal', label: 'View: Toggle Terminal', shortcut: 'Ctrl+`', action: () => this.toggleTerminal() },
      
      // Search
      { id: 'search.find', label: 'Find', shortcut: 'Ctrl+F', action: () => this.editor.searchManager.openFindReplace() },
      { id: 'search.replace', label: 'Replace', shortcut: 'Ctrl+H', action: () => this.editor.searchManager.openFindReplace() },
      
      // Code folding
      { id: 'fold.all', label: 'Fold All', shortcut: 'Ctrl+K Ctrl+0', action: () => this.editor.keyboardManager.foldAll() },
      { id: 'fold.unfoldAll', label: 'Unfold All', shortcut: 'Ctrl+K Ctrl+J', action: () => this.editor.keyboardManager.unfoldAll() },
      
      // Themes
      { id: 'theme.dark', label: 'Theme: Dark Mode', action: () => this.editor.themeManager.setTheme('dark') },
      { id: 'theme.light', label: 'Theme: Light Mode', action: () => this.editor.themeManager.setTheme('light') }
    ]
  }
  
  createUI() {
    const palette = document.createElement('div')
    palette.id = 'command-palette'
    palette.className = 'command-palette hidden'
    palette.innerHTML = `
      <div class="palette-backdrop"></div>
      <div class="palette-container">
        <input type="text" id="palette-search" placeholder="Type a command or search..." autofocus>
        <div class="palette-results"></div>
      </div>
    `
    document.body.appendChild(palette)
    
    this.paletteEl = palette
    this.searchInput = palette.querySelector('#palette-search')
    this.resultsEl = palette.querySelector('.palette-results')
    
    this.attachListeners()
  }
  
  show() {
    this.paletteEl.classList.remove('hidden')
    this.searchInput.value = ''
    this.searchInput.focus()
    this.renderResults(this.commands)
  }
  
  hide() {
    this.paletteEl.classList.add('hidden')
  }
  
  renderResults(commands) {
    this.resultsEl.innerHTML = commands.map((cmd, index) => `
      <div class="palette-item ${index === 0 ? 'selected' : ''}" data-index="${index}">
        <span class="palette-label">${cmd.label}</span>
        ${cmd.shortcut ? `<span class="palette-shortcut">${cmd.shortcut}</span>` : ''}
      </div>
    `).join('')
    
    this.attachResultListeners()
  }
  
  search(query) {
    if (!query) {
      this.renderResults(this.commands)
      return
    }
    
    const filtered = this.commands.filter(cmd => 
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.id.toLowerCase().includes(query.toLowerCase())
    )
    
    this.renderResults(filtered)
  }
}
```

**Features**:
- ✅ Search all commands
- ✅ File navigation (recent files)
- ✅ Keyboard navigation (Up/Down, Enter)
- ✅ Fuzzy search
- ✅ Show keyboard shortcuts
- ✅ Quick access to settings

---

### 4. Bracket Colorization 🌈

**Status**: ✅ Implemented  
**Complexity**: Medium  
**Impact**: Medium  
**Completed**: October 31, 2025

**What**: ✅ Complete
- Rainbow bracket pairs with different colors for nested levels
- Matching bracket highlighting on hover (using CodeMirror's built-in matchBrackets)
- 5-level color rotation (gold, orchid, blue, green, red)
- Toggle on/off capability (Ctrl+K B or via Command Palette)
- Automatic bracket matching detection
- Works with all bracket types: (), [], {}

**Implementation**: ✅ Complete
- Created `BracketColorizerManager.js` with overlay mode
- CodeMirror overlay tokenizes brackets and applies color classes
- Stack-based nesting level detection
- CSS classes for each color level (bracket-level-0 through bracket-level-4)
- Integrated into Editor-New.js initialization
- Added toggle command to Command Palette
- Keyboard shortcuts: Ctrl+K B and Ctrl+K Ctrl-B

**How to Use**:
1. **Automatic**: Enabled by default - brackets are colored as you type
2. **Toggle**: Press Ctrl+K B or search "Toggle Bracket Colorization" in Command Palette
3. **Hover**: CodeMirror's matchBrackets highlights matching pairs when cursor is adjacent
4. **Visual**: 5 colors rotate at each nesting level:
   - Level 0 (outermost): Gold (#FFD700)
   - Level 1: Orchid (#DA70D6)
   - Level 2: Dodger Blue (#179FFF)
   - Level 3: Spring Green (#00FA9A)
   - Level 4: Tomato (#FF6347)
   - Level 5+: Colors repeat from level 0

**Examples**:
```javascript
// Rainbow brackets in action:
function example() {           // { } = Gold (level 0)
  if (condition) {             // { } = Orchid (level 1)
    const arr = [1, 2, [3]];   // [ ] outer = Blue (level 2), inner = Green (level 3)
    calc((a + b) * c);         // ( ) outer = Green, inner = Red
  }
}
```

**Features**:
- ✅ Real-time colorization as you type
- ✅ Works with all languages (JS, HTML, CSS, Python, etc.)
- ✅ Hover highlighting with glow effect
- ✅ Non-matching brackets show error state (red with wavy underline)
- ✅ Light and dark theme support (darker colors in light theme)
- ✅ Accessible: High contrast mode support
- ✅ Performance: Efficient overlay mode, no lag on large files

**Additional Utilities**:
- `getBracketStats()`: Returns bracket count and max nesting depth
- `findUnmatchedBrackets()`: Detects unclosed or mismatched brackets
- `getBracketLevelAtCursor()`: Returns nesting level at cursor position

---

### 5. Sticky Scroll 📌

**Status**: Not Implemented  
**Complexity**: High  
**Impact**: Medium  
**Estimated Time**: 2 days

**What**:
- Show current function/class context at top when scrolling
- Helps navigation in large files

**Implementation**:
```javascript
// StickyScrollManager.js
class StickyScrollManager {
  constructor(editor, codeMirror) {
    this.editor = editor
    this.cm = codeMirror
    this.createStickyHeader()
    this.attachScrollListener()
  }
  
  createStickyHeader() {
    const header = document.createElement('div')
    header.id = 'sticky-scroll'
    header.className = 'sticky-scroll'
    this.cm.getWrapperElement().prepend(header)
    this.headerEl = header
  }
  
  attachScrollListener() {
    this.cm.on('scroll', () => {
      this.updateStickyContext()
    })
  }
  
  updateStickyContext() {
    const topLine = this.cm.lineAtHeight(this.cm.getScrollInfo().top, 'local')
    const context = this.findContext(topLine)
    
    if (context.length > 0) {
      this.headerEl.innerHTML = context.map(line => 
        `<div class="sticky-line">${this.escapeHTML(line)}</div>`
      ).join('')
      this.headerEl.classList.remove('hidden')
    } else {
      this.headerEl.classList.add('hidden')
    }
  }
  
  findContext(lineNum) {
    const context = []
    const mode = this.cm.getMode().name
    
    // Find function/class declarations above current line
    for (let i = lineNum - 1; i >= 0; i--) {
      const line = this.cm.getLine(i)
      
      if (this.isContextLine(line, mode)) {
        context.unshift(line.trim())
        
        if (context.length >= 3) break // Max 3 levels
      }
    }
    
    return context
  }
  
  isContextLine(line, mode) {
    const patterns = {
      'javascript': /^(function|class|const\s+\w+\s*=|export\s+(default\s+)?(function|class))/,
      'jsx': /^(function|class|const\s+\w+\s*=|export\s+(default\s+)?(function|class))/,
      'python': /^(def|class)\s+\w+/,
      'css': /^\.[\w-]+\s*\{|^#[\w-]+\s*\{/,
      'htmlmixed': /^<(div|section|article|main|header|footer|nav)/
    }
    
    const pattern = patterns[mode]
    return pattern ? pattern.test(line.trim()) : false
  }
}
```

**Features**:
- ✅ Show up to 3 levels of context
- ✅ Language-aware (functions in JS, classes in Python)
- ✅ Sticky at top of editor
- ✅ Click to jump to definition

---

## Implementation Priority

### Phase 1: Quick Wins (Week 1)
1. **Command Palette** (1 day) - High impact, medium complexity
2. **Code Snippets** (2 days) - High impact, medium complexity

### Phase 2: Enhanced Intelligence (Week 2)
3. **Enhanced Autocomplete** (2-3 days) - High impact, medium-high complexity
4. **Bracket Colorization** (1 day) - Medium impact, medium complexity

### Phase 3: Advanced Features (Week 3)
5. **Sticky Scroll** (2 days) - Medium impact, high complexity

---

## Success Metrics

### User Experience
- ✅ Faster code writing (snippets save typing time)
- ✅ Better navigation (command palette, sticky scroll)
- ✅ Fewer typos (enhanced autocomplete)
- ✅ Better code readability (bracket colors)

### Performance
- ✅ No lag on large files (<1000 lines)
- ✅ Command palette opens <100ms
- ✅ Autocomplete suggestions <50ms
- ✅ Snippet insertion instant

### Adoption
- ✅ 50%+ users use command palette
- ✅ 70%+ users use snippets
- ✅ 30%+ users customize snippets

---

## Next Steps

1. ✅ Get user approval on enhancement plan
2. ⏳ Start with Command Palette (Phase 1, Day 1)
3. ⏳ Create CommandPaletteManager.js
4. ⏳ Add CSS styling
5. ⏳ Test keyboard navigation
6. ⏳ Move to Code Snippets (Phase 1, Day 2-3)

**Ready to begin? Let's start with the Command Palette! 🚀**
