/**
 * Editor class - Core editor functionality with modular architecture
 */
import { SearchManager } from './SearchManager.js';
import { LintManager } from './LintManager.js';
import { FormattingManager } from './FormattingManager.js';
import { KeyboardManager } from './KeyboardManager.js';

export class Editor {
    constructor(editorElement, fileManager) {
        this.fileManager = fileManager;
        
        // Initialize CodeMirror with core configuration
        this.codeMirror = CodeMirror(editorElement, {
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
            cursorBlinkRate: 530
        });        // Initialize all managers
        this.searchManager = new SearchManager(this, this.codeMirror);
        this.lintManager = new LintManager(this, this.codeMirror);
        this.formattingManager = new FormattingManager(this, this.codeMirror);
        
        this.keyboardManager = new KeyboardManager(this, this.codeMirror, {
            searchManager: this.searchManager,
            lintManager: this.lintManager,
            formattingManager: this.formattingManager
        });

        // Setup event listeners
        this.codeMirror.on('change', () => {
            // Only update if we have a current file
            const currentFile = this.fileManager.getCurrentFile();
            if (currentFile) {
                this.updateCurrentFile();
            }
        });
        
        // Setup will be done after method definitions
        setTimeout(() => {
            this.initializeEditor();
        }, 0);
    }    /**
     * Initialize editor after all methods are defined
     */
    initializeEditor() {
        this.setupAutocomplete();
        this.setupFoldingControls();
        this.initializeLanguageSupport();
    }

    /**
     * Setup language-specific autocomplete
     */
    setupAutocomplete() {
        // Language-specific keyword dictionaries
        const languageKeywords = {
            javascript: [
                'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
                'try', 'catch', 'finally', 'throw', 'return', 'break', 'continue', 'class', 'extends', 'import',
                'export', 'from', 'async', 'await', 'Promise', 'console', 'document', 'window', 'Array', 'Object',
                'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'undefined',
                'null', 'true', 'false', 'typeof', 'instanceof', 'new', 'this', 'super', 'static', 'get', 'set'
            ],
            html: [
                'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li', 'table',
                'tr', 'td', 'th', 'thead', 'tbody', 'form', 'input', 'button', 'select', 'option', 'textarea',
                'label', 'nav', 'header', 'footer', 'main', 'section', 'article', 'aside', 'canvas', 'script',
                'style', 'link', 'meta', 'title', 'head', 'body', 'html', 'iframe', 'video', 'audio', 'source'
            ],
            css: [
                'color', 'background', 'background-color', 'background-image', 'background-size', 'background-position',
                'margin', 'padding', 'border', 'border-radius', 'width', 'height', 'max-width', 'max-height',
                'min-width', 'min-height', 'display', 'position', 'top', 'right', 'bottom', 'left', 'float',
                'clear', 'overflow', 'text-align', 'font-family', 'font-size', 'font-weight', 'line-height',
                'text-decoration', 'text-transform', 'letter-spacing', 'word-spacing', 'white-space', 'vertical-align',
                'list-style', 'cursor', 'transition', 'transform', 'animation', 'box-shadow', 'text-shadow',
                'opacity', 'visibility', 'z-index', 'flex', 'grid', 'justify-content', 'align-items', 'flex-direction'
            ],
            python: [
                'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as',
                'import', 'from', 'return', 'yield', 'break', 'continue', 'pass', 'lambda', 'and', 'or', 'not',
                'in', 'is', 'True', 'False', 'None', 'self', 'super', 'print', 'input', 'len', 'range', 'str',
                'int', 'float', 'bool', 'list', 'dict', 'tuple', 'set', 'type', 'isinstance', 'hasattr', 'getattr'
            ]
        };

        // Enhanced autocomplete function
        const customHint = (cm, option) => {
            const cursor = cm.getCursor();
            const token = cm.getTokenAt(cursor);
            const mode = cm.getMode().name;
            
            let suggestions = [];
            let start = token.start;
            let end = token.end;
            const word = token.string;

            // Get language-specific suggestions
            if (mode === 'javascript' || mode === 'jsx') {
                suggestions = languageKeywords.javascript.filter(keyword => 
                    keyword.toLowerCase().startsWith(word.toLowerCase())
                );
                
                // Add console methods
                if (word.startsWith('console.')) {
                    suggestions = ['log', 'error', 'warn', 'info', 'debug', 'trace'].map(method => 'console.' + method);
                    start = cursor.ch - word.length;
                    end = cursor.ch;
                }
            } else if (mode === 'css') {
                suggestions = languageKeywords.css.filter(keyword => 
                    keyword.toLowerCase().startsWith(word.toLowerCase())
                );
            } else if (mode === 'xml' || mode === 'htmlmixed') {
                suggestions = languageKeywords.html.filter(keyword => 
                    keyword.toLowerCase().startsWith(word.toLowerCase())
                );
            } else if (mode === 'python') {
                suggestions = languageKeywords.python.filter(keyword => 
                    keyword.toLowerCase().startsWith(word.toLowerCase())
                );
            }

            // Fallback to any-word hint if no language-specific suggestions
            if (suggestions.length === 0) {
                return CodeMirror.hint.anyword(cm, option);
            }

            return {
                list: suggestions,
                from: CodeMirror.Pos(cursor.line, start),
                to: CodeMirror.Pos(cursor.line, end)
            };
        };

        // Register the custom hint
        CodeMirror.registerHelper('hint', 'custom', customHint);

        // Override default autocomplete to use our custom hint
        this.codeMirror.setOption('hintOptions', {
            hint: customHint,
            completeSingle: false,
            closeOnUnfocus: true,
            alignWithWord: true,
            closeCharacters: /[\s()\[\]{};:>,]/
        });
    }

