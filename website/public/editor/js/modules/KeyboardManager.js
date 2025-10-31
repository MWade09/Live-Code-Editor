/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * KeyboardManager - Handles keyboard shortcuts and bindings
 */
export class KeyboardManager {    constructor(editor, codeMirror, managers) {
        this.editor = editor;
        this.codeMirror = codeMirror;
        this.searchManager = managers.searchManager;
        this.lintManager = managers.lintManager;
        this.formattingManager = managers.formattingManager;
        
        this.setupKeyboardShortcuts();
    }

    /**
     * Setup all keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const extraKeys = {
            // =====================================================
            // FILE OPERATIONS
            // =====================================================
            "Ctrl-S": cm => this.saveCurrentFile(),
            "Ctrl-Shift-S": cm => this.saveAsFile(),
            "Ctrl-N": cm => this.newFile(),
            "Ctrl-O": cm => this.openFile(),
            "Ctrl-W": cm => this.closeCurrentFile(),
            "Ctrl-Shift-W": cm => this.closeAllFiles(),
            "Ctrl-Shift-T": cm => this.reopenClosedFile(),
            "Ctrl-K Ctrl-S": cm => this.saveAllFiles(),
            
            // =====================================================
            // BASIC TEXT OPERATIONS
            // =====================================================
            "Ctrl-Z": "undo",
            "Ctrl-Y": "redo",
            "Ctrl-Shift-Z": "redo",
            "Ctrl-X": cm => this.cutSelection(cm),
            "Ctrl-C": cm => this.copySelection(cm),
            "Ctrl-V": cm => this.pasteText(cm),
            "Ctrl-A": "selectAll",
            
            // =====================================================
            // ENHANCED NAVIGATION
            // =====================================================
            "Ctrl-Home": cm => this.goToFileStart(cm),
            "Ctrl-End": cm => this.goToFileEnd(cm),
            "Ctrl-Right": "goWordRight",
            "Ctrl-Left": "goWordLeft",
            "Ctrl-Up": cm => this.scrollLineUp(cm),
            "Ctrl-Down": cm => this.scrollLineDown(cm),
            "Home": "goLineStart",
            "End": "goLineEnd",
            "Ctrl-G": "jumpToLine",
            "Ctrl-P": cm => this.quickOpen(),
            
            // =====================================================
            // ADVANCED SELECTION
            // =====================================================
            "Ctrl-L": cm => this.selectLine(cm),
            "Ctrl-Shift-Right": "selectWordRight",
            "Ctrl-Shift-Left": "selectWordLeft",
            "Ctrl-Shift-Home": cm => this.selectToFileStart(cm),
            "Ctrl-Shift-End": cm => this.selectToFileEnd(cm),
            "Shift-Home": "selectLineStart",
            "Shift-End": "selectLineEnd",
            "Alt-Shift-Right": cm => this.expandSelection(cm),
            "Alt-Shift-Left": cm => this.shrinkSelection(cm),
            "Ctrl-U": cm => this.cursorUndo(cm),
            
            // =====================================================
            // QUICK LINE OPERATIONS
            // =====================================================
            "Ctrl-Enter": cm => this.insertLineBelow(cm),
            "Ctrl-Shift-Enter": cm => this.insertLineAbove(cm),
            "Alt-Up": cm => this.moveLineUp(cm),
            "Alt-Down": cm => this.moveLineDown(cm),
            "Ctrl-Shift-K": cm => this.deleteLines(cm),
            "Ctrl-K Ctrl-D": cm => this.duplicateLine(cm),
            "Ctrl-J": cm => this.joinLines(cm),
            "Ctrl-Shift-\\": cm => this.jumpToMatchingBracket(cm),
            
            // =====================================================
            // AUTOCOMPLETE & SUGGESTIONS
            // =====================================================
            "Ctrl-Space": "autocomplete",
            "Alt-Space": "autocomplete",
            "Ctrl-.": "autocomplete",
            "Ctrl-Shift-Space": cm => this.showParameterHints(cm),
            "Ctrl-I": cm => this.triggerSuggest(cm),
            
            // =====================================================
            // BRACKET MATCHING & NAVIGATION
            // =====================================================
            "Ctrl-M": "goToBracket",
            "Ctrl-Shift-M": cm => this.selectBrackets(cm),
            "Ctrl-Shift-\\": "goToBracket",
            
            // =====================================================
            // SMART INDENTATION
            // =====================================================
            "Ctrl-]": cm => this.indentMore(cm),
            "Ctrl-[": cm => this.indentLess(cm),
            "Ctrl-Shift-I": cm => this.autoIndentSelection(cm),
            "Tab": cm => this.smartTab(cm),
            "Shift-Tab": cm => this.smartShiftTab(cm),
            
            // =====================================================
            // CODE FOLDING
            // =====================================================
            "Ctrl-Shift-[": cm => cm.foldCode(cm.getCursor()),
            "Ctrl-Shift-]": cm => cm.unfoldCode(cm.getCursor()),
            "Ctrl-K Ctrl-[": cm => this.foldAll(),
            "Ctrl-K Ctrl-]": cm => this.unfoldAll(),
            "Ctrl-K Ctrl-0": cm => this.foldAll(),
            "Ctrl-K Ctrl-J": cm => this.unfoldAll(),
            "F9": cm => cm.foldCode(cm.getCursor()),
            "Shift-F9": cm => cm.unfoldCode(cm.getCursor()),
            
            // =====================================================
            // MULTIPLE CURSORS & SELECTION
            // =====================================================
            "Ctrl-D": cm => this.selectNextOccurrence(cm),
            "Ctrl-K Ctrl-D": cm => this.skipNextOccurrence(cm),
            "Ctrl-Shift-L": cm => this.selectAllOccurrences(cm),
            "Alt-Click": cm => this.addCursorAtClick(cm),
            "Ctrl-Alt-Up": cm => this.addCursorAbove(cm),
            "Ctrl-Alt-Down": cm => this.addCursorBelow(cm),
            "Escape": cm => this.clearMultipleSelections(cm),
            
            // =====================================================
            // COLUMN SELECTION
            // =====================================================
            "Shift-Alt-Down": cm => this.columnSelectionDown(cm),
            "Shift-Alt-Up": cm => this.columnSelectionUp(cm),
            "Shift-Alt-Right": cm => this.columnSelectionRight(cm),
            "Shift-Alt-Left": cm => this.columnSelectionLeft(cm),
            
            // =====================================================
            // SEARCH AND REPLACE
            // =====================================================
            "Ctrl-F": cm => this.searchManager.showSearch(),
            "Ctrl-H": cm => this.searchManager.showReplace(),
            "Ctrl-Shift-F": cm => this.searchManager.showGlobalSearch(),
            "Ctrl-Shift-H": cm => this.searchManager.showGlobalReplace(),
            "F3": "findNext",
            "Shift-F3": "findPrev",
            "Ctrl-F3": cm => this.findCurrentWord(cm),
            "Ctrl-Shift-F3": cm => this.findCurrentWordPrev(cm),
            "Alt-Enter": cm => this.selectAllMatches(cm),
            
            // =====================================================
            // COMMENTING
            // =====================================================
            "Ctrl-/": cm => this.toggleComment(cm),
            "Ctrl-Shift-/": cm => this.toggleBlockComment(cm),
            "Alt-Shift-A": cm => this.toggleBlockComment(cm),
            
            // =====================================================
            // CODE QUALITY & FORMATTING
            // =====================================================
            "F1": cm => {
                console.log('⌨️ F1 pressed - opening command palette');
                this.showCommandPalette();
                return CodeMirror.Pass; // Let other handlers run if needed
            },
            "Ctrl-Shift-P": cm => {
                console.log('⌨️ Ctrl+Shift+P pressed - opening command palette');
                this.showCommandPalette();
                // Return false to prevent default browser behavior (print dialog)
                return false;
            }, // Command Palette (primary shortcut)
            "Alt-Shift-F": cm => this.formattingManager.formatCode(),
            "Ctrl-K Ctrl-F": cm => this.formattingManager.formatSelection(),
            "F8": cm => this.lintManager.jumpToNextError(),
            "Shift-F8": cm => this.lintManager.jumpToPrevError(),
            "Ctrl-Shift-M": cm => this.lintManager.showLintStats(),
            
            // =====================================================
            // VIEW CONTROLS
            // =====================================================
            "Ctrl-=": cm => this.zoomIn(),
            "Ctrl--": cm => this.zoomOut(),
            "Ctrl-0": cm => this.resetZoom(),
            "Ctrl-B": cm => this.toggleSidebar(),
            "Ctrl-Shift-E": cm => this.toggleFileExplorer(),
            "Ctrl-`": cm => this.toggleTerminal(),
            "F11": cm => this.toggleFullscreen(),
            "Ctrl-K Z": cm => this.toggleZenMode(),
            
            // =====================================================
            // MINIMAP & EDITOR ENHANCEMENTS
            // =====================================================
            "Ctrl-Alt-M": () => this.managers.minimapManager?.toggleMinimap(),
            "Ctrl-Shift-Alt-M": () => this.managers.minimapManager?.toggleViewport(),
            "Ctrl-Alt-L": () => this.managers.lineHighlightManager?.toggleRelativeLineNumbers(),
            "Ctrl-Alt-I": () => this.managers.lineHighlightManager?.toggleIndentGuides(),
            "Ctrl-Alt-C": () => this.managers.lineHighlightManager?.toggleCursorAnimation(),
            "F7": () => this.managers.lineHighlightManager?.toggleRelativeLineNumbers(),
            
            // =====================================================
            // BOOKMARKS & NAVIGATION
            // =====================================================
            "Ctrl-K Ctrl-K": cm => this.toggleBookmark(cm),
            "Ctrl-K Ctrl-N": cm => this.nextBookmark(cm),
            "Ctrl-K Ctrl-P": cm => this.prevBookmark(cm),
            "Ctrl-K Ctrl-L": cm => this.clearAllBookmarks(cm),
            
            // =====================================================
            // WORD WRAP & WHITESPACE
            // =====================================================
            "Alt-Z": cm => this.toggleWordWrap(cm),
            "Ctrl-Shift-W": cm => this.showWhitespace(cm), // Changed from Ctrl-Shift-P to avoid printer conflict
            
            // =====================================================
            // EMMET SHORTCUTS
            // =====================================================
            "Shift-Enter": (cm) => this.handleEmmetExpansion(cm, 'shift-enter'),
            "Ctrl-Shift-;": cm => this.emmetWrapWithAbbreviation(cm),
            "Ctrl-Shift-'": cm => this.emmetRemoveTag(cm),
            
            // =====================================================
            // QUICK FIXES & REFACTORING
            // =====================================================
            "Ctrl-Shift-R": cm => this.renameSymbol(cm),
            "F2": cm => this.renameSymbol(cm),
            "F12": cm => this.goToDefinition(cm),
            "Alt-F12": cm => this.peekDefinition(cm),
            "Shift-F12": cm => this.findAllReferences(cm),
            "Ctrl-T": cm => this.goToSymbol(cm),
            "Ctrl-Shift-O": cm => this.goToSymbolInFile(cm),
            
            // =====================================================
            // HELP & SHORTCUTS
            // =====================================================
            "Ctrl-?": cm => this.showKeyboardShortcuts(),
            "Ctrl-K Ctrl-H": cm => this.showKeyboardShortcuts()
        };
        
        // Apply keyboard shortcuts to CodeMirror
        this.codeMirror.setOption('extraKeys', extraKeys);
        
        // Add keydown listener for more complex Emmet handling
        this.codeMirror.on('keydown', (cm, e) => this.handleKeyDown(cm, e));
    }

    /**
     * Handle keydown events for enhanced functionality
     */
    handleKeyDown(cm, e) {
        const mode = cm.getMode().name;
        
        // Enhanced autocomplete triggers with Emmet support
        if ((e.ctrlKey && e.key === ' ') || 
            (e.altKey && e.key === ' ') || 
            (e.ctrlKey && e.key === '.') ||
            (e.key === 'Tab' && this.shouldTriggerEmmet(cm))) {
            
            // Don't prevent default for Tab if it's not an Emmet context
            if (e.key === 'Tab' && !this.shouldTriggerEmmet(cm)) {
                return;
            }
            
            e.preventDefault();
            cm.showHint({
                hint: cm.getOption('hintOptions').hint,
                completeSingle: false
            });
            return;
        }
    }

