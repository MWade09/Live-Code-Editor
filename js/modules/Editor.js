/**
 * Editor class - Handles CodeMirror editor initialization and operations
 */
export class Editor {
    constructor(editorElement, fileManager) {
        this.fileManager = fileManager;        this.codeMirror = CodeMirror(editorElement, {
            lineNumbers: true,
            theme: document.body.classList.contains('dark-theme') ? 'monokai' : 'eclipse',
            indentUnit: 4,
            smartIndent: true,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: false,
            mode: 'htmlmixed',
            
            // Enhanced bracket matching and auto-closing
            autoCloseTags: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            matchTags: { bothTags: true },
            showTrailingSpace: true,
            
            // Enhanced indentation
            electricChars: true,
            autoIndent: "smart",
              // Code folding support
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
            
            // Real-time linting and error detection
            lint: {
                getAnnotations: (text, callback, options, cm) => {
                    this.performLinting(text, callback, options, cm);
                },
                async: true,
                delay: 300
            },
            
            // Multiple cursor support
            selectionPointer: true,
            
            // Enhanced selection and highlighting
            highlightSelectionMatches: {
                showToken: /\w/,
                annotateScrollbar: true,
                delay: 100,
                wordsOnly: true
            },
            styleActiveLine: true,
            styleSelectedText: true,
            cursorBlinkRate: 530,
    
            // Keyboard shortcuts for folding and multiple cursors            
            extraKeys: {
                // Autocomplete shortcuts
                "Ctrl-Space": "autocomplete",
                "Alt-Space": "autocomplete",
                "Ctrl-.": "autocomplete",
                
                // Enhanced bracket matching shortcuts
                "Ctrl-M": "goToBracket",
                "Ctrl-Shift-M": cm => this.selectBrackets(cm),
                "Ctrl-Shift-\\": "goToBracket",
                
                // Smart indentation shortcuts
                "Ctrl-]": cm => this.indentMore(cm),
                "Ctrl-[": cm => this.indentLess(cm),
                "Ctrl-Shift-I": cm => this.autoIndentSelection(cm),
                "Tab": cm => this.smartTab(cm),
                "Shift-Tab": cm => this.indentLess(cm),
                
                // Code folding shortcuts
                "Ctrl-Shift-[": cm => cm.foldCode(cm.getCursor()),
                "Ctrl-Shift-]": cm => cm.unfoldCode(cm.getCursor()),
                "Ctrl-Alt-[": cm => this.foldAll(),
                "Ctrl-Alt-]": cm => this.unfoldAll(),
                "F9": cm => cm.foldCode(cm.getCursor()),
                "Shift-F9": cm => cm.unfoldCode(cm.getCursor()),
                
                // Multiple cursor shortcuts
                "Ctrl-D": cm => this.selectNextOccurrence(cm),
                "Ctrl-Shift-D": cm => this.selectAllOccurrences(cm),
                "Alt-Click": cm => this.addCursorAtClick(cm),
                "Ctrl-Alt-Up": cm => this.addCursorAbove(cm),
                "Ctrl-Alt-Down": cm => this.addCursorBelow(cm),
                "Escape": cm => this.clearMultipleSelections(cm),
                  // Enhanced search and replace
                "Ctrl-F": cm => this.showAdvancedFind(cm),
                "Ctrl-H": cm => this.showAdvancedReplace(cm),
                "Ctrl-Shift-F": cm => this.showGlobalSearch(cm),
                "Ctrl-Shift-H": cm => this.showGlobalReplace(cm),
                "F3": "findNext",
                "Shift-F3": "findPrev",
                "Ctrl-G": "jumpToLine",
                "Ctrl-Shift-G": "jumpToLine",
                
                // Line manipulation with multiple cursors
                "Ctrl-Shift-K": cm => this.deleteLines(cm),
                "Ctrl-Shift-Up": cm => this.moveLineUp(cm),
                "Ctrl-Shift-Down": cm => this.moveLineDown(cm),
                "Ctrl-/": cm => this.toggleComment(cm),
                  // Column selection
                "Shift-Alt-Down": cm => this.columnSelectionDown(cm),
                "Shift-Alt-Up": cm => this.columnSelectionUp(cm),
                
                // Code quality and linting shortcuts
                "Ctrl-Shift-P": cm => this.formatCode(),
                "Alt-Shift-F": cm => this.formatCode(),
                "Ctrl-Shift-L": cm => this.toggleLinting(),
                "F8": cm => this.jumpToNextError(),
                "Shift-F8": cm => this.jumpToPrevError(),
                "Ctrl-Shift-M": cm => this.showLintStats()
            }
        });
        
        this.codeMirror.on('change', () => {
            this.updateCurrentFile();
        });
        
        // Setup autocomplete functionality
        this.setupAutocomplete();
        
        // Add folding controls to the editor
        this.setupFoldingControls();
    }
    
    // Setup language-specific autocomplete
    setupAutocomplete() {
        // Configure hint options for better autocomplete experience
        this.codeMirror.setOption('hintOptions', {
            hint: this.getLanguageSpecificHint.bind(this),
            completeSingle: false,
            closeOnUnfocus: true,
            alignWithWord: true,
            closeCharacters: /[\s()\[\]{};:>,]/,
            // Show hints automatically while typing
            extraKeys: {
                "Tab": (cm, handle) => {
                    if (handle.data && handle.data.list && handle.data.list.length === 1) {
                        handle.pick();
                    } else {
                        return CodeMirror.Pass;
                    }
                }
            }
        });
        
        // Auto-trigger hints on certain characters
        this.codeMirror.on('inputRead', (cm, change) => {
            if (change.text[0] && this.shouldTriggerAutocomplete(change.text[0])) {
                setTimeout(() => {
                    if (!cm.state.completionActive) {
                        cm.showHint();
                    }
                }, 150);
            }
        });
        
        // Initialize language-specific dictionaries
        this.initializeLanguageSupport();
    }
    
