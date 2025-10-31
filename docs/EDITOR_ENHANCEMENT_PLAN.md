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

**Status**: Basic autocomplete exists, needs enhancement  
**Complexity**: Medium-High  
**Impact**: High  
**Estimated Time**: 2-3 days

**What**:
- Context-aware suggestions
- Import auto-completion (suggest from open files)
- CSS property value suggestions
- HTML attribute suggestions with values
- Framework-specific hints (React props, Vue directives)
- Function parameter hints

**Implementation**:
```javascript
// EnhancedAutocompleteManager.js
class EnhancedAutocompleteManager {
  constructor(editor, codeMirror) {
    this.editor = editor
    this.cm = codeMirror
    this.setupEnhancedHints()
  }
  
  setupEnhancedHints() {
    this.cm.setOption('hintOptions', {
      hint: this.getContextAwareHints.bind(this),
      completeSingle: false,
      closeOnUnfocus: true,
      alignWithWord: true
    })
  }
  
  getContextAwareHints(cm, options) {
    const cursor = cm.getCursor()
    const token = cm.getTokenAt(cursor)
    const mode = cm.getMode().name
    
    // Detect context
    const context = this.detectContext(cm, cursor, token)
    
    switch(context.type) {
      case 'import':
        return this.getImportSuggestions(cm, cursor, context)
      case 'css-property':
        return this.getCSSPropertySuggestions(cm, cursor, context)
      case 'css-value':
        return this.getCSSValueSuggestions(cm, cursor, context)
      case 'html-attribute':
        return this.getHTMLAttributeSuggestions(cm, cursor, context)
      case 'react-component':
        return this.getReactComponentSuggestions(cm, cursor, context)
      default:
        return this.getGenericSuggestions(cm, cursor, token)
    }
  }
  
  detectContext(cm, cursor, token) {
    const line = cm.getLine(cursor.line)
    const before = line.substring(0, cursor.ch)
    
    // Import detection
    if (/import\s+.*from\s+['"]?$/.test(before)) {
      return { type: 'import', partial: token.string }
    }
    
    // CSS property vs value
    if (cm.getMode().name === 'css') {
      const colonIndex = line.lastIndexOf(':', cursor.ch)
      if (colonIndex !== -1 && colonIndex < cursor.ch) {
        const property = line.substring(0, colonIndex).trim().split(/\s+/).pop()
        return { type: 'css-value', property }
      }
      return { type: 'css-property' }
    }
    
    // HTML attribute
    if (cm.getMode().name === 'htmlmixed') {
      const tagMatch = before.match(/<(\w+)([^>]*)$/)
      if (tagMatch && /\s\w+$/.test(before)) {
        return { type: 'html-attribute', tag: tagMatch[1] }
      }
    }
    
    // React component props
    if (cm.getMode().name === 'jsx' && /<\w+\s+\w*$/.test(before)) {
      return { type: 'react-component' }
    }
    
    return { type: 'generic' }
  }
  
  getImportSuggestions(cm, cursor, context) {
    // Suggest from open files
    const openFiles = this.editor.fileManager.files.map(f => f.name)
    
    return {
      list: openFiles.map(file => ({
        text: `./${file}`,
        displayText: file,
        className: 'autocomplete-import'
      })),
      from: { line: cursor.line, ch: cursor.ch - context.partial.length },
      to: cursor
    }
  }
  
  getCSSValueSuggestions(cm, cursor, context) {
    const valueMap = {
      'display': ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'],
      'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
      'text-align': ['left', 'center', 'right', 'justify'],
      'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
      'cursor': ['pointer', 'default', 'move', 'text', 'wait', 'not-allowed']
    }
    
    const values = valueMap[context.property] || []
    
    return {
      list: values.map(val => ({
        text: val,
        displayText: val,
        className: 'autocomplete-css-value'
      })),
      from: cursor,
      to: cursor
    }
  }
  
  getHTMLAttributeSuggestions(cm, cursor, context) {
    const attributeMap = {
      'input': ['type', 'name', 'value', 'placeholder', 'required', 'disabled', 'readonly'],
      'button': ['type', 'disabled', 'onclick', 'class', 'id'],
      'a': ['href', 'target', 'rel', 'title', 'class', 'id'],
      'img': ['src', 'alt', 'width', 'height', 'loading', 'class'],
      'div': ['class', 'id', 'style', 'onclick', 'data-*']
    }
    
    const attrs = attributeMap[context.tag] || ['class', 'id', 'style']
    
    return {
      list: attrs.map(attr => ({
        text: `${attr}=""`,
        displayText: attr,
        className: 'autocomplete-attribute'
      })),
      from: cursor,
      to: cursor
    }
  }
}
```

**Features**:
- ✅ Import suggestions from open files
- ✅ CSS property value autocomplete
- ✅ HTML attribute suggestions per tag
- ✅ React prop suggestions (common props)
- ✅ Function parameter hints (hover tooltip)
- ✅ Variable name suggestions from current file

---

### 3. Command Palette ⌨️

**Status**: Not Implemented  
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

**Status**: Not Implemented  
**Complexity**: Medium  
**Impact**: Medium  
**Estimated Time**: 1 day

**What**:
- Rainbow bracket pairs
- Different colors for nested levels
- Matching bracket highlighting on hover

**Implementation**:
```javascript
// BracketColorizer.js (CodeMirror addon)
CodeMirror.defineExtension('enableBracketColorization', function() {
  const bracketPairs = ['()', '[]', '{}']
  const colors = ['#ffd700', '#da70d6', '#179fff', '#00fa9a', '#ff6347']
  
  this.on('renderLine', (cm, line, element) => {
    const text = line.text
    const stack = []
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      if ('([{'.includes(char)) {
        stack.push({ char, index: i, level: stack.length })
      } else if (')]}'.includes(char)) {
        if (stack.length > 0) {
          const open = stack.pop()
          const color = colors[open.level % colors.length]
          
          // Color the brackets
          const span = document.createElement('span')
          span.className = 'bracket-colored'
          span.style.color = color
          // Apply to DOM
        }
      }
    }
  })
})
```

**Features**:
- ✅ 5-level color rotation
- ✅ Matching pair highlighting
- ✅ Customizable colors
- ✅ Toggle on/off

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