    /**
     * Handle Emmet expansion from extraKeys
     */
    handleEmmetExpansion(cm, trigger) {
        const mode = cm.getMode().name;
        
        // Only process HTML and CSS modes
        if (mode !== 'xml' && mode !== 'htmlmixed' && mode !== 'css') {
            return CodeMirror.Pass; // Let CodeMirror handle normally
        }
        
        this.triggerEmmetExpansion(cm);
    }

    // =====================================================
    // BRACKET MATCHING AND NAVIGATION
    // =====================================================
    
    selectBrackets(cm) {
        const cursor = cm.getCursor();
        const match = cm.findMatchingBracket(cursor);
        
        if (match && match.match) {
            const start = match.from;
            const end = match.to;
            
            if (start && end) {
                cm.setSelection(start, end);
                this.editor.showNotification('Bracket pair selected');
            }
        } else {
            this.editor.showNotification('No matching bracket found');
        }
    }

    // =====================================================
    // SMART INDENTATION
    // =====================================================
    
    indentMore(cm) {
        const selections = cm.listSelections();
        if (selections.length === 0) return;
        
        cm.operation(() => {
            for (const selection of selections) {
                const start = Math.min(selection.anchor.line, selection.head.line);
                const end = Math.max(selection.anchor.line, selection.head.line);
                
                for (let line = start; line <= end; line++) {
                    cm.indentLine(line, 'add');
                }
            }
        });
    }
    