    // Determine if we should trigger autocomplete for the given character
    shouldTriggerAutocomplete(char) {
        const mode = this.codeMirror.getMode().name;
        
        switch (mode) {
            case 'htmlmixed':
            case 'xml':
                return char === '<' || char === ' ';
            case 'css':
                return char === ':' || char === ' ' || char === '{';
            case 'javascript':
            case 'jsx':
                return char === '.' || char === ' ';
            case 'python':
                return char === '.' || char === ' ';
            default:
                return char === ' ' && Math.random() < 0.3; // Occasionally trigger for other languages
        }
    }
    
    // Get language-specific hint function
    getLanguageSpecificHint(cm) {
        const mode = cm.getMode().name;
        const cursor = cm.getCursor();
        const token = cm.getTokenAt(cursor);
        
        switch (mode) {
            case 'htmlmixed':
                return this.getHTMLHints(cm, cursor, token);
            case 'css':
                return this.getCSSHints(cm, cursor, token);
            case 'javascript':
            case 'jsx':
                return this.getJavaScriptHints(cm, cursor, token);
            case 'python':
                return this.getPythonHints(cm, cursor, token);
            case 'sql':
                return CodeMirror.hint.sql(cm);
            case 'xml':
                return CodeMirror.hint.xml(cm);
            default:
                return CodeMirror.hint.anyword(cm);
        }
    }
    
    // Initialize language support and custom dictionaries
    initializeLanguageSupport() {
        // HTML5 elements and attributes
        this.htmlElements = [
            'article', 'aside', 'audio', 'canvas', 'details', 'figcaption', 'figure', 
            'footer', 'header', 'main', 'mark', 'meter', 'nav', 'progress', 'section', 
            'summary', 'time', 'video', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 
            'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'input', 'button', 'form', 
            'label', 'textarea', 'select', 'option', 'table', 'tr', 'td', 'th', 'thead', 
            'tbody', 'tfoot'
        ];
        
        this.htmlAttributes = [
            'id', 'class', 'style', 'src', 'href', 'alt', 'title', 'data-', 'aria-',
            'placeholder', 'required', 'disabled', 'readonly', 'checked', 'selected',
            'multiple', 'autofocus', 'autoplay', 'controls', 'loop', 'muted', 'preload'
        ];
        
        // CSS properties and values
        this.cssProperties = [
            'display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height',
            'margin', 'padding', 'border', 'background', 'color', 'font-size', 'font-family',
            'font-weight', 'text-align', 'text-decoration', 'line-height', 'opacity',
            'z-index', 'overflow', 'float', 'clear', 'flex', 'flex-direction', 'justify-content',
            'align-items', 'grid', 'grid-template', 'animation', 'transition', 'transform'
        ];
        
        this.cssValues = {
            'display': ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'],
            'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
            'text-align': ['left', 'center', 'right', 'justify'],
            'overflow': ['visible', 'hidden', 'scroll', 'auto'],
            'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']
        };
        
        // JavaScript keywords and common methods
        this.jsKeywords = [
            'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while',
            'do', 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch',
            'finally', 'throw', 'class', 'extends', 'import', 'export', 'async', 'await'
        ];
        
        this.jsMethods = [
            'addEventListener', 'removeEventListener', 'querySelector', 'querySelectorAll',
            'getElementById', 'getElementsByClassName', 'getElementsByTagName', 'createElement',
            'appendChild', 'removeChild', 'setAttribute', 'getAttribute', 'classList.add',
            'classList.remove', 'classList.toggle', 'innerHTML', 'textContent', 'value',
            'map', 'filter', 'reduce', 'forEach', 'find', 'includes', 'indexOf', 'push',
            'pop', 'shift', 'unshift', 'splice', 'slice', 'join', 'split', 'replace'
        ];
        
        // Python keywords and built-ins
        this.pythonKeywords = [
            'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except',
            'finally', 'with', 'import', 'from', 'as', 'return', 'yield', 'lambda',
            'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None'
        ];
        
