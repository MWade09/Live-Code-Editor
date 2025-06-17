/**
 * LintManager - Handles all code quality and linting functionality
 */
export class LintManager {
    constructor(editor, codeMirror) {
        this.editor = editor;
        this.codeMirror = codeMirror;
        this.initializeLinting();
    }

    /**
     * Initialize linting for the editor
     */
    initializeLinting() {
        // Configure CodeMirror linting
        this.codeMirror.setOption('lint', {
            getAnnotations: (text, callback, options, cm) => {
                this.performLinting(text, callback, options, cm);
            },
            async: true,
            delay: 300
        });
    }

    /**
     * Main linting method that coordinates all language-specific linting
     */
    async performLinting(text, callback, options, cm) {
        try {
            const mode = cm.getMode().name;
            const mimeType = cm.getOption('mode');
            let annotations = [];
            
            // Determine the language and perform appropriate linting
            if (mode === 'javascript' || mode === 'jsx' || mimeType === 'text/javascript') {
                annotations = await this.lintJavaScript(text, options);
            } else if (mode === 'css' || mimeType === 'text/css') {
                annotations = await this.lintCSS(text, options);
            } else if (mode === 'xml' || mode === 'htmlmixed' || mimeType === 'text/html') {
                annotations = await this.lintHTML(text, options);
            } else if (mode === 'json' || mimeType === 'application/json') {
                annotations = await this.lintJSON(text, options);
            }
            
            // Add syntax error detection for all languages
            const syntaxErrors = this.detectSyntaxErrors(text, mode);
            annotations = annotations.concat(syntaxErrors);
            
            callback(annotations);
        } catch (error) {
            console.warn('Linting error:', error);
            callback([]);
        }
    }

    /**
     * JavaScript linting using JSHint
     */
    async lintJavaScript(text, options) {
        if (typeof JSHINT === 'undefined') {
            return [];
        }
        
        const annotations = [];
        const jshintOptions = {
            esversion: 11,
            browser: true,
            node: true,
            jquery: true,
            asi: false,
            boss: false,
            curly: true,
            eqeqeq: true,
            eqnull: true,
            es3: false,
            evil: false,
            expr: true,
            forin: true,
            immed: true,
            indent: 4,
            latedef: true,
            newcap: true,
            noarg: true,
            noempty: true,
            nonew: true,
            plusplus: false,
            quotmark: false,
            regexdash: false,
            strict: false,
            trailing: true,
            undef: true,
            unused: true
        };
        
        try {
            JSHINT(text, jshintOptions);
            
            if (JSHINT.errors) {
                for (const error of JSHINT.errors) {
                    if (!error) continue;
                    
                    annotations.push({
                        message: error.reason || 'Unknown error',
                        severity: error.code && error.code.startsWith('W') ? 'warning' : 'error',
                        from: CodeMirror.Pos(error.line - 1, error.character - 1),
                        to: CodeMirror.Pos(error.line - 1, error.character)
                    });
                }
            }
        } catch (e) {
            annotations.push({
                message: 'JavaScript parsing error: ' + e.message,
                severity: 'error',
                from: CodeMirror.Pos(0, 0),
                to: CodeMirror.Pos(0, 10)
            });
        }
        
        return annotations;
    }

    /**
     * CSS linting using CSSLint
     */
    async lintCSS(text, options) {
        if (typeof CSSLint === 'undefined') {
            return [];
        }
        
        const annotations = [];
        const rules = {
            'important': true,
            'adjoining-classes': false,
            'known-properties': true,
            'box-sizing': false,
            'box-model': true,
            'overqualified-elements': false,
            'display-property-grouping': true,
            'bulletproof-font-face': true,
            'compatible-vendor-prefixes': true,
            'regex-selectors': false,
            'errors': true,
            'duplicate-background-images': false,
            'duplicate-properties': true,
            'empty-rules': true,
            'selector-max-approaching': false,
            'gradients': false,
            'fallback-colors': true,
            'font-sizes': false,
            'font-faces': false,
            'floats': false,
            'star-property-hack': true,
            'outline-none': false,
            'import': true,
            'ids': false,
            'underscore-property-hack': true,
            'rules-count': false,
            'qualified-headings': false,
            'selector-max': false,
            'shorthand': false,
            'text-indent': false,
            'unique-headings': false,
            'universal-selector': false,
            'unqualified-attributes': false,
            'vendor-prefix': false,
            'zero-units': true
        };
        
        try {
            const result = CSSLint.verify(text, rules);
            
            for (const message of result.messages) {
                let severity = 'info';
                if (message.type === 'error') severity = 'error';
                else if (message.type === 'warning') severity = 'warning';
                
                annotations.push({
                    message: message.message,
                    severity: severity,
                    from: CodeMirror.Pos(message.line - 1, message.col - 1),
                    to: CodeMirror.Pos(message.line - 1, message.col)
                });
            }
        } catch (e) {
            annotations.push({
                message: 'CSS parsing error: ' + e.message,
                severity: 'error',
                from: CodeMirror.Pos(0, 0),
                to: CodeMirror.Pos(0, 10)
            });
        }
        
        return annotations;
    }

