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
              // Enhanced search and replace (both show the same dialog)
            "Ctrl-F": cm => this.searchManager.showAdvancedFind(),
            "Ctrl-H": cm => this.searchManager.showAdvancedFind(),
            "Ctrl-Shift-F": cm => this.searchManager.showGlobalSearch(),
            "Ctrl-Shift-H": cm => this.searchManager.showGlobalReplace(),
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
            
            // Code quality shortcuts
            "Ctrl-Shift-P": cm => this.formattingManager.formatCode(),
            "Alt-Shift-F": cm => this.formattingManager.formatCode(),
            "F8": cm => this.lintManager.jumpToNextError(),
            "Shift-F8": cm => this.lintManager.jumpToPrevError(),
            "Ctrl-Shift-L": cm => this.lintManager.toggleLinting(),
            "Ctrl-Shift-M": cm => this.lintManager.showLintStats()
        };
        
        // Apply keyboard shortcuts to CodeMirror
        this.codeMirror.setOption('extraKeys', extraKeys);
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
}
