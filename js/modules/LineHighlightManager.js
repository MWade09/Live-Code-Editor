/**
 * LineHighlightManager - Enhanced line highlighting and cursor visibility
 */
export class LineHighlightManager {
    constructor(editor, codeMirror) {
        this.editor = editor;
        this.codeMirror = codeMirror;
        this.isEnabled = true;
        this.showRelativeLineNumbers = false;
        this.highlightCurrentLineOnly = false;
        this.animateCursor = true;
        this.showIndentGuides = true;
        
        // Configuration
        this.config = {
            activeLineOpacity: 0.08,
            cursorWidth: 2,
            cursorBlinkRate: 530,
            indentGuideOpacity: 0.1,
            bracketHighlightDelay: 100,
            smoothAnimations: true
        };
        
        this.initializeLineHighlighting();
    }

    /**
     * Initialize line highlighting features
     */
    initializeLineHighlighting() {
        this.setupEnhancedActiveLine();
        this.setupCursorEnhancements();
        this.setupIndentGuides();
        this.setupBracketHighlighting();
        this.setupLineNumberEnhancements();
        this.setupEventListeners();
        this.addControlButtons();
    }

    /**
     * Setup enhanced active line highlighting
     */
    setupEnhancedActiveLine() {
        // Create custom active line marker
        this.activeLineClass = 'enhanced-active-line';
        
        // Add custom CSS for enhanced active line
        this.addActiveLineStyles();
        
        // Override default active line behavior
        this.codeMirror.setOption('styleActiveLine', {
            nonEmpty: true
        });
    }