    /**
     * HTML linting - basic validation
     */
    async lintHTML(text, options) {
        const annotations = [];
        const lines = text.split('\n');
        
        // Basic HTML validation
        const tagStack = [];
        const selfClosingTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
        const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype', '!DOCTYPE']);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i;
            
            // Check for unclosed tags
            const openTags = line.match(/<([^\/\s>]+)[^>]*>/g);
            const closeTags = line.match(/<\/([^>\s]+)>/g);
            
            if (openTags) {
                for (const tag of openTags) {
                    const tagName = tag.match(/<([^\/\s>]+)/)[1].toLowerCase();
                    if (!voidElements.has(tagName) && !selfClosingTags.has(tagName) && !tag.endsWith('/>')) {
                        tagStack.push({
                            name: tagName,
                            line: lineNumber,
                            position: line.indexOf(tag)
                        });
                    }
                }
            }
            
            if (closeTags) {
                for (const tag of closeTags) {
                    const tagName = tag.match(/<\/([^>\s]+)>/)[1].toLowerCase();
                    const lastOpen = tagStack.pop();
                    
                    if (!lastOpen) {
                        annotations.push({
                            message: `Unexpected closing tag: ${tagName}`,
                            severity: 'error',
                            from: CodeMirror.Pos(lineNumber, line.indexOf(tag)),
                            to: CodeMirror.Pos(lineNumber, line.indexOf(tag) + tag.length)
                        });
                    } else if (lastOpen.name !== tagName) {
                        annotations.push({
                            message: `Mismatched closing tag: expected ${lastOpen.name}, found ${tagName}`,
                            severity: 'error',
                            from: CodeMirror.Pos(lineNumber, line.indexOf(tag)),
                            to: CodeMirror.Pos(lineNumber, line.indexOf(tag) + tag.length)
                        });
                        // Put the tag back for potential matching
                        tagStack.push(lastOpen);
                    }
                }
            }
            
            // Check for missing alt attributes on images
            if (line.includes('<img') && !line.includes('alt=')) {
                const imgMatch = line.match(/<img[^>]*>/);
                if (imgMatch) {
                    annotations.push({
                        message: 'Image missing alt attribute for accessibility',
                        severity: 'warning',
                        from: CodeMirror.Pos(lineNumber, line.indexOf(imgMatch[0])),
                        to: CodeMirror.Pos(lineNumber, line.indexOf(imgMatch[0]) + imgMatch[0].length)
                    });
                }
            }
            
            // Check for deprecated attributes
            const deprecatedAttributes = ['align', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'color', 'height', 'width'];
            for (const attr of deprecatedAttributes) {
                if (line.includes(`${attr}=`)) {
                    const attrIndex = line.indexOf(`${attr}=`);
                    annotations.push({
                        message: `Deprecated attribute: ${attr}. Use CSS instead.`,
                        severity: 'warning',
                        from: CodeMirror.Pos(lineNumber, attrIndex),
                        to: CodeMirror.Pos(lineNumber, attrIndex + attr.length)
                    });
                }
            }
        }
        
        // Check for unclosed tags at end of document
        for (const unclosedTag of tagStack) {
            annotations.push({
                message: `Unclosed tag: ${unclosedTag.name}`,
                severity: 'error',
                from: CodeMirror.Pos(unclosedTag.line, unclosedTag.position),
                to: CodeMirror.Pos(unclosedTag.line, unclosedTag.position + 10)
            });
        }
        
