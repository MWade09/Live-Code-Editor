/**
 * StickyScrollManager.js
 * Displays context (function/class names) at the top of the editor while scrolling
 * Helps developers maintain awareness of their location in large files
 */

export class StickyScrollManager {
    constructor(editor, codeMirror) {
        this.editor = editor;
        this.codeMirror = codeMirror;
        this.enabled = true;
        this.maxContextLines = 3; // Maximum number of context lines to show
        this.contextCache = new Map(); // Cache context results for performance
        
        this.initialize();
    }

    /**
     * Initialize sticky scroll
     */
    initialize() {
        this.createStickyHeader();
        this.attachScrollListener();
        console.log('StickyScrollManager initialized');
    }

    /**
     * Create the sticky header element
     */
    createStickyHeader() {
        const header = document.createElement('div');
        header.id = 'sticky-scroll';
        header.className = 'sticky-scroll hidden';
        
        // Insert after CodeMirror but before the scroll area
        const wrapper = this.codeMirror.getWrapperElement();
        wrapper.insertBefore(header, wrapper.firstChild);
        
        this.headerEl = header;
    }

    /**
     * Attach scroll event listener to CodeMirror
     */
    attachScrollListener() {
        this.codeMirror.on('scroll', () => {
            if (this.enabled) {
                this.updateStickyContext();
            }
        });

        // Also update on content change (in case structure changes)
        this.codeMirror.on('change', () => {
            this.contextCache.clear(); // Clear cache when content changes
            if (this.enabled) {
                this.updateStickyContext();
            }
        });
    }

    /**
     * Update the sticky context display based on current scroll position
     */
    updateStickyContext() {
        const scrollInfo = this.codeMirror.getScrollInfo();
        const topLine = this.codeMirror.lineAtHeight(scrollInfo.top, 'local');
        
        // Don't show sticky scroll if we're at the very top
        if (topLine <= 0) {
            this.headerEl.classList.add('hidden');
            return;
        }

        const context = this.findContext(topLine);
        
        if (context.length > 0) {
            this.renderContext(context);
            this.headerEl.classList.remove('hidden');
        } else {
            this.headerEl.classList.add('hidden');
        }
    }

    /**
     * Find context lines above the current top line
     */
    findContext(lineNum) {
        // Check cache first
        const cacheKey = `${lineNum}-${this.codeMirror.getMode().name}`;
        if (this.contextCache.has(cacheKey)) {
            return this.contextCache.get(cacheKey);
        }

        const context = [];
        const mode = this.codeMirror.getMode().name;
        let currentIndent = Infinity; // Track the indent level we're looking for
        
        // Scan backwards from current line to find context
        for (let i = lineNum - 1; i >= 0; i--) {
            const line = this.codeMirror.getLine(i);
            
            if (!line || line.trim() === '') continue;
            
            const indent = this.getIndentLevel(line);
            const contextInfo = this.getContextInfo(line, mode, i);
            
            // Only add context if it's at a shallower indent level than what we've seen
            if (contextInfo && indent < currentIndent) {
                context.unshift(contextInfo); // Add to beginning
                currentIndent = indent;
                
                // Stop if we have enough context
                if (context.length >= this.maxContextLines) {
                    break;
                }
            }
        }
        
        // Cache the result
        this.contextCache.set(cacheKey, context);
        
        return context;
    }