    indentLess(cm) {
        const selections = cm.listSelections();
        if (selections.length === 0) return;
        
        cm.operation(() => {
            for (const selection of selections) {
                const start = Math.min(selection.anchor.line, selection.head.line);
                const end = Math.max(selection.anchor.line, selection.head.line);
                
                for (let line = start; line <= end; line++) {
                    cm.indentLine(line, 'subtract');
                }
            }
        });
    }
    
    autoIndentSelection(cm) {
        const selections = cm.listSelections();
        if (selections.length === 0) return;
        
        cm.operation(() => {
            for (const selection of selections) {
                const start = Math.min(selection.anchor.line, selection.head.line);
                const end = Math.max(selection.anchor.line, selection.head.line);
                
                for (let line = start; line <= end; line++) {
                    cm.indentLine(line, 'smart');
                }
            }
        });
        
        this.editor.showNotification('Auto-indented selection');
    }
    
    smartTab(cm) {
        if (cm.somethingSelected()) {
            this.indentMore(cm);
        } else {
            cm.replaceSelection('    '); // Insert 4 spaces
        }
    }

    smartShiftTab(cm) {
        const mode = cm.getMode().name;
        
        // Try Emmet expansion first in HTML/CSS modes
        if ((mode === 'xml' || mode === 'htmlmixed' || mode === 'css') && this.shouldTriggerEmmet(cm)) {
            this.triggerEmmetExpansion(cm);
        } else {
            // Default behavior: reduce indentation
            this.indentLess(cm);
        }
    }

    // =====================================================
    // CODE FOLDING
    // =====================================================
    
    foldAll() {
        const cm = this.codeMirror;
        cm.operation(() => {
            for (let i = cm.firstLine(); i <= cm.lastLine(); i++) {
                cm.foldCode({ line: i, ch: 0 }, null, 'fold');
            }
        });
        this.editor.showNotification('All code folded');
    }
    
    unfoldAll() {
        const cm = this.codeMirror;
        cm.operation(() => {
            for (let i = cm.firstLine(); i <= cm.lastLine(); i++) {
                cm.foldCode({ line: i, ch: 0 }, null, 'unfold');
            }
        });
        this.editor.showNotification('All code unfolded');
    }

    // =====================================================
    // MULTIPLE CURSOR SUPPORT
    // =====================================================
    
    selectNextOccurrence(cm) {
        const selection = cm.getSelection();
        if (!selection) {
            // If no selection, select word under cursor
            const cursor = cm.getCursor();
            const word = cm.findWordAt(cursor);
            cm.setSelection(word.anchor, word.head);
            return;
        }
        
        const cursor = cm.getSearchCursor(selection, cm.getCursor());
        if (cursor.findNext()) {
            cm.addSelection(cursor.from(), cursor.to());
        } else {
            // Wrap around to beginning
            const cursor2 = cm.getSearchCursor(selection, { line: 0, ch: 0 });
            if (cursor2.findNext()) {
                cm.addSelection(cursor2.from(), cursor2.to());
            }
        }
    }
    
    selectAllOccurrences(cm) {
        const selection = cm.getSelection();
        if (!selection) return;
        
        const selections = [];
        const cursor = cm.getSearchCursor(selection, { line: 0, ch: 0 });
        
        while (cursor.findNext()) {
            selections.push({
                anchor: cursor.from(),
                head: cursor.to()
            });
        }
        
        if (selections.length > 0) {
            cm.setSelections(selections);
            this.editor.showNotification(`Selected ${selections.length} occurrences`);
        }
    }
    
    addCursorAtClick(cm) {
        // This would be handled by CodeMirror's built-in Alt+Click functionality
        this.editor.showNotification('Hold Alt and click to add cursor');
    }
    
    addCursorAbove(cm) {
        const cursor = cm.getCursor();
        if (cursor.line > 0) {
            const newCursor = { line: cursor.line - 1, ch: cursor.ch };
            cm.addSelection(newCursor, newCursor);
        }
    }
    
    addCursorBelow(cm) {
        const cursor = cm.getCursor();
        if (cursor.line < cm.lastLine()) {
            const newCursor = { line: cursor.line + 1, ch: cursor.ch };
            cm.addSelection(newCursor, newCursor);
        }
    }
    
    clearMultipleSelections(cm) {
        const selections = cm.listSelections();
        if (selections.length > 1) {
            cm.setSelection(selections[0].anchor, selections[0].head);
            this.editor.showNotification('Multiple cursors cleared');
        }
    }

    // =====================================================
    // LINE MANIPULATION
    // =====================================================
    
    deleteLines(cm) {
        const selections = cm.listSelections();
        
        cm.operation(() => {
            // Sort selections by line number (descending) to avoid index shifting
            const linesToDelete = new Set();
            
            for (const selection of selections) {
                const start = Math.min(selection.anchor.line, selection.head.line);
                const end = Math.max(selection.anchor.line, selection.head.line);
                
                for (let line = start; line <= end; line++) {
                    linesToDelete.add(line);
                }
            }
            
            // Delete lines in reverse order
            const sortedLines = Array.from(linesToDelete).sort((a, b) => b - a);
            for (const line of sortedLines) {
                const lineStart = { line: line, ch: 0 };
                const lineEnd = { line: line + 1, ch: 0 };
                cm.replaceRange('', lineStart, lineEnd);
            }
        });
    }
    
