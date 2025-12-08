/**
 * MinimapManager - Provides a VS Code-like minimap for the editor
 */
export class MinimapManager {
    constructor(editor, codeMirror) {
        this.editor = editor;
        this.codeMirror = codeMirror;
        this.minimapContainer = null;
        this.minimapCanvas = null;
        this.minimapScrollbar = null;
        this.minimapViewport = null;
        this.isEnabled = true;
        this.minimumLinesForMinimap = 50; // Only show minimap for files with 50+ lines
        this.isScrolling = false;
        this.scrollTimeout = null;
        
        // Configuration
        this.config = {
            width: 120,
            lineHeight: 2,
            fontSize: 1,
            padding: 8,
            viewportOpacity: 0.3,
            showViewport: true,
            showScrollbar: true
        };
        
        this.initializeMinimap();
    }

    /**
     * Initialize the minimap
     */
    initializeMinimap() {
        this.createMinimapContainer();
        this.setupEventListeners();
        this.updateMinimap();
        
        // Add toggle button to editor controls
        this.addToggleButton();
    }

    /**
     * Create minimap container and canvas
     */
    createMinimapContainer() {
        const editorElement = this.codeMirror.getWrapperElement();
        const editorContainer = editorElement.parentElement;
        
        // Create minimap container
        this.minimapContainer = document.createElement('div');
        this.minimapContainer.className = 'minimap-container';
        this.minimapContainer.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            width: ${this.config.width}px;
            height: 100%;
            background: var(--secondary-bg);
            border-left: 1px solid var(--border-color);
            overflow: hidden;
            z-index: 10;
            display: ${this.shouldShowMinimap() ? 'block' : 'none'};
        `;
        
        // Create canvas for rendering code
        this.minimapCanvas = document.createElement('canvas');
        this.minimapCanvas.className = 'minimap-canvas';
        this.minimapCanvas.style.cssText = `
            display: block;
            width: 100%;
            height: 100%;
            cursor: pointer;
        `;
        
        // Create viewport indicator
        this.minimapViewport = document.createElement('div');
        this.minimapViewport.className = 'minimap-viewport';
        this.minimapViewport.style.cssText = `
            position: absolute;
            left: 0;
            right: 0;
            background: var(--accent-color);
            opacity: ${this.config.viewportOpacity};
            pointer-events: none;
            border-radius: 2px;
            transition: opacity 0.2s ease;
        `;
        
        // Assemble minimap
        this.minimapContainer.appendChild(this.minimapCanvas);
        this.minimapContainer.appendChild(this.minimapViewport);
        
        // Position editor container to make room for minimap
        if (editorContainer.style.position !== 'relative') {
            editorContainer.style.position = 'relative';
        }
        
        editorContainer.appendChild(this.minimapContainer);
        
        // Adjust editor layout to make room for minimap
        this.adjustEditorLayout();
    }

    /**
     * Adjust editor layout to accommodate minimap
     */
    adjustEditorLayout() {
        const editorWrapper = this.codeMirror.getWrapperElement();
        const shouldShow = this.isEnabled && this.shouldShowMinimap();
        
        if (shouldShow) {
            editorWrapper.style.marginRight = `${this.config.width}px`;
            this.minimapContainer.style.display = 'block';
        } else {
            editorWrapper.style.marginRight = '0';
            if (this.minimapContainer) {
                this.minimapContainer.style.display = 'none';
            }
        }
        
        // Trigger CodeMirror refresh to handle layout change
        setTimeout(() => this.codeMirror.refresh(), 10);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Update minimap on content changes
        this.codeMirror.on('change', () => {
            this.updateMinimap();
        });
        
        // Update viewport on scroll
        this.codeMirror.on('scroll', () => {
            this.updateViewport();
            this.handleScrolling();
        });
        
        // Handle minimap clicks for navigation
        this.minimapCanvas.addEventListener('click', (e) => {
            this.handleMinimapClick(e);
        });
        
        // Handle minimap dragging
        this.minimapCanvas.addEventListener('mousedown', (e) => {
            this.handleMinimapDrag(e);
        });
        
        // Update on viewport changes
        this.codeMirror.on('viewportChange', () => {
            this.updateMinimap();
        });
        
        // Handle theme changes
        document.addEventListener('themeChanged', () => {
            this.updateMinimap();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeMinimap();
        });
    }

    /**
     * Handle scroll events with debouncing
     */
    handleScrolling() {
        this.isScrolling = true;
        this.minimapViewport.style.opacity = '0.6';
        
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
            this.minimapViewport.style.opacity = this.config.viewportOpacity.toString();
        }, 150);
    }

    /**
     * Check if minimap should be shown based on file size
     */
    shouldShowMinimap() {
        const lineCount = this.codeMirror.lineCount();
        return lineCount >= this.minimumLinesForMinimap;
    }

    /**
     * Update the minimap rendering
     */
    updateMinimap() {
        if (!this.minimapContainer || !this.minimapCanvas) return;
        
        const shouldShow = this.shouldShowMinimap();
        
        if (!shouldShow) {
            this.adjustEditorLayout();
            return;
        }
        
        this.adjustEditorLayout();
        this.renderMinimap();
        this.updateViewport();
    }

    /**
     * Render the minimap content
     */
    renderMinimap() {
        const canvas = this.minimapCanvas;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        // Set canvas size with device pixel ratio for crisp rendering
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        const lineCount = this.codeMirror.lineCount();
        const availableHeight = rect.height - (this.config.padding * 2);
        const lineHeight = Math.max(1, availableHeight / lineCount);
        
        // Get theme colors
        const isDark = document.body.classList.contains('dark-theme');
        const colors = this.getThemeColors(isDark);
        
        // Render each line
        for (let i = 0; i < lineCount; i++) {
            const line = this.codeMirror.getLine(i);
            if (!line) continue;
            
            const y = this.config.padding + (i * lineHeight);
            this.renderLine(ctx, line, y, lineHeight, colors, rect.width);
        }
    }

    /**
     * Render a single line in the minimap
     */
    renderLine(ctx, lineText, y, lineHeight, colors, canvasWidth) {
        const trimmedLine = lineText.trim();
        if (!trimmedLine) return;
        
        // Calculate line intensity based on content
        const intensity = Math.min(1, trimmedLine.length / 80);
        const alpha = 0.3 + (intensity * 0.5);
        
        // Choose color based on line content
        let color = colors.text;
        
        // Syntax highlighting hints
        if (trimmedLine.match(/^(class|function|const|let|var|def|import|export)/)) {
            color = colors.keyword;
        } else if (trimmedLine.match(/^(\/\/|\/\*|#|<!--)/)) {
            color = colors.comment;
        } else if (trimmedLine.match(/[{}[\]]/)) {
            color = colors.bracket;
        } else if (trimmedLine.match(/["'`]/)) {
            color = colors.string;
        }
        
        // Render line as a colored rectangle
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        
        const lineWidth = Math.max(2, Math.min(canvasWidth - 16, (trimmedLine.length / 100) * canvasWidth));
        const height = Math.max(1, lineHeight);
        
        ctx.fillRect(8, y, lineWidth, height);
        ctx.globalAlpha = 1;
    }

    /**
     * Get theme-appropriate colors
     */
    getThemeColors(isDark) {
        if (isDark) {
            return {
                text: '#e2e8f0',
                keyword: '#4cc9f0',
                comment: '#718096',
                bracket: '#ffa726',
                string: '#26de81'
            };
        } else {
            return {
                text: '#2d3748',
                keyword: '#4361ee',
                comment: '#a0aec0',
                bracket: '#f6ad55',
                string: '#38a169'
            };
        }
    }

    /**
     * Update viewport indicator
     */
    updateViewport() {
        if (!this.minimapViewport || !this.shouldShowMinimap()) return;
        
        const scrollInfo = this.codeMirror.getScrollInfo();
        const lineCount = this.codeMirror.lineCount();
        void lineCount; // Reserved for future line calculations
        const containerHeight = this.minimapContainer.clientHeight;
        const availableHeight = containerHeight - (this.config.padding * 2);
        
        // Calculate viewport position and size
        const viewportTop = (scrollInfo.top / scrollInfo.height) * availableHeight + this.config.padding;
        const viewportHeight = (scrollInfo.clientHeight / scrollInfo.height) * availableHeight;
        
        // Update viewport indicator
        this.minimapViewport.style.top = `${Math.max(0, viewportTop)}px`;
        this.minimapViewport.style.height = `${Math.min(containerHeight, viewportHeight)}px`;
    }

    /**
     * Handle minimap click for navigation
     */
    handleMinimapClick(e) {
        const rect = this.minimapCanvas.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const containerHeight = rect.height - (this.config.padding * 2);
        const ratio = (clickY - this.config.padding) / containerHeight;
        
        const scrollInfo = this.codeMirror.getScrollInfo();
        const targetScroll = ratio * scrollInfo.height;
        
        this.codeMirror.scrollTo(null, targetScroll);
    }

    /**
     * Handle minimap dragging
     */
    handleMinimapDrag(e) {
        e.preventDefault();
        
        const handleMouseMove = (moveEvent) => {
            const rect = this.minimapCanvas.getBoundingClientRect();
            const dragY = moveEvent.clientY - rect.top;
            const containerHeight = rect.height - (this.config.padding * 2);
            const ratio = Math.max(0, Math.min(1, (dragY - this.config.padding) / containerHeight));
            
            const scrollInfo = this.codeMirror.getScrollInfo();
            const targetScroll = ratio * scrollInfo.height;
            
            this.codeMirror.scrollTo(null, targetScroll);
        };
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    /**
     * Resize minimap when window resizes
     */
    resizeMinimap() {
        if (!this.minimapContainer) return;
        
        // Trigger a redraw after a short delay
        setTimeout(() => {
            this.updateMinimap();
        }, 100);
    }

    /**
     * Add toggle button to editor controls
     */
    addToggleButton() {
        const editorControls = document.querySelector('.editor-controls');
        if (!editorControls) return;
        
        // Add minimap toggle button
        const minimapHTML = `
            <div class="minimap-controls">
                <button class="editor-control-btn minimap-toggle ${this.isEnabled && this.shouldShowMinimap() ? 'active' : ''}" title="Toggle Minimap">
                    <i class="fas fa-map"></i>
                </button>
            </div>
        `;
        
        editorControls.insertAdjacentHTML('beforeend', minimapHTML);
        
        // Add event listener
        const toggleButton = editorControls.querySelector('.minimap-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleMinimap());
        }
    }

    /**
     * Toggle minimap visibility
     */
    toggleMinimap() {
        this.isEnabled = !this.isEnabled;
        
        if (this.isEnabled && this.shouldShowMinimap()) {
            this.show();
        } else {
            this.hide();
        }
        
        // Update toggle button state
        const button = document.querySelector('.minimap-toggle');
        if (button) {
            button.classList.toggle('active', this.isEnabled);
            button.title = this.isEnabled ? 'Hide Minimap' : 'Show Minimap';
        }
        
        // Notify user
        this.editor.showNotification(
            `Minimap ${this.isEnabled ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    /**
     * Show minimap
     */
    show() {
        if (!this.minimapContainer) {
            this.createMinimapContainer();
        }
        
        this.minimapContainer.style.display = 'block';
        this.adjustEditorLayout(); // Ensure layout is adjusted when showing
        this.renderMinimap();
        this.updateViewport();
    }

    /**
     * Hide minimap
     */
    hide() {
        if (this.minimapContainer) {
            this.minimapContainer.style.display = 'none';
        }
        // Adjust editor layout to reclaim the space
        this.adjustEditorLayout();
    }

    /**
     * Update minimap configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.updateMinimap();
    }

    /**
     * Destroy minimap
     */
    destroy() {
        if (this.minimapContainer) {
            this.minimapContainer.remove();
        }
        
        // Reset editor layout
        const editorWrapper = this.codeMirror.getWrapperElement();
        editorWrapper.style.marginRight = '0';
        
        // Remove toggle button
        const toggleButton = document.querySelector('.minimap-toggle');
        if (toggleButton) {
            toggleButton.remove();
        }
        
        // Clear timeouts
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
    }

    /**
     * Get minimap statistics
     */
    getStats() {
        return {
            enabled: this.isEnabled,
            visible: this.shouldShowMinimap(),
            lineCount: this.codeMirror.lineCount(),
            minimumLines: this.minimumLinesForMinimap,
            width: this.config.width
        };
    }
} 