        this.pythonBuiltins = [
            'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'reduce',
            'list', 'dict', 'set', 'tuple', 'str', 'int', 'float', 'bool', 'type',
            'isinstance', 'hasattr', 'getattr', 'setattr', 'dir', 'help', 'open'
        ];
    }
    
    // Setup folding control buttons
    setupFoldingControls() {
        // Create folding controls container
        const editorElement = this.codeMirror.getWrapperElement();
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'editor-controls';
        controlsContainer.innerHTML = `
            <div class="folding-controls">
                <button id="fold-all-btn" class="editor-control-btn" title="Fold All (Ctrl+Alt+[)">
                    <i class="fas fa-compress-alt"></i>
                </button>
                <button id="unfold-all-btn" class="editor-control-btn" title="Unfold All (Ctrl+Alt+])">
                    <i class="fas fa-expand-alt"></i>
                </button>
            </div>
            <div class="multi-cursor-controls">
                <button id="select-next-btn" class="editor-control-btn" title="Select Next Occurrence (Ctrl+D)">
                    <i class="fas fa-plus"></i>
                </button>
                <button id="select-all-btn" class="editor-control-btn" title="Select All Occurrences (Ctrl+Shift+D)">
                    <i class="fas fa-expand-arrows-alt"></i>
                </button>
                <button id="clear-selections-btn" class="editor-control-btn" title="Clear Multiple Selections (Esc)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Insert controls at the top of the editor
        editorElement.insertBefore(controlsContainer, editorElement.firstChild);
        
        // Add event listeners for the buttons
        document.getElementById('fold-all-btn').addEventListener('click', () => this.foldAll());
        document.getElementById('unfold-all-btn').addEventListener('click', () => this.unfoldAll());
        document.getElementById('select-next-btn').addEventListener('click', () => this.selectNextOccurrence(this.codeMirror));
        document.getElementById('select-all-btn').addEventListener('click', () => this.selectAllOccurrences(this.codeMirror));
        document.getElementById('clear-selections-btn').addEventListener('click', () => this.clearMultipleSelections(this.codeMirror));
    }
    
    // Fold all code blocks
    foldAll() {
        const cm = this.codeMirror;
        for (let i = cm.firstLine(); i <= cm.lastLine(); i++) {
            cm.foldCode({line: i, ch: 0}, null, "fold");
        }
    }
    
    // Unfold all code blocks
    unfoldAll() {
        const cm = this.codeMirror;
        
        // Method 1: Try to find and clear all fold marks
        try {
            const marks = cm.getAllMarks();
            marks.forEach(mark => {
                if (mark.__isFold) {
                    mark.clear();
                }
            });
            return;
        } catch (e) {
            console.log('Method 1 failed, trying method 2:', e.message);
        }
        
        // Method 2: Use foldCode with toggle behavior
        try {
            for (let i = cm.firstLine(); i <= cm.lastLine(); i++) {
                const pos = {line: i, ch: 0};
                const range = cm.findFoldAt(pos);
                if (range) {
                    cm.foldCode(pos); // This toggles the fold
                }
            }
            return;
        } catch (e) {
            console.log('Method 2 failed, trying method 3:', e.message);
        }
        
        // Method 3: Set cursor and use unfoldCode like keyboard shortcuts
        try {
            for (let i = cm.firstLine(); i <= cm.lastLine(); i++) {
                const pos = {line: i, ch: 0};
                cm.setCursor(pos);
                if (typeof cm.unfoldCode === 'function') {
                    cm.unfoldCode(pos);
                }
            }
        } catch (e) {
            console.log('All unfold methods failed:', e.message);
        }
    }
    
    updateCurrentFile() {
        const content = this.codeMirror.getValue();
        this.fileManager.updateCurrentFile(content);
    }
    
    loadFile(file) {
        if (!file) return;
        
        // Enhanced file type to CodeMirror mode mapping
        const mode = this.getModeFromFileType(file.type, file.name);
        
        this.codeMirror.setOption('mode', mode);
        this.codeMirror.setValue(file.content || '');
        this.codeMirror.clearHistory();
        
        // Refresh the editor to apply the new mode
        setTimeout(() => {
            this.codeMirror.refresh();
        }, 100);
    }
    
    // Enhanced method to determine CodeMirror mode from file type and name
    getModeFromFileType(fileType, fileName = '') {
        const extension = fileName.split('.').pop()?.toLowerCase();
        
        // Primary check: use file type if available
        switch (fileType) {
            case 'html':
                return 'htmlmixed';
            case 'css':
                return 'css';
            case 'javascript':
                return 'javascript';
            case 'python':
                return 'python';
            case 'typescript':
                return 'text/typescript';
            case 'jsx':
            case 'react':
                return 'text/jsx';
            case 'vue':
                return 'vue';
            case 'scss':
            case 'sass':
                return 'text/x-scss';
            case 'markdown':
                return 'markdown';
            case 'sql':
                return 'sql';
            case 'shell':
                return 'shell';
            case 'yaml':
                return 'yaml';
            case 'dockerfile':
                return 'dockerfile';
            case 'json':
                return 'application/json';
            case 'xml':
                return 'xml';
            case 'java':
                return 'text/x-java';
            case 'cpp':
            case 'c++':
                return 'text/x-c++src';
            case 'c':
                return 'text/x-csrc';
            case 'csharp':
            case 'cs':
                return 'text/x-csharp';
            case 'php':
                return 'text/x-php';
            case 'ruby':
                return 'text/x-ruby';
            case 'go':
                return 'text/x-go';
            case 'rust':
                return 'text/x-rustsrc';
            default:
                // Secondary check: use file extension
                return this.getModeFromExtension(extension);
        }
    }
    
    // Helper method to determine mode from file extension
    getModeFromExtension(extension) {
        switch (extension) {
            case 'html':
            case 'htm':
                return 'htmlmixed';
            case 'css':
                return 'css';
            case 'js':
            case 'mjs':
                return 'javascript';
            case 'ts':
                return 'text/typescript';
            case 'tsx':
            case 'jsx':
                return 'text/jsx';
            case 'vue':
                return 'vue';
            case 'py':
                return 'python';
            case 'scss':
            case 'sass':
                return 'text/x-scss';
            case 'less':
                return 'text/x-less';
            case 'md':
            case 'markdown':
                return 'markdown';
            case 'sql':
                return 'sql';
            case 'sh':
            case 'bash':
            case 'zsh':
                return 'shell';
            case 'yml':
            case 'yaml':
                return 'yaml';
            case 'json':
                return 'application/json';
            case 'xml':
            case 'svg':
                return 'xml';
            case 'java':
                return 'text/x-java';
            case 'cpp':
            case 'cc':
            case 'cxx':
                return 'text/x-c++src';
            case 'c':
            case 'h':
                return 'text/x-csrc';
            case 'cs':
                return 'text/x-csharp';
            case 'php':
                return 'text/x-php';
            case 'rb':
                return 'text/x-ruby';
            case 'go':
                return 'text/x-go';
            case 'rs':
                return 'text/x-rustsrc';
            case 'dockerfile':
                return 'dockerfile';
            case 'ini':
            case 'cfg':
            case 'conf':
                return 'text/x-ini';
            default:
                return 'text/plain';
        }
    }
    
    loadCurrentFile() {
        const currentFile = this.fileManager.getCurrentFile();
        this.loadFile(currentFile);
    }
    
    setTheme(isDark) {
        this.codeMirror.setOption('theme', isDark ? 'monokai' : 'eclipse');
    }
    
    focus() {
        this.codeMirror.focus();
    }
    
    // Multiple cursor support methods
    selectNextOccurrence(cm) {
        const selection = cm.getSelection();
        if (!selection) {
            // If no selection, select the word at cursor
            const cursor = cm.getCursor();
            const word = cm.findWordAt(cursor);
            cm.setSelection(word.anchor, word.head);
            return;
        }
        
        // Find next occurrence of selected text
        const searchCursor = cm.getSearchCursor(selection, cm.getCursor());
        if (searchCursor.findNext()) {
            cm.addSelection(searchCursor.from(), searchCursor.to());
        } else {
            // Wrap around to beginning
            const searchCursor2 = cm.getSearchCursor(selection, { line: 0, ch: 0 });
            if (searchCursor2.findNext()) {
                cm.addSelection(searchCursor2.from(), searchCursor2.to());
            }
        }
    }
    
    selectAllOccurrences(cm) {
        const selection = cm.getSelection();
        if (!selection) {
            // If no selection, select the word at cursor
            const cursor = cm.getCursor();
            const word = cm.findWordAt(cursor);
            cm.setSelection(word.anchor, word.head);
            this.selectAllOccurrences(cm);
            return;
        }
        
        // Find all occurrences and select them
        const selections = [];
        const searchCursor = cm.getSearchCursor(selection, { line: 0, ch: 0 });
        
        while (searchCursor.findNext()) {
            selections.push({
                anchor: searchCursor.from(),
                head: searchCursor.to()
            });
        }
        
        if (selections.length > 0) {
            cm.setSelections(selections);
        }
    }
    
    addCursorAtClick(cm) {
        // This will be handled by CodeMirror's built-in Alt+Click functionality
        // when selectionPointer is enabled
        return true;
    }
    
    addCursorAbove(cm) {
        const selections = cm.listSelections();
        const newSelections = [...selections];
        
        selections.forEach(sel => {
            const cursor = sel.head;
            if (cursor.line > 0) {
                const newLine = cursor.line - 1;
                const lineLength = cm.getLine(newLine).length;
                const newCh = Math.min(cursor.ch, lineLength);
                newSelections.push({
                    anchor: { line: newLine, ch: newCh },
                    head: { line: newLine, ch: newCh }
                });
            }
        });
        
        cm.setSelections(newSelections);
    }
    
    addCursorBelow(cm) {
        const selections = cm.listSelections();
        const newSelections = [...selections];
        
        selections.forEach(sel => {
            const cursor = sel.head;
            if (cursor.line < cm.lineCount() - 1) {
                const newLine = cursor.line + 1;
                const lineLength = cm.getLine(newLine).length;
                const newCh = Math.min(cursor.ch, lineLength);
                newSelections.push({
                    anchor: { line: newLine, ch: newCh },
                    head: { line: newLine, ch: newCh }
                });
            }
        });
        
        cm.setSelections(newSelections);
    }
    
    clearMultipleSelections(cm) {
        const selections = cm.listSelections();
        if (selections.length > 1) {
            // Keep only the primary selection (usually the last one)
            cm.setSelection(selections[0].anchor, selections[0].head);
        }
    }
    
    deleteLines(cm) {
        const selections = cm.listSelections();
        cm.operation(() => {
            // Sort selections by line number (descending) to delete from bottom to top
            const lines = selections.map(sel => sel.head.line).sort((a, b) => b - a);
            const uniqueLines = [...new Set(lines)];
            
            uniqueLines.forEach(line => {
                if (line < cm.lineCount()) {
                    cm.replaceRange('', 
                        { line: line, ch: 0 }, 
                        { line: line + 1, ch: 0 }
                    );
                }
            });
        });
    }
    
    moveLineUp(cm) {
        const selections = cm.listSelections();
        cm.operation(() => {
            const movedLines = new Set();
            
            selections.forEach(sel => {
                const line = sel.head.line;
                if (line > 0 && !movedLines.has(line) && !movedLines.has(line - 1)) {
                    const currentLine = cm.getLine(line);
                    const previousLine = cm.getLine(line - 1);
                    
                    // Replace the two lines
                    cm.replaceRange(currentLine + '\n' + previousLine, 
                        { line: line - 1, ch: 0 }, 
                        { line: line + 1, ch: 0 }
                    );
                    
                    movedLines.add(line);
                    movedLines.add(line - 1);
                }
            });
        });
    }
    
    moveLineDown(cm) {
        const selections = cm.listSelections();
        cm.operation(() => {
            const movedLines = new Set();
            
            selections.forEach(sel => {
                const line = sel.head.line;
                if (line < cm.lineCount() - 1 && !movedLines.has(line) && !movedLines.has(line + 1)) {
                    const currentLine = cm.getLine(line);
                    const nextLine = cm.getLine(line + 1);
                    
                    // Replace the two lines
                    cm.replaceRange(nextLine + '\n' + currentLine, 
                        { line: line, ch: 0 }, 
                        { line: line + 2, ch: 0 }
                    );
                    
                    movedLines.add(line);
                    movedLines.add(line + 1);
                }
            });
        });
    }
    
    toggleComment(cm) {
        const selections = cm.listSelections();
        const mode = cm.getMode();
        let commentString = '// ';
        let commentEnd = '';
        
        // Determine comment string based on file mode
        switch (mode.name) {
            case 'htmlmixed':
            case 'xml':
                commentString = '<!-- ';
                commentEnd = ' -->';
                break;
            case 'css':
                commentString = '/* ';
                commentEnd = ' */';
                break;
            case 'python':
                commentString = '# ';
                break;
            case 'sql':
                commentString = '-- ';
                break;
            default:
                commentString = '// ';
        }
        
        cm.operation(() => {
            selections.forEach(sel => {
                const startLine = Math.min(sel.anchor.line, sel.head.line);
                const endLine = Math.max(sel.anchor.line, sel.head.line);
                
                for (let line = startLine; line <= endLine; line++) {
                    const lineText = cm.getLine(line);
                    const trimmed = lineText.trim();
                    
                    if (commentEnd) {
                        // Block comment (CSS, HTML)
                        if (trimmed.startsWith(commentString.trim()) && trimmed.endsWith(commentEnd.trim())) {
                            // Remove comment
                            const newText = lineText
                                .replace(commentString, '')
                                .replace(commentEnd, '');
                            cm.replaceRange(newText, 
                                { line: line, ch: 0 }, 
                                { line: line, ch: lineText.length }
                            );
                        } else {
                            // Add comment
                            cm.replaceRange(commentString + lineText + commentEnd, 
                                { line: line, ch: 0 }, 
                                { line: line, ch: lineText.length }
                            );
                        }
                    } else {
                        // Line comment
                        if (trimmed.startsWith(commentString.trim())) {
                            // Remove comment
                            const newText = lineText.replace(commentString, '');
                            cm.replaceRange(newText, 
                                { line: line, ch: 0 }, 
                                { line: line, ch: lineText.length }
                            );
                        } else {
                            // Add comment
                            cm.replaceRange(commentString + lineText, 
                                { line: line, ch: 0 }, 
                                { line: line, ch: lineText.length }
                            );
                        }
                    }
                }
            });
        });
    }
    
    columnSelectionDown(cm) {
        const selections = cm.listSelections();
        const newSelections = [];
        
        selections.forEach(sel => {
            // Create column selection downward
            const startLine = sel.anchor.line;
            const endLine = sel.head.line;
            const startCh = Math.min(sel.anchor.ch, sel.head.ch);
            const endCh = Math.max(sel.anchor.ch, sel.head.ch);
            
            for (let line = startLine; line <= Math.min(endLine + 1, cm.lineCount() - 1); line++) {
                const lineLength = cm.getLine(line).length;
                newSelections.push({
                    anchor: { line: line, ch: Math.min(startCh, lineLength) },
                    head: { line: line, ch: Math.min(endCh, lineLength) }
                });
            }
        });
        
        if (newSelections.length > 0) {
            cm.setSelections(newSelections);
        }
    }
    
    columnSelectionUp(cm) {
        const selections = cm.listSelections();
        const newSelections = [];
        
        selections.forEach(sel => {
            // Create column selection upward
            const startLine = sel.anchor.line;
            const endLine = sel.head.line;
            const startCh = Math.min(sel.anchor.ch, sel.head.ch);
            const endCh = Math.max(sel.anchor.ch, sel.head.ch);
            
            for (let line = Math.max(startLine - 1, 0); line <= endLine; line++) {
                const lineLength = cm.getLine(line).length;
                newSelections.push({
                    anchor: { line: line, ch: Math.min(startCh, lineLength) },
                    head: { line: line, ch: Math.min(endCh, lineLength) }
                });
            }
        });
        
        if (newSelections.length > 0) {
            cm.setSelections(newSelections);
        }
    }
    
    // HTML-specific hints
    getHTMLHints(cm, cursor, token) {
        const text = cm.getRange({ line: 0, ch: 0 }, cursor);
        const lastChar = text.charAt(text.length - 1);
        
        if (lastChar === '<') {
            // Suggest HTML elements
            return {
                list: this.htmlElements.map(el => ({
                    text: el + '>',
                    displayText: el,
                    className: 'autocomplete-element'
                })),
                from: cursor,
                to: cursor
            };
        }
        
        if (token.string.includes('=') || lastChar === ' ') {
            // We're inside a tag, suggest attributes
            return {
                list: this.htmlAttributes.map(attr => ({
                    text: attr + '=""',
                    displayText: attr,
                    className: 'autocomplete-attribute'
                })),
                from: CodeMirror.Pos(cursor.line, token.start),
                to: cursor
            };
        }
        
        // Fall back to HTML hint
        return CodeMirror.hint.html(cm) || { list: [], from: cursor, to: cursor };
    }
    
    // CSS-specific hints
    getCSSHints(cm, cursor, token) {
        const line = cm.getLine(cursor.line);
        const colonIndex = line.lastIndexOf(':', cursor.ch);
        
        if (colonIndex !== -1 && colonIndex < cursor.ch) {
            // We're after a colon, suggest values
            const property = line.substring(0, colonIndex).trim().split(/\s+/).pop();
            const values = this.cssValues[property] || [];
            
            if (values.length > 0) {
                return {
                    list: values.map(val => ({
                        text: val,
                        displayText: val,
                        className: 'autocomplete-value'
                    })),
                    from: CodeMirror.Pos(cursor.line, colonIndex + 1),
                    to: cursor
                };
            }
        } else {
            // Suggest CSS properties
            return {
                list: this.cssProperties.map(prop => ({
                    text: prop + ': ',
                    displayText: prop,
                    className: 'autocomplete-property'
                })),
                from: CodeMirror.Pos(cursor.line, token.start),
                to: cursor
            };
        }
        
        // Fall back to CSS hint
        return CodeMirror.hint.css(cm) || { list: [], from: cursor, to: cursor };
    }
    
    // JavaScript-specific hints
    getJavaScriptHints(cm, cursor, token) {
        const line = cm.getLine(cursor.line);
        const beforeCursor = line.substring(0, cursor.ch);
        
        // Check if we're after a dot (method/property access)
        if (beforeCursor.endsWith('.')) {
            const contextObject = this.getJSContext(beforeCursor);
            let suggestions = [];
            
            if (contextObject === 'document') {
                suggestions = ['getElementById', 'querySelector', 'querySelectorAll', 'createElement', 'addEventListener'];
            } else if (contextObject === 'console') {
                suggestions = ['log', 'error', 'warn', 'info', 'debug', 'trace'];
            } else if (contextObject === 'Math') {
                suggestions = ['floor', 'ceil', 'round', 'max', 'min', 'random', 'abs', 'sqrt'];
            } else if (contextObject === 'Array' || contextObject.endsWith('[]')) {
                suggestions = ['push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'map', 'filter', 'reduce', 'forEach'];
            } else {
                suggestions = this.jsMethods;
            }
            
            return {
                list: suggestions.map(method => ({
                    text: method,
                    displayText: method,
                    className: 'autocomplete-method'
                })),
                from: cursor,
                to: cursor
            };
        }
        
        // Suggest keywords and common methods
        const allSuggestions = [...this.jsKeywords, ...this.jsMethods];
        return {
            list: allSuggestions.filter(item => 
                item.toLowerCase().startsWith(token.string.toLowerCase())
            ).map(item => ({
                text: item,
                displayText: item,
                className: this.jsKeywords.includes(item) ? 'autocomplete-keyword' : 'autocomplete-method'
            })),
            from: CodeMirror.Pos(cursor.line, token.start),
            to: cursor
        };
    }
    
    // Python-specific hints
    getPythonHints(cm, cursor, token) {
        const allSuggestions = [...this.pythonKeywords, ...this.pythonBuiltins];
        
        return {
            list: allSuggestions.filter(item => 
                item.toLowerCase().startsWith(token.string.toLowerCase())
            ).map(item => ({
                text: item,
                displayText: item,
                className: this.pythonKeywords.includes(item) ? 'autocomplete-keyword' : 'autocomplete-builtin'
            })),
            from: CodeMirror.Pos(cursor.line, token.start),
            to: cursor
        };
    }
    
    // Helper to get JavaScript context for better suggestions
    getJSContext(beforeCursor) {
        const match = beforeCursor.match(/(\w+)\.$/);
        return match ? match[1] : null;    }
      // Manual trigger for autocomplete
    triggerAutocomplete() {
        this.codeMirror.showHint();
    }
    
    // Enhanced bracket matching methods
    selectBrackets(cm) {
        const cursor = cm.getCursor();
        const brackets = cm.findMatchingBracket(cursor, false, true);
        
        if (brackets && brackets.match) {
            const start = brackets.from || cursor;
            const end = brackets.to || cursor;
            cm.setSelection(start, end);
        }
    }
    
    // Smart indentation methods
    indentMore(cm) {
        if (cm.somethingSelected()) {
            cm.indentSelection("add");
        } else {
            cm.replaceSelection("\t");
        }
    }
    
    indentLess(cm) {
        if (cm.somethingSelected()) {
            cm.indentSelection("subtract");
        } else {
            const cursor = cm.getCursor();
            const line = cm.getLine(cursor.line);
            const before = line.slice(0, cursor.ch);
            const match = before.match(/^(\s+)/);
            
            if (match) {
                const indentUnit = cm.getOption("indentUnit");
                const currentIndent = match[1].length;
                const newIndent = Math.max(0, currentIndent - indentUnit);
                const newLine = " ".repeat(newIndent) + line.slice(currentIndent);
                
                cm.replaceRange(newLine, 
                    CodeMirror.Pos(cursor.line, 0),
                    CodeMirror.Pos(cursor.line, line.length)
                );
                cm.setCursor(cursor.line, newIndent);
            }
        }
    }
    
    autoIndentSelection(cm) {
        if (cm.somethingSelected()) {
            const from = cm.getCursor("start");
            const to = cm.getCursor("end");
            
            for (let i = from.line; i <= to.line; i++) {
                cm.indentLine(i);
            }
        } else {
            const cursor = cm.getCursor();
            cm.indentLine(cursor.line);
        }
    }
      smartTab(cm) {
        if (cm.somethingSelected()) {
            cm.indentSelection("add");
        } else {
            const cursor = cm.getCursor();
            const line = cm.getLine(cursor.line);
            const before = line.slice(0, cursor.ch);
            
            // Check if we're at the beginning of the line or after whitespace
            if (before.trim() === "" || before.match(/^\s*$/)) {
                cm.indentLine(cursor.line);
            } else {
                // Insert tab or spaces
                const indentUnit = cm.getOption("indentUnit");
                const useSpaces = !cm.getOption("indentWithTabs");
                const insertion = useSpaces ? " ".repeat(indentUnit) : "\t";
                cm.replaceSelection(insertion);
            }
        }
    }
    
    // Enhanced Find & Replace System
    showAdvancedFind(cm) {
        this.createSearchDialog(cm, 'find');
    }
    
    showAdvancedReplace(cm) {
        this.createSearchDialog(cm, 'replace');
    }
    
    showGlobalSearch(cm) {
        this.createGlobalSearchDialog('find');
    }
    
    showGlobalReplace(cm) {
        this.createGlobalSearchDialog('replace');
    }
    
    createSearchDialog(cm, mode) {
        const isReplace = mode === 'replace';
        const selection = cm.getSelection();
          const dialogHTML = `
            <div class="search-dialog">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="margin-right: 8px; min-width: 60px; color: var(--secondary-text);">Find:</span>
                    <input type="text" id="search-input" placeholder="Search..." value="${selection}" />
                    <button onclick="window.findNext()" class="find-next-btn">Next</button>
                    <button onclick="window.findPrev()" class="find-prev-btn secondary">Prev</button>
                </div>
                ${isReplace ? `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="margin-right: 8px; min-width: 60px; color: var(--secondary-text);">Replace:</span>
                    <input type="text" id="replace-input" placeholder="Replace with..." />
                    <button onclick="window.replaceNext()" class="replace-btn">Replace</button>
                    <button onclick="window.replaceAll()" class="replace-all-btn">All</button>
                </div>
                ` : ''}
                <div class="search-options">
                    <label><input type="checkbox" id="regex-checkbox" /> Regex</label>
                    <label><input type="checkbox" id="case-checkbox" /> Case sensitive</label>
                    <label><input type="checkbox" id="word-checkbox" /> Whole word</label>
                    <span class="search-stats" id="search-stats"></span>
                </div>
            </div>
        `;
        
        cm.openDialog(dialogHTML, (query) => {
            if (query) {
                this.performSearch(cm, query, this.getSearchOptions());
            }
        }, {
            closeOnEnter: false,
            closeOnBlur: false
        });
        
        // Focus the search input
        setTimeout(() => {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
                this.setupSearchHandlers(cm, isReplace);
            }
        }, 100);
    }
    
    setupSearchHandlers(cm, isReplace) {
        const searchInput = document.getElementById('search-input');
        const replaceInput = document.getElementById('replace-input');
        const regexCheckbox = document.getElementById('regex-checkbox');
        const caseCheckbox = document.getElementById('case-checkbox');
        const wordCheckbox = document.getElementById('word-checkbox');
        const searchStats = document.getElementById('search-stats');
          let searchState = null;
        let currentMatchIndex = 0;
        let allMatches = [];
        
        const updateSearch = () => {
            const query = searchInput.value;
            if (query) {
                const options = this.getSearchOptions();
                searchState = this.performSearch(cm, query, options);
                allMatches = this.getAllMatches(cm, query, options);
                currentMatchIndex = 0;
                this.updateSearchStats(searchStats, allMatches.length);
                if (allMatches.length > 0) {
                    this.selectMatch(cm, allMatches[currentMatchIndex]);
                }
            } else {
                cm.operation(() => {
                    cm.getAllMarks().forEach(mark => {
                        if (mark.className === 'cm-searching') mark.clear();
                    });
                });
                searchStats.textContent = '';
                searchState = null;
                allMatches = [];
                currentMatchIndex = 0;
            }
        };
        
        // Real-time search as user types
        searchInput.addEventListener('input', updateSearch);
        regexCheckbox.addEventListener('change', updateSearch);
        caseCheckbox.addEventListener('change', updateSearch);
        wordCheckbox.addEventListener('change', updateSearch);
          // Find next/previous
        window.findNext = () => {
            if (allMatches.length > 0) {
                currentMatchIndex = (currentMatchIndex + 1) % allMatches.length;
                this.selectMatch(cm, allMatches[currentMatchIndex]);
                this.updateSearchStats(searchStats, allMatches.length, currentMatchIndex + 1);
            }
        };
        
        window.findPrev = () => {
            if (allMatches.length > 0) {
                currentMatchIndex = currentMatchIndex === 0 ? allMatches.length - 1 : currentMatchIndex - 1;
                this.selectMatch(cm, allMatches[currentMatchIndex]);
                this.updateSearchStats(searchStats, allMatches.length, currentMatchIndex + 1);
            }
        };
          if (isReplace) {
            window.replaceNext = () => {
                const query = searchInput.value;
                const replacement = replaceInput.value;
                if (query && allMatches.length > 0) {
                    const currentMatch = allMatches[currentMatchIndex];
                    cm.replaceRange(replacement, currentMatch.from, currentMatch.to);
                    
                    // Update search after replacement
                    setTimeout(() => {
                        updateSearch();
                        if (allMatches.length > 0) {
                            // Stay on same index or move to next available
                            if (currentMatchIndex >= allMatches.length) {
                                currentMatchIndex = Math.max(0, allMatches.length - 1);
                            }
                            if (allMatches[currentMatchIndex]) {
                                this.selectMatch(cm, allMatches[currentMatchIndex]);
                                this.updateSearchStats(searchStats, allMatches.length, currentMatchIndex + 1);
                            }
                        }
                    }, 50);
                }
            };
            
            window.replaceAll = () => {
                const query = searchInput.value;
                const replacement = replaceInput.value;
                if (query && allMatches.length > 0) {
                    let count = 0;
                    // Replace from end to beginning to maintain position accuracy
                    for (let i = allMatches.length - 1; i >= 0; i--) {
                        const match = allMatches[i];
                        cm.replaceRange(replacement, match.from, match.to);
                        count++;
                    }
                    
                    searchStats.textContent = `Replaced ${count} occurrences`;
                    setTimeout(() => {
                        updateSearch();
                    }, 50);
                }
            };
        }
        
        // Keyboard shortcuts
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    window.findPrev();
                } else {
                    window.findNext();
                }
            } else if (e.key === 'Escape') {
                cm.focus();
                cm.closeDialog();
            }
        });
        
        if (replaceInput) {
            replaceInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.ctrlKey) {
                        window.replaceAll();
                    } else {
                        window.replaceNext();
                    }
                } else if (e.key === 'Escape') {
                    cm.focus();
                    cm.closeDialog();
                }
            });
        }
    }
    
    getSearchOptions() {
        const regexCheckbox = document.getElementById('regex-checkbox');
        const caseCheckbox = document.getElementById('case-checkbox');
        const wordCheckbox = document.getElementById('word-checkbox');
        
        return {
            regex: regexCheckbox?.checked || false,
            caseSensitive: caseCheckbox?.checked || false,
            wholeWord: wordCheckbox?.checked || false
        };
    }
    
    performSearch(cm, query, options) {
        if (!query) return null;
        
        try {
            let searchQuery = query;
            
            if (options.wholeWord && !options.regex) {
                searchQuery = `\\b${this.escapeRegex(query)}\\b`;
                options.regex = true;
            }
            
            if (options.regex) {
                const flags = options.caseSensitive ? 'g' : 'gi';
                searchQuery = new RegExp(searchQuery, flags);
            } else {
                searchQuery = options.caseSensitive ? query : query.toLowerCase();
            }
            
            // Clear previous search marks
            cm.operation(() => {
                cm.getAllMarks().forEach(mark => {
                    if (mark.className === 'cm-searching') mark.clear();
                });
            });
            
            // Perform the search
            const searchState = cm.getSearchCursor(searchQuery, cm.getCursor());
            
            // Highlight all matches
            this.highlightAllMatches(cm, searchQuery, options);
            
            // Find first match
            if (searchState.findNext()) {
                cm.setSelection(searchState.from(), searchState.to());
                cm.scrollIntoView(searchState.from());
            }
            
            return searchState;
        } catch (e) {
            console.error('Search error:', e);
            return null;
        }
    }
    
    highlightAllMatches(cm, query, options) {
        const cursor = cm.getSearchCursor(query, CodeMirror.Pos(cm.firstLine(), 0));
        const matches = [];
        
        while (cursor.findNext()) {
            matches.push({
                from: cursor.from(),
                to: cursor.to()
            });
        }
        
        cm.operation(() => {
            matches.forEach(match => {
                cm.markText(match.from, match.to, {
                    className: 'cm-searching'
                });
            });
        });
        
        return matches.length;
    }
    
    /**
     * Get all matches for a search query
     */
    getAllMatches(cm, query, options) {
        const matches = [];
        const searchQuery = options.regex ? new RegExp(query, options.caseSensitive ? 'g' : 'gi') : query;
        const cursor = cm.getSearchCursor(searchQuery, CodeMirror.Pos(cm.firstLine(), 0), options.caseSensitive);
        
        while (cursor.findNext()) {
            matches.push({
                from: cursor.from(),
                to: cursor.to()
            });
        }
        
        return matches;
    }
    
    /**
     * Select a specific match
     */
    selectMatch(cm, match) {
        if (!match) return;
        
        cm.setSelection(match.from, match.to);
        cm.scrollIntoView(match.from, 50);
        
        // Clear previous selection highlighting
        cm.operation(() => {
            cm.getAllMarks().forEach(mark => {
                if (mark.className === 'cm-current-search-match') mark.clear();
            });
        });
        
        // Highlight current match differently
        cm.markText(match.from, match.to, {
            className: 'cm-current-search-match'
        });
    }

    // ...existing code...
    
    /**
     * Format code using js-beautify
     */
    formatCode() {
        const mode = this.codeMirror.getMode().name;
        const text = this.codeMirror.getValue();
        
        if (typeof html_beautify === 'undefined' || typeof css_beautify === 'undefined' || typeof js_beautify === 'undefined') {
            this.showNotification('Code formatting libraries not loaded');
            return;
        }
        
        let formatted;
        const options = {
            indent_size: 4,
            indent_char: ' ',
            wrap_line_length: 120,
            preserve_newlines: true,
            max_preserve_newlines: 2
        };
        
        try {
            if (mode === 'javascript' || mode === 'jsx') {
                formatted = js_beautify(text, {
                    ...options,
                    brace_style: 'collapse',
                    keep_array_indentation: false,
                    keep_function_indentation: false,
                    space_before_conditional: true,
                    break_chained_methods: false,
                    eval_code: false,
                    unescape_strings: false,
                    wrap_line_length: 120,
                    end_with_newline: true
                });
            } else if (mode === 'css') {
                formatted = css_beautify(text, {
                    ...options,
                    selector_separator_newline: true,
                    newline_between_rules: true
                });
            } else if (mode === 'xml' || mode === 'htmlmixed') {
                formatted = html_beautify(text, {
                    ...options,
                    extra_liners: ['head', 'body', '/html'],
                    indent_inner_html: true,
                    indent_handlebars: false,
                    indent_scripts: 'keep',
                    wrap_attributes: 'auto',
                    wrap_attributes_indent_size: 4,
                    end_with_newline: true
                });
            } else {
                this.showNotification(`Formatting not supported for ${mode}`);
                return;
            }
            
            if (formatted && formatted !== text) {
                this.codeMirror.setValue(formatted);
                this.showNotification('Code formatted successfully');
            } else {
                this.showNotification('Code is already well-formatted');
            }
        } catch (error) {
            console.error('Formatting error:', error);
            this.showNotification('Error formatting code: ' + error.message);
        }
    }
    
    /**
     * Toggle linting on/off
     */
    toggleLinting() {
        const currentLintOption = this.codeMirror.getOption('lint');
        
        if (currentLintOption) {
            this.codeMirror.setOption('lint', false);
            this.showNotification('Linting disabled');
        } else {
            this.codeMirror.setOption('lint', {
                getAnnotations: (text, callback, options, cm) => {
                    this.performLinting(text, callback, options, cm);
                },
                async: true,
                delay: 300
            });
            this.showNotification('Linting enabled');
        }
    }
    
    /**
     * Get current lint errors and warnings
     */
    getLintStatus() {
        const state = this.codeMirror.state.lint;
        if (!state || !state.marked) {
            return { errors: 0, warnings: 0, infos: 0 };
        }
        
        const annotations = state.marked;
        let errors = 0, warnings = 0, infos = 0;
        
        for (const annotation of annotations) {
            switch (annotation.severity) {
                case 'error': errors++; break;
                case 'warning': warnings++; break;
                case 'info': infos++; break;
            }
        }
        
        return { errors, warnings, infos };
    }
      /**
     * Jump to next lint error
     */
    jumpToNextError() {
        const state = this.codeMirror.state.lint;
        if (!state || !state.marked || state.marked.length === 0) {
            this.showNotification('No lint errors found');
            return;
        }
        
        const cursor = this.codeMirror.getCursor();
        const annotations = state.marked.filter(m => m.severity === 'error');
        
        if (annotations.length === 0) {
            this.showNotification('No errors found');
            return;
        }
        
        // Find next error after cursor
        let nextError = annotations.find(annotation => {
            const pos = annotation.from;
            return pos.line > cursor.line || (pos.line === cursor.line && pos.ch > cursor.ch);
        });
        
        // If no error found after cursor, wrap to first error
        if (!nextError) {
            nextError = annotations[0];
        }
        
        this.codeMirror.setCursor(nextError.from);
        this.codeMirror.scrollIntoView(nextError.from, 50);
        this.showNotification(`Error: ${nextError.message}`);
    }
    
    /**
     * Jump to previous lint error
     */
    jumpToPrevError() {
        const state = this.codeMirror.state.lint;
        if (!state || !state.marked || state.marked.length === 0) {
            this.showNotification('No lint errors found');
            return;
        }
        
        const cursor = this.codeMirror.getCursor();
        const annotations = state.marked.filter(m => m.severity === 'error');
        
        if (annotations.length === 0) {
            this.showNotification('No errors found');
            return;
        }
        
        // Find previous error before cursor
        let prevError = null;
        for (let i = annotations.length - 1; i >= 0; i--) {
            const annotation = annotations[i];
            const pos = annotation.from;
            if (pos.line < cursor.line || (pos.line === cursor.line && pos.ch < cursor.ch)) {
                prevError = annotation;
                break;
            }
        }
        
        // If no error found before cursor, wrap to last error
        if (!prevError) {
            prevError = annotations[annotations.length - 1];
        }
        
        this.codeMirror.setCursor(prevError.from);
        this.codeMirror.scrollIntoView(prevError.from, 50);
        this.showNotification(`Error: ${prevError.message}`);
    }
    
    /**
     * Show lint statistics in status bar or notification
     */
    showLintStats() {
        const stats = this.getLintStatus();
        const total = stats.errors + stats.warnings + stats.infos;
        
        if (total === 0) {
            this.showNotification('✅ No issues found');
        } else {
            let message = `📊 Issues: ${total} total`;
            if (stats.errors > 0) message += `, ${stats.errors} errors`;
            if (stats.warnings > 0) message += `, ${stats.warnings} warnings`;
            if (stats.infos > 0) message += `, ${stats.infos} info`;
            this.showNotification(message);
        }
    }
}