    moveLineUp(cm) {
        const selections = cm.listSelections();
        
        cm.operation(() => {
            for (const selection of selections) {
                const line = selection.anchor.line;
                if (line > 0) {
                    const lineText = cm.getLine(line);
                    const prevLineText = cm.getLine(line - 1);
                    
                    cm.replaceRange(lineText + '\n', { line: line - 1, ch: 0 }, { line: line, ch: 0 });
                    cm.replaceRange(prevLineText, { line: line, ch: 0 }, { line: line, ch: prevLineText.length });
                    
                    // Update cursor position
                    cm.setCursor({ line: line - 1, ch: selection.anchor.ch });
                }
            }
        });
    }
    
    moveLineDown(cm) {
        const selections = cm.listSelections();
        
        cm.operation(() => {
            for (const selection of selections) {
                const line = selection.anchor.line;
                if (line < cm.lastLine()) {
                    const lineText = cm.getLine(line);
                    const nextLineText = cm.getLine(line + 1);
                    
                    cm.replaceRange(nextLineText, { line: line, ch: 0 }, { line: line, ch: lineText.length });
                    cm.replaceRange('\n' + lineText, { line: line + 1, ch: 0 }, { line: line + 2, ch: 0 });
                    
                    // Update cursor position
                    cm.setCursor({ line: line + 1, ch: selection.anchor.ch });
                }
            }
        });
    }
    
    toggleComment(cm) {
        const mode = cm.getMode().name;
        let commentPrefix = '// ';
        
        // Determine comment style based on file type
        if (mode === 'css') {
            commentPrefix = '/* ';
        } else if (mode === 'xml' || mode === 'htmlmixed') {
            commentPrefix = '<!-- ';
        } else if (mode === 'python') {
            commentPrefix = '# ';
        }
        
        const selections = cm.listSelections();
        
        cm.operation(() => {
            for (const selection of selections) {
                const start = Math.min(selection.anchor.line, selection.head.line);
                const end = Math.max(selection.anchor.line, selection.head.line);
                
                for (let line = start; line <= end; line++) {
                    const lineText = cm.getLine(line);
                    const trimmed = lineText.trim();
                    
                    if (trimmed.startsWith(commentPrefix.trim())) {
                        // Uncomment
                        const index = lineText.indexOf(commentPrefix.trim());
                        const newText = lineText.substring(0, index) + lineText.substring(index + commentPrefix.length);
                        cm.replaceRange(newText, { line: line, ch: 0 }, { line: line, ch: lineText.length });
                    } else if (trimmed.length > 0) {
                        // Comment
                        const indent = lineText.match(/^\s*/)[0];
                        const newText = indent + commentPrefix + lineText.substring(indent.length);
                        cm.replaceRange(newText, { line: line, ch: 0 }, { line: line, ch: lineText.length });
                    }
                }
            }
        });
    }

    // =====================================================
    // COLUMN SELECTION
    // =====================================================
    
    columnSelectionDown(cm) {
        const selections = cm.listSelections();
        const lastSelection = selections[selections.length - 1];
        const line = lastSelection.head.line;
        const ch = lastSelection.head.ch;
        
        if (line < cm.lastLine()) {
            const newSelection = {
                anchor: { line: line + 1, ch: ch },
                head: { line: line + 1, ch: ch }
            };
            cm.addSelection(newSelection.anchor, newSelection.head);
        }
    }
    
    columnSelectionUp(cm) {
        const selections = cm.listSelections();
        const lastSelection = selections[selections.length - 1];
        const line = lastSelection.head.line;
        const ch = lastSelection.head.ch;
        
        if (line > 0) {
            const newSelection = {
                anchor: { line: line - 1, ch: ch },
                head: { line: line - 1, ch: ch }
            };
            cm.addSelection(newSelection.anchor, newSelection.head);
        }
    }

    columnSelectionRight(cm) {
        const selections = cm.listSelections();
        cm.operation(() => {
            const newSelections = selections.map(sel => ({
                anchor: { line: sel.anchor.line, ch: sel.anchor.ch + 1 },
                head: { line: sel.head.line, ch: sel.head.ch + 1 }
            }));
            cm.setSelections(newSelections);
        });
    }

    columnSelectionLeft(cm) {
        const selections = cm.listSelections();
        cm.operation(() => {
            const newSelections = selections.map(sel => ({
                anchor: { line: sel.anchor.line, ch: Math.max(0, sel.anchor.ch - 1) },
                head: { line: sel.head.line, ch: Math.max(0, sel.head.ch - 1) }
            }));
            cm.setSelections(newSelections);
        });
    }

    /**
     * Trigger Emmet expansion
     */
    triggerEmmetExpansion(cm = this.codeMirror) {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        const beforeCursor = line.substring(0, cursor.ch);
        const mode = cm.getMode().name;

        // Try to expand Emmet abbreviation
        if (this.editor && this.editor.tryEmmetExpansion) {
            const emmetSuggestion = this.editor.tryEmmetExpansion(beforeCursor, mode);
            if (emmetSuggestion) {
                const from = CodeMirror.Pos(cursor.line, emmetSuggestion.from);
                const to = CodeMirror.Pos(cursor.line, cursor.ch);
                cm.replaceRange(emmetSuggestion.text, from, to);
                
                // Position cursor appropriately
                this.positionCursorAfterEmmet(emmetSuggestion.text, from, cm);
            }
        }
    }