    /**
     * Get indentation level of a line
     */
    getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    /**
     * Extract context information from a line
     */
    getContextInfo(line, mode, lineNum) {
        const trimmed = line.trim();
        
        // Language-specific patterns
        const patterns = {
            'javascript': [
                // Function declarations
                { regex: /^(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+(\w+)/, type: 'function', format: (m) => `function ${m[1]}()` },
                // Arrow functions assigned to const/let/var
                { regex: /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/, type: 'function', format: (m) => `${m[1]}()` },
                // Class declarations
                { regex: /^(?:export\s+(?:default\s+)?)?class\s+(\w+)/, type: 'class', format: (m) => `class ${m[1]}` },
                // Methods in classes
                { regex: /^(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/, type: 'method', format: (m) => `${m[1]}()` },
                // Object methods
                { regex: /^(\w+)\s*:\s*(?:async\s+)?function/, type: 'method', format: (m) => `${m[1]}()` }
            ],
            'jsx': [
                { regex: /^(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+(\w+)/, type: 'component', format: (m) => `<${m[1]} />` },
                { regex: /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*\(/, type: 'component', format: (m) => `<${m[1]} />` },
                { regex: /^(?:export\s+(?:default\s+)?)?class\s+(\w+)/, type: 'class', format: (m) => `class ${m[1]}` }
            ],
            'python': [
                { regex: /^def\s+(\w+)\s*\(/, type: 'function', format: (m) => `def ${m[1]}()` },
                { regex: /^class\s+(\w+)/, type: 'class', format: (m) => `class ${m[1]}` },
                { regex: /^async\s+def\s+(\w+)\s*\(/, type: 'function', format: (m) => `async def ${m[1]}()` }
            ],
            'css': [
                { regex: /^(\.[\w-]+)(?:\s*\{|,)/, type: 'selector', format: (m) => m[1] },
                { regex: /^(#[\w-]+)(?:\s*\{|,)/, type: 'selector', format: (m) => m[1] },
                { regex: /^([\w-]+)(?:\s*\{|,)/, type: 'selector', format: (m) => m[1] },
                { regex: /@media\s+([^{]+)/, type: 'media', format: (m) => `@media ${m[1].trim()}` }
            ],
            'htmlmixed': [
                { regex: /^<(div|section|article|main|header|footer|nav|aside|form|table)(?:\s+[^>]*)?(?:id|class)="([^"]+)"/, type: 'tag', format: (m) => `<${m[1]} ${m[2]}>` },
                { regex: /^<(div|section|article|main|header|footer|nav|aside|form|table)/, type: 'tag', format: (m) => `<${m[1]}>` }
            ],
            'php': [
                { regex: /^(?:public|private|protected)?\s*function\s+(\w+)/, type: 'function', format: (m) => `function ${m[1]}()` },
                { regex: /^class\s+(\w+)/, type: 'class', format: (m) => `class ${m[1]}` }
            ],
            'typescript': [
                { regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/, type: 'function', format: (m) => `function ${m[1]}()` },
                { regex: /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/, type: 'class', format: (m) => `class ${m[1]}` },
                { regex: /^(?:export\s+)?interface\s+(\w+)/, type: 'interface', format: (m) => `interface ${m[1]}` },
                { regex: /^(?:export\s+)?type\s+(\w+)/, type: 'type', format: (m) => `type ${m[1]}` }
            ]
        };

        const modePatterns = patterns[mode] || patterns['javascript'];
        
        for (const pattern of modePatterns) {
            const match = trimmed.match(pattern.regex);
            if (match) {
                return {
                    text: pattern.format(match),
                    type: pattern.type,
                    line: lineNum,
                    original: trimmed.substring(0, 80) // Truncate long lines
                };
            }
        }
        
        return null;
    }

    /**
     * Render the context in the sticky header
     */
    renderContext(context) {
        if (context.length === 0) {
            this.headerEl.classList.add('hidden');
            return;
        }
        
        this.headerEl.innerHTML = context.map((ctx, index) => {
            const indent = index * 20; // Visual indent for nesting
            return `
                <div class="sticky-line sticky-${ctx.type}" 
                     data-line="${ctx.line}" 
                     style="padding-left: ${indent}px"
                     title="${this.escapeHTML(ctx.original)}">
                    <span class="sticky-icon">${this.getIconForType(ctx.type)}</span>
                    <span class="sticky-text">${this.escapeHTML(ctx.text)}</span>
                </div>
            `;
        }).join('');

        // Add click handlers to jump to context line
        this.headerEl.querySelectorAll('.sticky-line').forEach(line => {
            line.addEventListener('click', () => {
                const lineNum = parseInt(line.dataset.line);
                this.jumpToLine(lineNum);
            });
        });
    }

    /**
     * Get icon for context type
     */
    getIconForType(type) {
        const icons = {
            'function': '𝑓',
            'method': '𝑚',
            'class': '𝐶',
            'component': '⚛',
            'selector': '◆',
            'tag': '⟨⟩',
            'media': '@',
            'interface': 'I',
            'type': 'T'
        };
        return icons[type] || '•';
    }

    /**
     * Jump to a specific line
     */
    jumpToLine(lineNum) {
        this.codeMirror.setCursor(lineNum, 0);
        this.codeMirror.scrollIntoView({ line: lineNum, ch: 0 }, 100);
        this.codeMirror.focus();
        
        // Flash the line to show where we jumped
        const lineHandle = this.codeMirror.getLineHandle(lineNum);
        if (lineHandle) {
            this.codeMirror.addLineClass(lineHandle, 'background', 'sticky-jump-highlight');
            setTimeout(() => {
                this.codeMirror.removeLineClass(lineHandle, 'background', 'sticky-jump-highlight');
            }, 1000);
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Enable sticky scroll
     */
    enable() {
        if (!this.enabled) {
            this.enabled = true;
            this.updateStickyContext();
            console.log('Sticky scroll enabled');
        }
    }

    /**
     * Disable sticky scroll
     */
    disable() {
        if (this.enabled) {
            this.enabled = false;
            this.headerEl.classList.add('hidden');
            console.log('Sticky scroll disabled');
        }
    }

    /**
     * Toggle sticky scroll on/off
     */
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    }

    /**
     * Check if sticky scroll is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Set maximum number of context lines
     */
    setMaxContextLines(max) {
        this.maxContextLines = Math.max(1, Math.min(5, max)); // Between 1 and 5
        this.contextCache.clear();
        if (this.enabled) {
            this.updateStickyContext();
        }
    }

    /**
     * Get current context at cursor position
     */
    getCurrentContext() {
        const cursor = this.codeMirror.getCursor();
        return this.findContext(cursor.line);
    }

    /**
     * Destroy the manager and clean up
     */
    destroy() {
        this.disable();
        if (this.headerEl && this.headerEl.parentNode) {
            this.headerEl.parentNode.removeChild(this.headerEl);
        }
        this.contextCache.clear();
        console.log('StickyScrollManager destroyed');
    }
}