    /**
     * Update current file content
     */
    updateCurrentFile() {
        if (this.fileManager && this.fileManager.currentFile) {
            this.fileManager.currentFile.content = this.codeMirror.getValue();
            this.fileManager.updateFileInStorage(this.fileManager.currentFile);
        }
    }

    /**
     * Set editor content
     */
    setValue(content) {
        this.codeMirror.setValue(content || '');
    }

    /**
     * Get editor content
     */
    getValue() {
        return this.codeMirror.getValue();
    }

    /**
     * Set editor mode (language)
     */
    setMode(mode) {
        this.codeMirror.setOption('mode', mode);
    }

    /**
     * Update theme
     */
    updateTheme(isDark) {
        this.codeMirror.setOption('theme', isDark ? 'monokai' : 'eclipse');
    }

    /**
     * Load current file from file manager
     */
    loadCurrentFile() {
        const currentFile = this.fileManager.getCurrentFile();
        this.loadFile(currentFile);
    }

    /**
     * Load a file into the editor
     */
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
    }    /**
     * Update current file content
     */
    updateCurrentFile() {
        this.fileManager.updateCurrentFile(this.codeMirror.getValue());
    }

    /**
     * Get CodeMirror mode from file type and name
     */
    getModeFromFileType(fileType, fileName = '') {
        const extension = fileName.split('.').pop()?.toLowerCase();
        
        switch (fileType) {
            case 'html':
                return 'htmlmixed';
            case 'css':
                return 'css';
            case 'javascript':
            case 'js':
                return 'javascript';
            case 'json':
                return { name: 'javascript', json: true };
            case 'xml':
                return 'xml';
            case 'markdown':
            case 'md':
                return 'markdown';
            case 'python':
            case 'py':
                return 'python';
            case 'php':
                return 'php';
            case 'sql':
                return 'sql';
            case 'shell':
            case 'bash':
                return 'shell';
            case 'yaml':
            case 'yml':
                return 'yaml';
            case 'text':
            case 'txt':
                return 'text/plain';
            default:
                // Fallback to extension-based detection
                return this.getModeFromExtension(extension) || 'htmlmixed';
        }
    }

    /**
     * Get CodeMirror mode from file extension
     */
    getModeFromExtension(extension) {
        switch (extension) {
            case 'html':
            case 'htm':
                return 'htmlmixed';
            case 'css':
                return 'css';
            case 'scss':
            case 'sass':
                return 'text/x-scss';
            case 'less':
                return 'text/x-less';
            case 'js':
            case 'jsx':
                return 'javascript';
            case 'ts':
            case 'tsx':
                return 'text/typescript';
            case 'json':
                return { name: 'javascript', json: true };
            case 'xml':
            case 'xsl':
            case 'xsd':
                return 'xml';
            case 'svg':
                return 'xml';
            case 'md':
            case 'markdown':
                return 'markdown';
            case 'py':
                return 'python';
            case 'php':
                return 'php';
            case 'sql':
                return 'sql';
            case 'sh':
            case 'bash':
                return 'shell';
            case 'yaml':
            case 'yml':
                return 'yaml';
            case 'txt':
                return 'text/plain';
            case 'c':
            case 'h':
                return 'text/x-csrc';
            case 'cpp':
            case 'cxx':
            case 'hpp':
                return 'text/x-c++src';
            case 'java':
                return 'text/x-java';
            case 'go':
                return 'text/x-go';
            case 'rs':
                return 'text/x-rustsrc';
            case 'rb':
                return 'text/x-ruby';
            case 'pl':
                return 'text/x-perl';
            case 'r':
                return 'text/x-rsrc';
            default:
                return 'htmlmixed';
        }
    }

    /**
     * Set theme (alias for updateTheme for compatibility)
     */
    setTheme(isDark) {
        this.updateTheme(isDark);
    }

    /**
     * Focus the editor
     */
    focus() {
        this.codeMirror.focus();
    }

    /**
     * Setup folding controls UI
     */
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

    /**
     * Initialize language support and autocomplete
     */
    initializeLanguageSupport() {
        // Setup autocomplete
        this.setupAutocomplete();
    }

    /**
     * Setup autocomplete functionality
     */
    setupAutocomplete() {
        // Enhanced autocomplete with smart completion
        this.codeMirror.on('inputRead', (cm, change) => {
            // Auto-close completion if only one item and it's what the user typed
            if (cm.state.completionActive && cm.state.completionActive.data) {
                const handle = cm.state.completionActive;
                if (handle.data && handle.data.list && handle.data.list.length === 1) {
                    const completion = handle.data.list[0];
                    if (typeof completion === 'string' && completion === change.text[0]) {
                        CodeMirror.commands.autocomplete(cm);
                    }
                }
            }
            
            // Auto-trigger completion for certain characters
            if (change.text[0] && this.shouldTriggerAutocomplete(change.text[0])) {
                setTimeout(() => {
                    if (!cm.state.completionActive) {
                        CodeMirror.commands.autocomplete(cm);
                    }
                }, 100);
            }
        });
    }

    /**
     * Check if character should trigger autocomplete
     */
    shouldTriggerAutocomplete(char) {
        const mode = this.codeMirror.getOption('mode');
        
        switch (mode) {
            case 'htmlmixed':
                return char === '<' || char === ' ' || char === '"' || char === "'";
            case 'css':
                return char === ':' || char === ';' || char === '{' || char === ' ';
            case 'javascript':
                return char === '.' || char === '(' || char === ' ';
            case 'xml':
                return char === '<' || char === ' ' || char === '"' || char === "'";
            default:
                return char === '.' || char === ' ';
        }
    }

    /**
     * Fold all code blocks
     */
    foldAll() {
        const cm = this.codeMirror;
        for (let i = cm.firstLine(); i <= cm.lastLine(); i++) {
            cm.foldCode({line: i, ch: 0}, null, "fold");
        }
    }

    /**
     * Unfold all code blocks
     */
    unfoldAll() {
        const cm = this.codeMirror;
        cm.operation(() => {
            for (let i = cm.firstLine(); i <= cm.lastLine(); i++) {
                const marks = cm.findMarksAt({line: i, ch: 0});
                marks.forEach(mark => {
                    if (mark.__isFold) {
                        mark.clear();
                    }
                });
            }
        });
    }

    /**
     * Select next occurrence of current selection
     */
    selectNextOccurrence(cm) {
        const selection = cm.getSelection();
        if (!selection) {
            // If no selection, select the word at cursor
            const cursor = cm.getCursor();
            const word = cm.findWordAt(cursor);
            cm.setSelection(word.anchor, word.head);
            return;
        }

        const searchCursor = cm.getSearchCursor(selection);
        if (searchCursor.findNext()) {
            cm.addSelection(searchCursor.from(), searchCursor.to());
        } else {
            // Wrap around to beginning
            const searchCursor2 = cm.getSearchCursor(selection);
            if (searchCursor2.findNext()) {
                cm.addSelection(searchCursor2.from(), searchCursor2.to());
            }
        }
    }

    /**
     * Select all occurrences of current selection
     */
    selectAllOccurrences(cm) {
        const selection = cm.getSelection();
        if (!selection) {
            // If no selection, select the word at cursor
            const cursor = cm.getCursor();
            const word = cm.findWordAt(cursor);
            cm.setSelection(word.anchor, word.head);
            return;
        }

        const selections = [];
        const searchCursor = cm.getSearchCursor(selection);
        
        // Find all occurrences
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

    /**
     * Clear multiple selections, keeping only the primary one
     */
    clearMultipleSelections(cm) {
        const selections = cm.listSelections();
        if (selections.length > 1) {
            cm.setSelection(selections[0].anchor, selections[0].head);
        }
    }
}