    /**
     * Add active line styles dynamically
     */
    addActiveLineStyles() {
        const existingStyle = document.getElementById('line-highlight-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'line-highlight-styles';
        style.textContent = `
            /* Enhanced Active Line Highlighting */
            .enhanced-active-line {
                background: linear-gradient(90deg, 
                    rgba(67, 97, 238, ${this.config.activeLineOpacity}) 0%,
                    rgba(67, 97, 238, ${this.config.activeLineOpacity * 0.7}) 98%,
                    transparent 100%) !important;
                position: relative;
                z-index: 1;
                transition: none !important; /* Prevent flickering */
            }
            
            .enhanced-active-line::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background: var(--accent-color);
                opacity: 0.6;
                transition: opacity 0.15s ease;
            }
            
            .enhanced-active-line:hover::before {
                opacity: 1;
            }
            
            /* Dark theme adjustments */
            .dark-theme .enhanced-active-line {
                background: linear-gradient(90deg, 
                    rgba(67, 97, 238, ${this.config.activeLineOpacity * 1.5}) 0%,
                    rgba(67, 97, 238, ${this.config.activeLineOpacity}) 98%,
                    transparent 100%) !important;
            }
            
            /* Enhanced line number highlighting - reduced animation */
            .CodeMirror-activeline .CodeMirror-linenumber {
                background: var(--accent-color) !important;
                color: white !important;
                font-weight: 600 !important;
                border-radius: 3px;
                padding: 0 6px !important;
                margin-right: 4px !important;
                transition: all 0.15s ease !important; /* Faster transition */
                box-shadow: 0 2px 4px rgba(67, 97, 238, 0.3) !important;
            }
            
            .CodeMirror-activeline .CodeMirror-linenumber::before {
                content: '';
                position: absolute;
                left: -2px;
                top: 50%;
                transform: translateY(-50%);
                width: 0;
                height: 0;
                border-left: 4px solid var(--accent-color);
                border-top: 4px solid transparent;
                border-bottom: 4px solid transparent;
                opacity: 0.8;
            }
            
            /* Relative line numbers - no transitions to prevent flicker */
            .relative-line-numbers .CodeMirror-linenumber:not(.CodeMirror-activeline .CodeMirror-linenumber) {
                color: var(--tertiary-text) !important;
                font-size: 11px !important;
                transition: none !important;
            }
            
            /* Indent guides - optimized for performance */
            .indent-guide {
                position: absolute;
                width: 1px;
                background: var(--border-color);
                opacity: ${this.config.indentGuideOpacity};
                transition: opacity 0.1s ease;
                pointer-events: none;
                will-change: opacity; /* GPU acceleration hint */
            }
            
            .indent-guide.active {
                opacity: ${this.config.indentGuideOpacity * 3};
                background: var(--accent-color);
                box-shadow: 0 0 2px rgba(67, 97, 238, 0.5);
            }
            
            .dark-theme .indent-guide {
                background: var(--secondary-text);
            }
            
            /* Enhanced bracket matching - reduced animation */
            .CodeMirror-matchingbracket {
                background: rgba(67, 97, 238, 0.2) !important;
                color: var(--accent-color) !important;
                font-weight: bold !important;
                border-radius: 2px !important;
                border: 1px solid var(--accent-color) !important;
                transition: all 0.1s ease !important; /* Faster, no animation */
            }
            
            .dark-theme .CodeMirror-matchingbracket {
                background: rgba(67, 97, 238, 0.3) !important;
            }
            
            /* Enhanced cursor animations - conditional */
            .animated-cursor .CodeMirror-cursor {
                border-left-width: ${this.config.cursorWidth}px !important;
                transition: opacity 0.1s ease !important;
                animation: cursorPulse ${this.config.cursorBlinkRate}ms infinite !important;
            }
            
            @keyframes cursorPulse {
                0%, 50% { 
                    opacity: 1; 
                }
                51%, 100% { 
                    opacity: 0; 
                }
            }
            
            /* Multiple cursor enhancements - simplified */
            .animated-cursor .CodeMirror-secondarycursor {
                border-left-width: ${this.config.cursorWidth}px !important;
                animation: secondaryCursorPulse ${this.config.cursorBlinkRate}ms infinite !important;
                box-shadow: 0 0 4px rgba(255, 107, 107, 0.3) !important;
            }
            
            @keyframes secondaryCursorPulse {
                0%, 50% { 
                    opacity: 1; 
                    border-left-color: #ff6b6b;
                }
                51%, 100% { 
                    opacity: 0; 
                    border-left-color: rgba(255, 107, 107, 0.5);
                }
            }
            
            /* Selection enhancements - no transitions */
            .CodeMirror-selected {
                background: linear-gradient(90deg, 
                    rgba(67, 97, 238, 0.15), 
                    rgba(67, 97, 238, 0.1)) !important;
                border-radius: 2px !important;
            }
            
            .dark-theme .CodeMirror-selected {
                background: linear-gradient(90deg, 
                    rgba(67, 97, 238, 0.25), 
                    rgba(67, 97, 238, 0.15)) !important;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Setup cursor enhancements
     */
    setupCursorEnhancements() {
        if (this.animateCursor) {
            this.codeMirror.getWrapperElement().classList.add('animated-cursor');
        }
        
        // Track current active line
        this.currentActiveLine = null;
        
        // Enhanced cursor positioning on click - debounced to prevent flickering
        this.cursorActivityHandler = this.debounce(() => {
            this.updateActiveLineHighlight();
            this.updateIndentGuides();
            this.highlightMatchingBrackets();
        }, 50);
        
        this.codeMirror.on('cursorActivity', this.cursorActivityHandler);
    }

    /**
     * Debounce utility to prevent excessive updates
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Update active line highlight
     */
    updateActiveLineHighlight() {
        const cursor = this.codeMirror.getCursor();
        const newActiveLine = cursor.line;
        
        // Skip if same line to prevent flickering
        if (this.currentActiveLine === newActiveLine) {
            return;
        }
        
        // Remove previous highlight
        if (this.currentActiveLine !== null) {
            this.codeMirror.removeLineClass(this.currentActiveLine, 'wrap', 'enhanced-active-line');
            this.codeMirror.removeLineClass(this.currentActiveLine, 'background', 'enhanced-active-line');
            this.codeMirror.removeLineClass(this.currentActiveLine, 'text', 'enhanced-active-line');
        }
        
        // Add highlight to current line
        this.codeMirror.addLineClass(newActiveLine, 'wrap', 'enhanced-active-line');
        this.currentActiveLine = newActiveLine;
    }

    /**
     * Update indent guides with debouncing
     */
    updateIndentGuides() {
        if (!this.showIndentGuides || !this.indentGuideContainer) return;
        
        // Use requestAnimationFrame for smooth updates
        if (this.indentGuideUpdateId) {
            cancelAnimationFrame(this.indentGuideUpdateId);
        }
        
        this.indentGuideUpdateId = requestAnimationFrame(() => {
            this.renderIndentGuides();
        });
    }

    /**
     * Render indent guides (separated from update for performance)
     */
    renderIndentGuides() {
        // Clear existing guides
        this.indentGuideContainer.innerHTML = '';
        
        const cursor = this.codeMirror.getCursor();
        const viewport = this.codeMirror.getViewport();
        const tabSize = this.codeMirror.getOption('tabSize') || 4;
        const charWidth = this.codeMirror.defaultCharWidth();
        const currentLineIndent = this.getIndentLevel(this.codeMirror.getLine(cursor.line) || '', tabSize);
        
        // Get scroll information to position guides correctly
        const scrollInfo = this.codeMirror.getScrollInfo();
        const topVisibleLine = this.codeMirror.lineAtHeight(scrollInfo.top, 'local');
        
        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        for (let line = viewport.from; line < viewport.to; line++) {
            const lineText = this.codeMirror.getLine(line);
            if (!lineText || !lineText.trim()) continue;
            
            const indent = this.getIndentLevel(lineText, tabSize);
            if (indent === 0) continue;
            
            // Get the line position relative to the viewport (visible area)
            const lineTop = this.codeMirror.heightAtLine(line, 'local') - scrollInfo.top;
            const lineHeight = this.codeMirror.defaultTextHeight();
            
            // Only render guides that are actually visible
            if (lineTop < -lineHeight || lineTop > scrollInfo.clientHeight + lineHeight) {
                continue;
            }
            
            for (let level = 1; level <= indent; level++) {
                const guide = document.createElement('div');
                guide.className = 'indent-guide';
                
                // Highlight active indent level for current line
                if (line === cursor.line && level <= currentLineIndent) {
                    guide.classList.add('active');
                }
                
                guide.style.cssText = `
                    left: ${(level * tabSize * charWidth) + 40}px;
                    top: ${lineTop}px;
                    height: ${lineHeight}px;
                `;
                
                fragment.appendChild(guide);
            }
        }
        
        this.indentGuideContainer.appendChild(fragment);
    }

    /**
     * Setup indent guides
     */
    setupIndentGuides() {
        if (!this.showIndentGuides) return;
        
        this.indentGuideContainer = document.createElement('div');
        this.indentGuideContainer.className = 'indent-guides-container';
        this.indentGuideContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 1;
        `;
        
        this.codeMirror.getWrapperElement().appendChild(this.indentGuideContainer);
    }

    /**
     * Setup bracket highlighting
     */
    setupBracketHighlighting() {
        this.codeMirror.setOption('matchBrackets', {
            maxScanLines: 1000,
            maxScanLineLength: 10000,
            maxHighlightLineLength: 1000
        });
    }

    /**
     * Setup line number enhancements
     */
    setupLineNumberEnhancements() {
        // Add click handlers for line numbers
        this.gutterClickHandler = (cm, line, gutter, clickEvent) => {
            if (gutter === 'CodeMirror-linenumbers') {
                this.handleLineNumberClick(cm, line, clickEvent);
            }
        };
        
        this.codeMirror.on('gutterClick', this.gutterClickHandler);
    }

    /**
     * Handle line number clicks
     */
    handleLineNumberClick(cm, line, clickEvent) {
        if (clickEvent.shiftKey) {
            // Select from current cursor to clicked line
            const cursor = cm.getCursor();
            const startLine = Math.min(cursor.line, line);
            const endLine = Math.max(cursor.line, line);
            cm.setSelection(
                { line: startLine, ch: 0 },
                { line: endLine + 1, ch: 0 }
            );
        } else if (clickEvent.ctrlKey || clickEvent.metaKey) {
            // Add cursor at clicked line
            const cursors = cm.listSelections();
            cursors.push({
                anchor: { line: line, ch: 0 },
                head: { line: line, ch: 0 }
            });
            cm.setSelections(cursors);
        } else {
            // Normal click - position cursor at beginning of line
            cm.setCursor({ line: line, ch: 0 });
        }
    }

    /**
     * Get indent level of a line
     */
    getIndentLevel(lineText, tabSize) {
        const match = lineText.match(/^(\s*)/);
        if (!match) return 0;
        
        const spaces = match[1];
        return Math.floor((spaces.replace(/\t/g, ' '.repeat(tabSize)).length) / tabSize);
    }

    /**
     * Highlight matching brackets with animation
     */
    highlightMatchingBrackets() {
        setTimeout(() => {
            const cursor = this.codeMirror.getCursor();
            const token = this.codeMirror.getTokenAt(cursor);
            
            if (token && /bracket/.test(token.type)) {
                // Trigger bracket matching animation
                const matchingBrackets = this.codeMirror.getWrapperElement().querySelectorAll('.CodeMirror-matchingbracket');
                matchingBrackets.forEach(bracket => {
                    bracket.style.animation = 'none';
                    setTimeout(() => {
                        bracket.style.animation = 'bracketHighlight 0.3s ease';
                    }, 10);
                });
            }
        }, this.config.bracketHighlightDelay);
    }

    /**
     * Setup event listeners with proper cleanup tracking
     */
    setupEventListeners() {
        // Debounced handlers to prevent excessive updates
        this.viewportChangeHandler = this.debounce(() => {
            this.updateIndentGuides();
        }, 100);
        
        this.scrollHandler = this.debounce(() => {
            this.updateIndentGuides();
        }, 50);
        
        this.changeHandler = this.debounce(() => {
            this.updateIndentGuides();
        }, 150);
        
        this.themeChangeHandler = () => {
            this.addActiveLineStyles();
        };
        
        this.resizeHandler = this.debounce(() => {
            this.updateIndentGuides();
        }, 200);
        
        // Add listeners
        this.codeMirror.on('viewportChange', this.viewportChangeHandler);
        this.codeMirror.on('scroll', this.scrollHandler);
        this.codeMirror.on('change', this.changeHandler);
        document.addEventListener('themeChanged', this.themeChangeHandler);
        window.addEventListener('resize', this.resizeHandler);
        
        // Store handlers for cleanup
        this.eventHandlers = {
            viewportChange: this.viewportChangeHandler,
            scroll: this.scrollHandler,
            change: this.changeHandler,
            themeChange: this.themeChangeHandler,
            resize: this.resizeHandler,
            gutterClick: this.gutterClickHandler,
            cursorActivity: this.cursorActivityHandler
        };
    }

    /**
     * Add control buttons
     */
    addControlButtons() {
        const editorControls = document.querySelector('.editor-controls');
        if (!editorControls) return;
        
        // Create and add line highlight controls
        const lineControlsHTML = `
            <div class="line-highlight-controls">
                <button class="editor-control-btn relative-numbers-toggle" title="Toggle Relative Line Numbers">
                    <i class="fas fa-sort-numeric-down"></i>
                </button>
                <button class="editor-control-btn indent-guides-toggle active" title="Toggle Indent Guides">
                    <i class="fas fa-grip-lines-vertical"></i>
                </button>
                <button class="editor-control-btn cursor-animation-toggle active" title="Toggle Cursor Animation">
                    <i class="fas fa-mouse-pointer"></i>
                </button>
            </div>
        `;
        
        editorControls.insertAdjacentHTML('beforeend', lineControlsHTML);
        
        // Add event listeners
        this.setupControlButtonEvents();
    }

    /**
     * Setup control button events
     */
    setupControlButtonEvents() {
        const relativeNumbersBtn = document.querySelector('.relative-numbers-toggle');
        const indentGuidesBtn = document.querySelector('.indent-guides-toggle');
        const cursorAnimationBtn = document.querySelector('.cursor-animation-toggle');
        
        if (relativeNumbersBtn) {
            relativeNumbersBtn.addEventListener('click', () => {
                this.toggleRelativeLineNumbers();
            });
        }
        
        if (indentGuidesBtn) {
            indentGuidesBtn.addEventListener('click', () => {
                this.toggleIndentGuides();
            });
        }
        
        if (cursorAnimationBtn) {
            cursorAnimationBtn.addEventListener('click', () => {
                this.toggleCursorAnimation();
            });
        }
    }

    /**
     * Toggle relative line numbers
     */
    toggleRelativeLineNumbers() {
        this.showRelativeLineNumbers = !this.showRelativeLineNumbers;
        const wrapper = this.codeMirror.getWrapperElement();
        
        if (this.showRelativeLineNumbers) {
            wrapper.classList.add('relative-line-numbers');
            this.setupRelativeLineNumbers();
        } else {
            wrapper.classList.remove('relative-line-numbers');
            this.restoreAbsoluteLineNumbers();
        }
        
        const button = document.querySelector('.relative-numbers-toggle');
        if (button) {
            button.classList.toggle('active', this.showRelativeLineNumbers);
        }
        
        this.editor.showNotification(
            `Relative line numbers ${this.showRelativeLineNumbers ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    /**
     * Setup relative line numbers
     */
    setupRelativeLineNumbers() {
        this.codeMirror.on('cursorActivity', this.updateRelativeNumbers.bind(this));
        this.updateRelativeNumbers();
    }

    /**
     * Update relative line numbers
     */
    updateRelativeNumbers() {
        if (!this.showRelativeLineNumbers) return;
        
        const cursor = this.codeMirror.getCursor();
        const viewport = this.codeMirror.getViewport();
        
        for (let line = viewport.from; line < viewport.to; line++) {
            const distance = Math.abs(line - cursor.line);
            const lineNumber = line === cursor.line ? line + 1 : distance;
            
            // Update line number display
            const lineElement = this.codeMirror.getLineHandle(line);
            if (lineElement) {
                this.codeMirror.setGutterMarker(line, 'CodeMirror-linenumbers', 
                    this.createLineNumberElement(lineNumber, line === cursor.line));
            }
        }
    }

    /**
     * Create line number element
     */
    createLineNumberElement(number, isActive) {
        const element = document.createElement('div');
        element.textContent = number;
        element.className = isActive ? 'active-line-number' : 'relative-line-number';
        return element;
    }

    /**
     * Restore absolute line numbers
     */
    restoreAbsoluteLineNumbers() {
        this.codeMirror.off('cursorActivity', this.updateRelativeNumbers.bind(this));
        
        const viewport = this.codeMirror.getViewport();
        for (let line = viewport.from; line < viewport.to; line++) {
            this.codeMirror.setGutterMarker(line, 'CodeMirror-linenumbers', null);
        }
    }

    /**
     * Toggle indent guides
     */
    toggleIndentGuides() {
        this.showIndentGuides = !this.showIndentGuides;
        
        if (this.showIndentGuides) {
            if (!this.indentGuideContainer) {
                this.setupIndentGuides();
            }
            this.updateIndentGuides();
        } else {
            if (this.indentGuideContainer) {
                this.indentGuideContainer.innerHTML = '';
            }
        }
        
        const button = document.querySelector('.indent-guides-toggle');
        if (button) {
            button.classList.toggle('active', this.showIndentGuides);
        }
        
        this.editor.showNotification(
            `Indent guides ${this.showIndentGuides ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    /**
     * Toggle cursor animation
     */
    toggleCursorAnimation() {
        this.animateCursor = !this.animateCursor;
        const wrapper = this.codeMirror.getWrapperElement();
        
        if (this.animateCursor) {
            wrapper.classList.add('animated-cursor');
        } else {
            wrapper.classList.remove('animated-cursor');
        }
        
        const button = document.querySelector('.cursor-animation-toggle');
        if (button) {
            button.classList.toggle('active', this.animateCursor);
        }
        
        this.editor.showNotification(
            `Cursor animation ${this.animateCursor ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.addActiveLineStyles();
        this.updateIndentGuides();
    }

    /**
     * Get current stats
     */
    getStats() {
        return {
            enabled: this.isEnabled,
            relativeLineNumbers: this.showRelativeLineNumbers,
            indentGuides: this.showIndentGuides,
            cursorAnimation: this.animateCursor,
            activeLineOpacity: this.config.activeLineOpacity
        };
    }

    /**
     * Destroy line highlight manager
     */
    destroy() {
        // Cancel any pending animation frames
        if (this.indentGuideUpdateId) {
            cancelAnimationFrame(this.indentGuideUpdateId);
        }
        
        // Remove all event listeners
        if (this.eventHandlers) {
            this.codeMirror.off('cursorActivity', this.eventHandlers.cursorActivity);
            this.codeMirror.off('viewportChange', this.eventHandlers.viewportChange);
            this.codeMirror.off('scroll', this.eventHandlers.scroll);
            this.codeMirror.off('change', this.eventHandlers.change);
            this.codeMirror.off('gutterClick', this.eventHandlers.gutterClick);
            document.removeEventListener('themeChanged', this.eventHandlers.themeChange);
            window.removeEventListener('resize', this.eventHandlers.resize);
        }
        
        // Clear current active line highlight
        if (this.currentActiveLine !== null) {
            this.codeMirror.removeLineClass(this.currentActiveLine, 'wrap', 'enhanced-active-line');
            this.codeMirror.removeLineClass(this.currentActiveLine, 'background', 'enhanced-active-line');
            this.codeMirror.removeLineClass(this.currentActiveLine, 'text', 'enhanced-active-line');
        }
        
        // Remove styles
        const style = document.getElementById('line-highlight-styles');
        if (style) {
            style.remove();
        }
        
        // Remove containers
        if (this.indentGuideContainer) {
            this.indentGuideContainer.remove();
        }
        
        // Remove control buttons
        const lineControls = document.querySelector('.line-highlight-controls');
        if (lineControls) {
            lineControls.remove();
        }
        
        // Restore defaults
        this.codeMirror.getWrapperElement().classList.remove('animated-cursor', 'relative-line-numbers');
        this.restoreAbsoluteLineNumbers();
        
        // Clear references
        this.currentActiveLine = null;
        this.eventHandlers = null;
        this.indentGuideContainer = null;
    }
} 