    /**
     * Check if Tab should trigger Emmet
     */
    shouldTriggerEmmet(cm = this.codeMirror) {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        const beforeCursor = line.substring(0, cursor.ch);
        const mode = cm.getMode().name;

        // Only in HTML/CSS modes
        if (mode !== 'xml' && mode !== 'htmlmixed' && mode !== 'css') {
            return false;
        }

        // Check if there's a potential Emmet abbreviation
        const emmetMatch = beforeCursor.match(/([a-zA-Z0-9\.\#\[\]\*\+\>\^\$\{\}]+)$/);
        return emmetMatch && emmetMatch[1].length > 1;
    }

    /**
     * Position cursor after Emmet expansion
     */
    positionCursorAfterEmmet(expandedText, startPos, cm = this.codeMirror) {
        // Look for common cursor positions in expanded text
        const cursorMarkers = [
            '></div>',
            '></span>',
            '></p>',
            '></h1>',
            '></h2>',
            '></h3>',
            '></h4>',
            '></h5>',
            '></h6>',
            '></li>',
            '></a>',
            '></button>',
            'href=""',
            'src=""',
            'alt=""',
            'type=""'
        ];

        let cursorOffset = 0;
        for (const marker of cursorMarkers) {
            const index = expandedText.indexOf(marker);
            if (index !== -1) {
                if (marker.includes('=""')) {
                    cursorOffset = index + marker.length - 1; // Position inside quotes
                } else {
                    cursorOffset = index + 1; // Position after opening tag
                }
                break;
            }
        }

        if (cursorOffset > 0) {
            const lines = expandedText.substring(0, cursorOffset).split('\n');
            const newLine = startPos.line + lines.length - 1;
            const newCh = lines.length === 1 ? 
                startPos.ch + cursorOffset : 
                lines[lines.length - 1].length;
            
            cm.setCursor(newLine, newCh);
        }
    }

    // =====================================================
    // NEW KEYBOARD SHORTCUT IMPLEMENTATIONS
    // =====================================================

    // =====================================================
    // FILE OPERATIONS
    // =====================================================
    
    saveCurrentFile() {
        if (this.editor && this.editor.fileManager) {
            this.editor.fileManager.saveCurrentFile();
        } else {
            this.showNotification('Save current file');
            // Trigger download of current content as fallback
            this.downloadCurrentFile();
        }
    }

    saveAsFile() {
        if (this.editor && this.editor.fileManager) {
            this.editor.fileManager.saveAsFile();
        } else {
            this.downloadCurrentFile('untitled');
        }
    }

    downloadCurrentFile(filename = 'editor-content') {
        const content = this.codeMirror.getValue();
        const mode = this.codeMirror.getMode().name;
        const extension = this.getFileExtensionFromMode(mode);
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('File downloaded');
    }

    getFileExtensionFromMode(mode) {
        const extensions = {
            'javascript': '.js',
            'python': '.py',
            'xml': '.html',
            'htmlmixed': '.html',
            'css': '.css',
            'markdown': '.md',
            'json': '.json',
            'typescript': '.ts',
            'jsx': '.jsx',
            'tsx': '.tsx',
            'vue': '.vue',
            'php': '.php',
            'sql': '.sql',
            'yaml': '.yml'
        };
        return extensions[mode] || '.txt';
    }

    newFile() {
        if (this.editor && this.editor.fileManager) {
            this.editor.fileManager.newFile();
        } else {
            this.codeMirror.setValue('');
            this.showNotification('New file created');
        }
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js,.ts,.html,.css,.json,.md,.txt,.py,.php,.vue,.jsx,.tsx';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.codeMirror.setValue(e.target.result);
                    this.showNotification(`Opened ${file.name}`);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    closeCurrentFile() {
        if (this.editor && this.editor.fileManager) {
            this.editor.fileManager.closeCurrentFile();
        } else {
            this.showNotification('Close current file');
        }
    }

    closeAllFiles() {
        if (this.editor && this.editor.fileManager) {
            this.editor.fileManager.closeAllFiles();
        } else {
            this.showNotification('Close all files');
        }
    }

    reopenClosedFile() {
        if (this.editor && this.editor.fileManager) {
            this.editor.fileManager.reopenClosedFile();
        } else {
            this.showNotification('Reopen last closed file');
        }
    }

    saveAllFiles() {
        if (this.editor && this.editor.fileManager) {
            this.editor.fileManager.saveAllFiles();
        } else {
            this.saveCurrentFile();
        }
    }

    // =====================================================
    // BASIC TEXT OPERATIONS
    // =====================================================

    cutSelection(cm) {
        const selection = cm.getSelection();
        if (selection) {
            navigator.clipboard.writeText(selection);
            cm.replaceSelection('');
            this.showNotification('Cut to clipboard');
        }
    }

    copySelection(cm) {
        const selection = cm.getSelection();
        if (selection) {
            navigator.clipboard.writeText(selection);
            this.showNotification('Copied to clipboard');
        } else {
            // Copy current line if no selection
            const cursor = cm.getCursor();
            const line = cm.getLine(cursor.line);
            navigator.clipboard.writeText(line + '\n');
            this.showNotification('Copied line to clipboard');
        }
    }

    async pasteText(cm) {
        try {
            const text = await navigator.clipboard.readText();
            cm.replaceSelection(text);
            this.showNotification('Pasted from clipboard');
        } catch (err) {
            this.showNotification('Could not paste from clipboard');
        }
    }

    // =====================================================
    // ENHANCED NAVIGATION
    // =====================================================

    goToFileStart(cm) {
        cm.setCursor(0, 0);
        this.showNotification('Go to file start');
    }

    goToFileEnd(cm) {
        const lastLine = cm.lastLine();
        cm.setCursor(lastLine, cm.getLine(lastLine).length);
        this.showNotification('Go to file end');
    }

    scrollLineUp(cm) {
        const info = cm.getScrollInfo();
        cm.scrollTo(null, info.top - cm.defaultTextHeight());
    }

    scrollLineDown(cm) {
        const info = cm.getScrollInfo();
        cm.scrollTo(null, info.top + cm.defaultTextHeight());
    }

    quickOpen() {
        if (this.editor && this.editor.fileManager) {
            this.editor.fileManager.showQuickOpen();
        } else {
            this.showNotification('Quick Open (Ctrl+P)');
            this.openFile();
        }
    }

    // =====================================================
    // ADVANCED SELECTION
    // =====================================================

    selectLine(cm) {
        const cursor = cm.getCursor();
        cm.setSelection(
            { line: cursor.line, ch: 0 },
            { line: cursor.line + 1, ch: 0 }
        );
    }

    selectToFileStart(cm) {
        const cursor = cm.getCursor();
        cm.setSelection({ line: 0, ch: 0 }, cursor);
    }

    selectToFileEnd(cm) {
        const cursor = cm.getCursor();
        const lastLine = cm.lastLine();
        cm.setSelection(cursor, { line: lastLine, ch: cm.getLine(lastLine).length });
    }

    expandSelection(cm) {
        const selections = cm.listSelections();
        cm.operation(() => {
            for (let i = 0; i < selections.length; i++) {
                const sel = selections[i];
                const start = sel.anchor;
                const end = sel.head;
                
                // Expand selection by one character in each direction
                const newStart = start.ch > 0 ? 
                    { line: start.line, ch: start.ch - 1 } : 
                    start.line > 0 ? { line: start.line - 1, ch: cm.getLine(start.line - 1).length } : start;
                
                const lineLength = cm.getLine(end.line).length;
                const newEnd = end.ch < lineLength ? 
                    { line: end.line, ch: end.ch + 1 } : 
                    end.line < cm.lastLine() ? { line: end.line + 1, ch: 0 } : end;
                
                cm.setSelection(newStart, newEnd);
            }
        });
    }

    shrinkSelection(cm) {
        const selections = cm.listSelections();
        cm.operation(() => {
            for (let i = 0; i < selections.length; i++) {
                const sel = selections[i];
                const start = sel.anchor;
                const end = sel.head;
                
                // Shrink selection by one character from each direction
                const newStart = { line: start.line, ch: start.ch + 1 };
                const newEnd = { line: end.line, ch: Math.max(end.ch - 1, start.ch + 1) };
                
                if (newStart.ch < newEnd.ch || newStart.line < newEnd.line) {
                    cm.setSelection(newStart, newEnd);
                }
            }
        });
    }

    cursorUndo(cm) {
        // Undo cursor movement
        const history = cm.getDoc().getHistory();
        if (history.done.length > 0) {
            cm.undo();
        }
    }

    // =====================================================
    // QUICK LINE OPERATIONS
    // =====================================================

    insertLineBelow(cm) {
        const cursor = cm.getCursor();
        const lineEnd = { line: cursor.line, ch: cm.getLine(cursor.line).length };
        cm.replaceRange('\n', lineEnd);
        cm.setCursor(cursor.line + 1, 0);
    }

    insertLineAbove(cm) {
        const cursor = cm.getCursor();
        const lineStart = { line: cursor.line, ch: 0 };
        cm.replaceRange('\n', lineStart);
        cm.setCursor(cursor.line, 0);
    }

    duplicateLine(cm) {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        const lineEnd = { line: cursor.line, ch: line.length };
        cm.replaceRange('\n' + line, lineEnd);
        this.showNotification('Line duplicated');
    }

    joinLines(cm) {
        const cursor = cm.getCursor();
        if (cursor.line < cm.lastLine()) {
            const currentLine = cm.getLine(cursor.line);
            const nextLine = cm.getLine(cursor.line + 1);
            const newLine = currentLine + ' ' + nextLine.trim();
            
            cm.replaceRange(newLine, 
                { line: cursor.line, ch: 0 }, 
                { line: cursor.line + 1, ch: nextLine.length }
            );
            this.showNotification('Lines joined');
        }
    }

    jumpToMatchingBracket(cm) {
        const cursor = cm.getCursor();
        const match = cm.findMatchingBracket(cursor);
        if (match && match.to) {
            cm.setCursor(match.to);
            this.showNotification('Jumped to matching bracket');
        }
    }

    // =====================================================
    // ENHANCED AUTOCOMPLETE
    // =====================================================

    showParameterHints(cm) {
        this.showNotification('Parameter hints');
        // Could implement parameter hints here
    }

    triggerSuggest(cm) {
        cm.showHint({
            hint: cm.getOption('hintOptions').hint,
            completeSingle: false
        });
    }

    // =====================================================
    // MULTIPLE CURSOR ENHANCEMENTS
    // =====================================================

    skipNextOccurrence(cm) {
        // Skip the next occurrence of current selection
        const selection = cm.getSelection();
        if (!selection) return;
        
        const cursor = cm.getSearchCursor(selection, cm.getCursor());
        if (cursor.findNext()) {
            cm.setCursor(cursor.to());
            this.showNotification('Skipped next occurrence');
        }
    }

    // =====================================================
    // COLUMN SELECTION ENHANCEMENTS
    // =====================================================

    // =====================================================
    // ENHANCED SEARCH
    // =====================================================

    findCurrentWord(cm) {
        const cursor = cm.getCursor();
        const word = cm.findWordAt(cursor);
        const wordText = cm.getRange(word.anchor, word.head);
        cm.setSelection(word.anchor, word.head);
        
        // Find next occurrence
        const searchCursor = cm.getSearchCursor(wordText, word.head);
        if (searchCursor.findNext()) {
            cm.setSelection(searchCursor.from(), searchCursor.to());
        }
    }

    findCurrentWordPrev(cm) {
        const cursor = cm.getCursor();
        const word = cm.findWordAt(cursor);
        const wordText = cm.getRange(word.anchor, word.head);
        
        // Find previous occurrence
        const searchCursor = cm.getSearchCursor(wordText, word.anchor);
        if (searchCursor.findPrevious()) {
            cm.setSelection(searchCursor.from(), searchCursor.to());
        }
    }

    selectAllMatches(cm) {
        const selection = cm.getSelection();
        if (!selection) return;
        
        this.selectAllOccurrences(cm);
    }

    // =====================================================
    // ENHANCED COMMENTING
    // =====================================================

    toggleBlockComment(cm) {
        const mode = cm.getMode().name;
        let blockStart = '/*';
        let blockEnd = '*/';
        
        if (mode === 'xml' || mode === 'htmlmixed') {
            blockStart = '<!--';
            blockEnd = '-->';
        }
        
        const selection = cm.getSelection();
        if (selection.includes(blockStart) && selection.includes(blockEnd)) {
            // Remove block comment
            const newText = selection.replace(new RegExp(`\\${blockStart}`, 'g'), '')
                                   .replace(new RegExp(`\\${blockEnd}`, 'g'), '');
            cm.replaceSelection(newText);
        } else {
            // Add block comment
            cm.replaceSelection(`${blockStart} ${selection} ${blockEnd}`);
        }
    }

    // =====================================================
    // VIEW CONTROLS
    // =====================================================

    showCommandPalette() {
        console.log('🎯 KeyboardManager.showCommandPalette called', { hasManager: !!this.commandPaletteManager });
        // Use CommandPaletteManager if available
        if (this.commandPaletteManager) {
            console.log('✅ Calling commandPaletteManager.show()');
            this.commandPaletteManager.show();
        } else {
            console.warn('❌ No commandPaletteManager available');
            this.showNotification('Command Palette loading...');
        }
    }

    zoomIn() {
        const currentSize = parseInt(this.codeMirror.getWrapperElement().style.fontSize || '14');
        this.codeMirror.getWrapperElement().style.fontSize = (currentSize + 1) + 'px';
        this.showNotification(`Zoom: ${currentSize + 1}px`);
    }

    zoomOut() {
        const currentSize = parseInt(this.codeMirror.getWrapperElement().style.fontSize || '14');
        if (currentSize > 8) {
            this.codeMirror.getWrapperElement().style.fontSize = (currentSize - 1) + 'px';
            this.showNotification(`Zoom: ${currentSize - 1}px`);
        }
    }

    resetZoom() {
        this.codeMirror.getWrapperElement().style.fontSize = '14px';
        this.showNotification('Zoom reset to 14px');
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar, .file-explorer, .left-panel');
        if (sidebar) {
            sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
            this.showNotification('Sidebar toggled');
        }
    }

    toggleFileExplorer() {
        this.toggleSidebar();
    }

    toggleTerminal() {
        const terminal = document.querySelector('.terminal, .bottom-panel');
        if (terminal) {
            terminal.style.display = terminal.style.display === 'none' ? 'block' : 'none';
            this.showNotification('Terminal toggled');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            this.showNotification('Entered fullscreen');
        } else {
            document.exitFullscreen();
            this.showNotification('Exited fullscreen');
        }
    }

    toggleZenMode() {
        document.body.classList.toggle('zen-mode');
        const isZen = document.body.classList.contains('zen-mode');
        this.showNotification(isZen ? 'Zen mode enabled' : 'Zen mode disabled');
    }

    // =====================================================
    // BOOKMARKS & NAVIGATION
    // =====================================================

    toggleBookmark(cm) {
        const cursor = cm.getCursor();
        const existing = cm.findMarksAt(cursor);
        const bookmark = existing.find(mark => mark.className === 'bookmark');
        
        if (bookmark) {
            bookmark.clear();
            this.showNotification('Bookmark removed');
        } else {
            cm.setBookmark(cursor, { className: 'bookmark' });
            this.showNotification('Bookmark added');
        }
    }

    nextBookmark(cm) {
        this.showNotification('Go to next bookmark');
        // Implementation would require bookmark tracking
    }

    prevBookmark(cm) {
        this.showNotification('Go to previous bookmark');
        // Implementation would require bookmark tracking
    }

    clearAllBookmarks(cm) {
        const marks = cm.getAllMarks();
        marks.forEach(mark => {
            if (mark.className === 'bookmark') {
                mark.clear();
            }
        });
        this.showNotification('All bookmarks cleared');
    }

    // =====================================================
    // WORD WRAP & WHITESPACE
    // =====================================================

    toggleWordWrap(cm) {
        const currentWrap = cm.getOption('lineWrapping');
        cm.setOption('lineWrapping', !currentWrap);
        this.showNotification(`Word wrap ${!currentWrap ? 'enabled' : 'disabled'}`);
    }

    showWhitespace(cm) {
        const showing = cm.getOption('showInvisibles');
        cm.setOption('showInvisibles', !showing);
        this.showNotification(`Whitespace ${!showing ? 'visible' : 'hidden'}`);
    }

    // =====================================================
    // EMMET ENHANCEMENTS
    // =====================================================

    emmetWrapWithAbbreviation(cm) {
        const selection = cm.getSelection();
        if (selection) {
            const abbreviation = prompt('Enter Emmet abbreviation:');
            if (abbreviation && this.editor && this.editor.tryEmmetExpansion) {
                const mode = cm.getMode().name;
                const expansion = this.editor.tryEmmetExpansion(abbreviation, mode);
                if (expansion) {
                    // Wrap selection with expanded abbreviation
                    const wrapped = expansion.text.replace('$1', selection);
                    cm.replaceSelection(wrapped);
                    this.showNotification('Wrapped with Emmet');
                }
            }
        }
    }

    emmetRemoveTag(cm) {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        // Simple implementation to remove surrounding HTML tag
        // This would need more sophisticated parsing for full Emmet functionality
        this.showNotification('Remove tag');
    }

    // =====================================================
    // QUICK FIXES & REFACTORING
    // =====================================================

    renameSymbol(cm) {
        const cursor = cm.getCursor();
        const word = cm.findWordAt(cursor);
        const wordText = cm.getRange(word.anchor, word.head);
        
        const newName = prompt(`Rename "${wordText}" to:`, wordText);
        if (newName && newName !== wordText) {
            // Simple find and replace for the word
            const searchCursor = cm.getSearchCursor(wordText, { line: 0, ch: 0 });
            const positions = [];
            
            while (searchCursor.findNext()) {
                positions.push({ from: searchCursor.from(), to: searchCursor.to() });
            }
            
            // Replace in reverse order to maintain positions
            cm.operation(() => {
                positions.reverse().forEach(pos => {
                    cm.replaceRange(newName, pos.from, pos.to);
                });
            });
            
            this.showNotification(`Renamed "${wordText}" to "${newName}" (${positions.length} occurrences)`);
        }
    }

    goToDefinition(cm) {
        this.showNotification('Go to definition');
        // Would need language server integration
    }

    peekDefinition(cm) {
        this.showNotification('Peek definition');
        // Would need language server integration
    }

    findAllReferences(cm) {
        const cursor = cm.getCursor();
        const word = cm.findWordAt(cursor);
        const wordText = cm.getRange(word.anchor, word.head);
        
        this.selectAllOccurrences(cm);
        this.showNotification(`Found references for "${wordText}"`);
    }

    goToSymbol(cm) {
        this.showNotification('Go to symbol in workspace');
        // Would need symbol parsing
    }

    goToSymbolInFile(cm) {
        this.showNotification('Go to symbol in file');
        // Would need symbol parsing
    }

    // =====================================================
    // KEYBOARD SHORTCUTS HELP
    // =====================================================

    showKeyboardShortcuts() {
        const shortcuts = this.getKeyboardShortcutsList();
        const helpPanel = this.createShortcutsHelpPanel(shortcuts);
        document.body.appendChild(helpPanel);
    }

    getKeyboardShortcutsList() {
        return {
            'File Operations': {
                'Ctrl+S': 'Save current file',
                'Ctrl+Shift+S': 'Save as',
                'Ctrl+N': 'New file',
                'Ctrl+O': 'Open file',
                'Ctrl+W': 'Close current file',
                'Ctrl+Shift+W': 'Close all files',
                'Ctrl+Shift+T': 'Reopen closed file',
                'Ctrl+K Ctrl+S': 'Save all files'
            },
            'Basic Editing': {
                'Ctrl+Z': 'Undo',
                'Ctrl+Y': 'Redo',
                'Ctrl+X': 'Cut',
                'Ctrl+C': 'Copy',
                'Ctrl+V': 'Paste',
                'Ctrl+A': 'Select all',
                'Ctrl+L': 'Select line',
                'Ctrl+D': 'Select next occurrence',
                'Ctrl+Shift+L': 'Select all occurrences'
            },
            'Navigation': {
                'Ctrl+G': 'Go to line',
                'Ctrl+P': 'Quick open',
                'Ctrl+Home': 'Go to file start',
                'Ctrl+End': 'Go to file end',
                'Ctrl+Right': 'Move word right',
                'Ctrl+Left': 'Move word left',
                'F12': 'Go to definition',
                'Shift+F12': 'Find all references'
            },
            'Search & Replace': {
                'Ctrl+F': 'Find',
                'Ctrl+H': 'Replace',
                'Ctrl+Shift+F': 'Find in files',
                'Ctrl+Shift+H': 'Replace in files',
                'F3': 'Find next',
                'Shift+F3': 'Find previous',
                'Ctrl+F3': 'Find current word',
                'Alt+Enter': 'Select all matches'
            },
            'Code Editing': {
                'Ctrl+/': 'Toggle comment',
                'Ctrl+Shift+/': 'Toggle block comment',
                'Alt+Shift+F': 'Format code',
                'Ctrl+]': 'Indent',
                'Ctrl+[': 'Unindent',
                'Ctrl+Shift+K': 'Delete line',
                'Ctrl+K Ctrl+D': 'Duplicate line',
                'Ctrl+J': 'Join lines'
            },
            'Multiple Cursors': {
                'Ctrl+Alt+Up': 'Add cursor above',
                'Ctrl+Alt+Down': 'Add cursor below',
                'Alt+Click': 'Add cursor at click',
                'Shift+Alt+Down': 'Column select down',
                'Shift+Alt+Up': 'Column select up',
                'Escape': 'Clear multiple cursors'
            },
            'Code Folding': {
                'Ctrl+Shift+[': 'Fold code',
                'Ctrl+Shift+]': 'Unfold code',
                'Ctrl+K Ctrl+[': 'Fold all',
                'Ctrl+K Ctrl+]': 'Unfold all',
                'F9': 'Toggle fold'
            },
            'View Controls': {
                'Ctrl+=': 'Zoom in',
                'Ctrl+-': 'Zoom out',
                'Ctrl+0': 'Reset zoom',
                'Ctrl+B': 'Toggle sidebar',
                'Ctrl+`': 'Toggle terminal',
                'F11': 'Toggle fullscreen',
                'Alt+Z': 'Toggle word wrap'
            },
            'Bookmarks': {
                'Ctrl+K Ctrl+K': 'Toggle bookmark',
                'Ctrl+K Ctrl+N': 'Next bookmark',
                'Ctrl+K Ctrl+P': 'Previous bookmark',
                'Ctrl+K Ctrl+L': 'Clear all bookmarks'
            },
            'Advanced': {
                'Ctrl+Shift+P': 'Command palette',
                'F2': 'Rename symbol',
                'F8': 'Next error',
                'Shift+F8': 'Previous error',
                'Ctrl+K Z': 'Zen mode',
                'Ctrl+Space': 'Trigger autocomplete'
            }
        };
    }

    createShortcutsHelpPanel(shortcuts) {
        const overlay = document.createElement('div');
        overlay.className = 'shortcuts-help-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const panel = document.createElement('div');
        panel.className = 'shortcuts-help-panel';
        panel.style.cssText = `
            background: var(--bg-secondary, #2a2a2a);
            border: 1px solid var(--border, #444);
            border-radius: 8px;
            padding: 20px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
            color: var(--text-primary, #ffffff);
            font-family: 'Consolas', 'Monaco', monospace;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Keyboard Shortcuts';
        title.style.cssText = `
            margin: 0 0 20px 0;
            text-align: center;
            color: var(--accent, #00d4ff);
        `;
        panel.appendChild(title);

        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        `;

        Object.entries(shortcuts).forEach(([category, categoryShortcuts]) => {
            const section = document.createElement('div');
            section.style.cssText = 'margin-bottom: 20px;';

            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category;
            categoryTitle.style.cssText = `
                margin: 0 0 10px 0;
                color: var(--accent, #00d4ff);
                border-bottom: 1px solid var(--border, #444);
                padding-bottom: 5px;
            `;
            section.appendChild(categoryTitle);

            Object.entries(categoryShortcuts).forEach(([shortcut, description]) => {
                const shortcutRow = document.createElement('div');
                shortcutRow.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 4px 0;
                `;

                const shortcutKeys = document.createElement('span');
                shortcutKeys.textContent = shortcut;
                shortcutKeys.style.cssText = `
                    font-weight: bold;
                    color: var(--warning, #ffaa00);
                    font-family: monospace;
                    background: var(--bg-primary, #1a1a1a);
                    padding: 2px 6px;
                    border-radius: 4px;
                    border: 1px solid var(--border, #444);
                `;

                const shortcutDesc = document.createElement('span');
                shortcutDesc.textContent = description;
                shortcutDesc.style.cssText = 'margin-left: 15px; flex: 1;';

                shortcutRow.appendChild(shortcutKeys);
                shortcutRow.appendChild(shortcutDesc);
                section.appendChild(shortcutRow);
            });

            grid.appendChild(section);
        });

        panel.appendChild(grid);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close (Esc)';
        closeBtn.style.cssText = `
            margin-top: 20px;
            padding: 10px 20px;
            background: var(--accent, #00d4ff);
            color: var(--bg-primary, #1a1a1a);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            display: block;
            margin-left: auto;
            margin-right: auto;
        `;
        
        closeBtn.onclick = () => overlay.remove();
        panel.appendChild(closeBtn);

        // Close on Escape key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Close on background click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        };

        overlay.appendChild(panel);
        return overlay;
    }

    // Add help shortcut to extraKeys
    // =====================================================
    // UTILITY METHODS
    // =====================================================

    showNotification(message) {
        if (this.editor && this.editor.showNotification) {
            this.editor.showNotification(message);
        } else {
            console.log(`Keyboard shortcut: ${message}`);
        }
    }
}