        return annotations;
    }

    /**
     * JSON linting
     */
    async lintJSON(text, options) {
        const annotations = [];
        
        try {
            JSON.parse(text);
        } catch (error) {
            const match = error.message.match(/at position (\d+)/);
            let position = 0;
            if (match) {
                position = parseInt(match[1]);
            }
            
            // Convert position to line/column
            const lines = text.substring(0, position).split('\n');
            const line = lines.length - 1;
            const column = lines[lines.length - 1].length;
            
            annotations.push({
                message: error.message,
                severity: 'error',
                from: CodeMirror.Pos(line, column),
                to: CodeMirror.Pos(line, column + 1)
            });
        }
        
        return annotations;
    }

    /**
     * Generic syntax error detection
     */
    detectSyntaxErrors(text, mode) {
        const annotations = [];
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for common syntax issues
            
            // Unmatched quotes
            let singleQuotes = 0;
            let doubleQuotes = 0;
            let inString = false;
            let stringChar = '';
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                const prevChar = j > 0 ? line[j - 1] : '';
                
                if ((char === '"' || char === "'") && prevChar !== '\\') {
                    if (!inString) {
                        inString = true;
                        stringChar = char;
                    } else if (char === stringChar) {
                        inString = false;
                        stringChar = '';
                    }
                    
                    if (char === '"') doubleQuotes++;
                    else singleQuotes++;
                }
            }
            
            if (singleQuotes % 2 !== 0) {
                annotations.push({
                    message: 'Unmatched single quote',
                    severity: 'error',
                    from: CodeMirror.Pos(i, line.lastIndexOf("'")),
                    to: CodeMirror.Pos(i, line.lastIndexOf("'") + 1)
                });
            }
            
            if (doubleQuotes % 2 !== 0) {
                annotations.push({
                    message: 'Unmatched double quote',
                    severity: 'error',
                    from: CodeMirror.Pos(i, line.lastIndexOf('"')),
                    to: CodeMirror.Pos(i, line.lastIndexOf('"') + 1)
                });
            }
            
            // Check for trailing whitespace
            if (line.match(/\s+$/)) {
                const trimmed = line.trimEnd();
                annotations.push({
                    message: 'Trailing whitespace',
                    severity: 'info',
                    from: CodeMirror.Pos(i, trimmed.length),
                    to: CodeMirror.Pos(i, line.length)
                });
            }
        }
        
        return annotations;
    }

    /**
     * Toggle linting on/off
     */
    toggleLinting() {
        const currentLintOption = this.codeMirror.getOption('lint');
        
        if (currentLintOption) {
            this.codeMirror.setOption('lint', false);
            this.editor.showNotification('Linting disabled');
        } else {
            this.codeMirror.setOption('lint', {
                getAnnotations: (text, callback, options, cm) => {
                    this.performLinting(text, callback, options, cm);
                },
                async: true,
                delay: 300
            });
            this.editor.showNotification('Linting enabled');
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
            this.editor.showNotification('No lint errors found');
            return;
        }
        
        const cursor = this.codeMirror.getCursor();
        const annotations = state.marked.filter(m => m.severity === 'error');
        
        if (annotations.length === 0) {
            this.editor.showNotification('No errors found');
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
        this.editor.showNotification(`Error: ${nextError.message}`);
    }

    /**
     * Jump to previous lint error
     */
    jumpToPrevError() {
        const state = this.codeMirror.state.lint;
        if (!state || !state.marked || state.marked.length === 0) {
            this.editor.showNotification('No lint errors found');
            return;
        }
        
        const cursor = this.codeMirror.getCursor();
        const annotations = state.marked.filter(m => m.severity === 'error');
        
        if (annotations.length === 0) {
            this.editor.showNotification('No errors found');
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
        this.editor.showNotification(`Error: ${prevError.message}`);
    }

    /**
     * Show lint statistics in status bar or notification
     */
    showLintStats() {
        const stats = this.getLintStatus();
        const total = stats.errors + stats.warnings + stats.infos;
        
        if (total === 0) {
            this.editor.showNotification('✅ No issues found');
        } else {
            let message = `📊 Issues: ${total} total`;
            if (stats.errors > 0) message += `, ${stats.errors} errors`;
            if (stats.warnings > 0) message += `, ${stats.warnings} warnings`;
            if (stats.infos > 0) message += `, ${stats.infos} info`;
            this.editor.showNotification(message);
        }
    }
}
