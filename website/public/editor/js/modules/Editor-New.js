/**
 * Editor class - Core editor functionality with modular architecture
 */
import { SearchManager } from './SearchManager.js';
import { LintManager } from './LintManager.js';
import { FormattingManager } from './FormattingManager.js';
import { KeyboardManager } from './KeyboardManager.js';
import { MinimapManager } from './MinimapManager.js';
import { LineHighlightManager } from './LineHighlightManager.js';

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
        });

        // Initialize managers that don't need UI elements first
        this.searchManager = new SearchManager(this, this.codeMirror);
        this.lintManager = new LintManager(this, this.codeMirror);
        this.formattingManager = new FormattingManager(this, this.codeMirror);
        
        this.keyboardManager = new KeyboardManager(this, this.codeMirror, {
            searchManager: this.searchManager,
            lintManager: this.lintManager,
            formattingManager: this.formattingManager,
            // Will add these after UI is ready
            minimapManager: null,
            lineHighlightManager: null
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
        
        // Now create managers that need to add UI elements
        // The controls container now exists, so they can add their buttons
        this.minimapManager = new MinimapManager(this, this.codeMirror);
        this.lineHighlightManager = new LineHighlightManager(this, this.codeMirror);
        
        // Update keyboard manager with the new managers
        if (this.keyboardManager) {
            this.keyboardManager.minimapManager = this.minimapManager;
            this.keyboardManager.lineHighlightManager = this.lineHighlightManager;
        }
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

        // Enhanced autocomplete function with Emmet support
        const customHint = (cm, option) => {
            const cursor = cm.getCursor();
            const token = cm.getTokenAt(cursor);
            const mode = cm.getMode().name;
            
            let suggestions = [];
            let start = token.start;
            let end = token.end;
            const word = token.string;
            const line = cm.getLine(cursor.line);
            const beforeCursor = line.substring(0, cursor.ch);

            // Check for Emmet abbreviations first
            const emmetSuggestion = this.tryEmmetExpansion(beforeCursor, mode);
            if (emmetSuggestion) {
                return {
                    list: [emmetSuggestion],
                    from: CodeMirror.Pos(cursor.line, emmetSuggestion.from),
                    to: CodeMirror.Pos(cursor.line, cursor.ch)
                };
            }

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
     * Try to expand Emmet abbreviation
     */
    tryEmmetExpansion(textBeforeCursor, mode) {
        // Only process HTML and CSS modes
        if (mode !== 'xml' && mode !== 'htmlmixed' && mode !== 'css') {
            return null;
        }

        // Find the last word that could be an Emmet abbreviation
        const emmetMatch = textBeforeCursor.match(/([a-zA-Z0-9\.\#\[\]\*\+\>\^\$\{\}]+)$/);
        if (!emmetMatch) return null;

        const abbreviation = emmetMatch[1];
        const startPos = textBeforeCursor.length - abbreviation.length;

        // Try to expand the abbreviation
        const expanded = this.expandEmmetAbbreviation(abbreviation, mode);
        if (expanded) {
            return {
                text: expanded,
                displayText: `${abbreviation} → Emmet`,
                from: startPos,
                className: 'emmet-suggestion'
            };
        }

        return null;
    }

    /**
     * Expand Emmet abbreviation to HTML/CSS
     */
    expandEmmetAbbreviation(abbr, mode) {
        if (mode === 'css') {
            return this.expandCSSEmmet(abbr);
        } else {
            return this.expandHTMLEmmet(abbr);
        }
    }

    /**
     * Expand HTML Emmet abbreviations
     */
    expandHTMLEmmet(abbr) {
        const emmetPatterns = {
            // Basic elements
            'div': '<div></div>',
            'p': '<p></p>',
            'span': '<span></span>',
            'a': '<a href=""></a>',
            'img': '<img src="" alt="">',
            'input': '<input type="text">',
            'button': '<button></button>',
            'form': '<form></form>',
            'ul': '<ul></ul>',
            'ol': '<ol></ol>',
            'li': '<li></li>',
            'table': '<table></table>',
            'tr': '<tr></tr>',
            'td': '<td></td>',
            'th': '<th></th>',
            'h1': '<h1></h1>',
            'h2': '<h2></h2>',
            'h3': '<h3></h3>',
            'h4': '<h4></h4>',
            'h5': '<h5></h5>',
            'h6': '<h6></h6>',
            'nav': '<nav></nav>',
            'header': '<header></header>',
            'footer': '<footer></footer>',
            'main': '<main></main>',
            'section': '<section></section>',
            'article': '<article></article>',
            'aside': '<aside></aside>',
            
            // Common patterns
            'html:5': '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>Document</title>\n</head>\n<body>\n\t\n</body>\n</html>',
            'link:css': '<link rel="stylesheet" href="style.css">',
            'script:src': '<script src=""></script>',
            'meta:vp': '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            'meta:utf': '<meta charset="UTF-8">',
        };

        // Handle class shortcuts (div.class -> <div class="class"></div>)
        if (abbr.includes('.') && !abbr.includes(' ')) {
            const parts = abbr.split('.');
            const tag = parts[0] || 'div';
            const classes = parts.slice(1).join(' ');
            if (classes) {
                return `<${tag} class="${classes}"></${tag}>`;
            }
        }

        // Handle ID shortcuts (div#id -> <div id="id"></div>)
        if (abbr.includes('#') && !abbr.includes(' ')) {
            const parts = abbr.split('#');
            const tag = parts[0] || 'div';
            const id = parts[1];
            if (id) {
                return `<${tag} id="${id}"></${tag}>`;
            }
        }

        // Handle multiplication (li*3 -> <li></li><li></li><li></li>)
        if (abbr.includes('*')) {
            const match = abbr.match(/^([a-zA-Z0-9]+)\*(\d+)$/);
            if (match) {
                const tag = match[1];
                const count = parseInt(match[2]);
                const element = emmetPatterns[tag] || `<${tag}></${tag}>`;
                return Array(count).fill(element).join('\n');
            }
        }

        // Handle child elements (ul>li -> <ul><li></li></ul>)
        if (abbr.includes('>')) {
            const parts = abbr.split('>');
            let result = '';
            let closeTags = [];
            
            parts.forEach((part, index) => {
                const tag = part.trim();
                if (tag) {
                    result += `<${tag}>`;
                    closeTags.unshift(tag);
                }
            });
            
            closeTags.forEach(tag => {
                result += `</${tag}>`;
            });
            
            return result;
        }

        // Return direct match
        return emmetPatterns[abbr] || null;
    }

    /**
     * Expand CSS Emmet abbreviations
     */
    expandCSSEmmet(abbr) {
        const cssPatterns = {
            // Display
            'd:n': 'display: none;',
            'd:b': 'display: block;',
            'd:i': 'display: inline;',
            'd:ib': 'display: inline-block;',
            'd:f': 'display: flex;',
            'd:g': 'display: grid;',
            
            // Position
            'pos:r': 'position: relative;',
            'pos:a': 'position: absolute;',
            'pos:f': 'position: fixed;',
            'pos:s': 'position: sticky;',
            
            // Flexbox
            'jc:c': 'justify-content: center;',
            'jc:sb': 'justify-content: space-between;',
            'jc:sa': 'justify-content: space-around;',
            'ai:c': 'align-items: center;',
            'ai:fs': 'align-items: flex-start;',
            'ai:fe': 'align-items: flex-end;',
            'fd:c': 'flex-direction: column;',
            'fd:r': 'flex-direction: row;',
            
            // Margin & Padding
            'm:a': 'margin: auto;',
            'mt:a': 'margin-top: auto;',
            'mr:a': 'margin-right: auto;',
            'mb:a': 'margin-bottom: auto;',
            'ml:a': 'margin-left: auto;',
            
            // Width & Height
            'w:a': 'width: auto;',
            'w:100': 'width: 100%;',
            'h:a': 'height: auto;',
            'h:100': 'height: 100%;',
            'h:100vh': 'height: 100vh;',
            'w:100vw': 'width: 100vw;',
            
            // Text
            'ta:c': 'text-align: center;',
            'ta:l': 'text-align: left;',
            'ta:r': 'text-align: right;',
            'td:n': 'text-decoration: none;',
            'td:u': 'text-decoration: underline;',
            'fw:b': 'font-weight: bold;',
            'fw:n': 'font-weight: normal;',
            
            // Background
            'bg:n': 'background: none;',
            'bg:t': 'background: transparent;',
            
            // Border
            'bd:n': 'border: none;',
            'bd:0': 'border: 0;',
            'br:50': 'border-radius: 50%;',
            
            // Overflow
            'ov:h': 'overflow: hidden;',
            'ov:a': 'overflow: auto;',
            'ov:s': 'overflow: scroll;',
            
            // Visibility
            'v:h': 'visibility: hidden;',
            'v:v': 'visibility: visible;',
            'op:0': 'opacity: 0;',
            'op:1': 'opacity: 1;',
        };

        // Handle numeric values (m10 -> margin: 10px;)
        const numericMatch = abbr.match(/^([a-z]+)(\d+)$/);
        if (numericMatch) {
            const prop = numericMatch[1];
            const value = numericMatch[2];
            
            const propertyMap = {
                'm': 'margin',
                'p': 'padding',
                'mt': 'margin-top',
                'mr': 'margin-right',
                'mb': 'margin-bottom',
                'ml': 'margin-left',
                'pt': 'padding-top',
                'pr': 'padding-right',
                'pb': 'padding-bottom',
                'pl': 'padding-left',
                'w': 'width',
                'h': 'height',
                'fs': 'font-size',
                'lh': 'line-height',
                'br': 'border-radius',
                'z': 'z-index',
                'op': 'opacity'
            };
            
            if (propertyMap[prop]) {
                const unit = prop === 'z' || prop === 'op' || prop === 'lh' ? '' : 'px';
                return `${propertyMap[prop]}: ${value}${unit};`;
            }
        }

        return cssPatterns[abbr] || null;
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
        
        // Notify all managers about theme change
        if (this.minimapManager) {
            // Dispatch theme change event for minimap
            document.dispatchEvent(new CustomEvent('themeChanged', { 
                detail: { isDark: isDark } 
            }));
        }
        
        if (this.lineHighlightManager) {
            // Line highlight manager will listen to the themeChanged event
            document.dispatchEvent(new CustomEvent('themeChanged', { 
                detail: { isDark: isDark } 
            }));
        }
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
        if (!file) {
            this.clearEditor();
            return;
        }
        
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

    /**
     * Clear the editor content
     */
    clearEditor() {
        this.codeMirror.setValue('');
        this.codeMirror.clearHistory();
        this.codeMirror.setOption('mode', 'text/plain');
    }

    /**
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
     * Clear multiple selections
     */
    clearMultipleSelections(cm) {
        cm.setSelections([cm.listSelections()[0]]);
    }
    
    /**
     * Show notification to user
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Remove any existing notifications to avoid overlap
        const existingNotifications = document.querySelectorAll('.editor-notification');
        existingNotifications.forEach(notif => notif.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `editor-notification ${type}`;
        
        // Get appropriate icon for notification type
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle"></i>';
        }
        
        notification.innerHTML = `${icon}<span>${message}</span>`;
        
        // Apply base positioning styles only (let CSS handle the rest)
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 2000;
            max-width: 300px;
            padding: 12px 16px;
            border-radius: 6px;
            border: 1px solid;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            animation: slideInFromRight 0.3s ease;
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOutToRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}