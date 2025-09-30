/**
 * InlineAIManager - Provides Cursor-like inline AI code suggestions
 * Features:
 * - Real-time AI-powered code completion as you type
 * - Inline suggestions with Tab-to-accept
 * - Context-aware suggestions based on current file and cursor position
 * - Multi-line code suggestions
 * - Debounced API calls for performance
 * - Robust widget management to prevent UI persistence issues
 */

export class InlineAIManager {
    constructor(editor, aiManager, fileManager) {
        this.editor = editor;
        this.aiManager = aiManager;
        this.fileManager = fileManager;
        this.cm = editor.codeMirror; // Use codeMirror property from Editor class
        
        // Configuration
        this.enabled = true;
        this.debounceDelay = 2000; // Increased to 2 seconds - only trigger when user actually pauses
        this.requestTimeout = 10000; // 10 second timeout for API requests
        this.minTriggerLength = 5; // Increased minimum length to reduce noise
        this.maxSuggestionLength = 500; // Maximum characters in suggestion
        
        // State management
        this.currentSuggestion = null;
        this.activeWidgets = new Set(); // Track all active widgets for robust cleanup
        this.isGenerating = false;
        this.debounceTimer = null;
        this.lastTriggerPos = null;
        this.lastContext = '';
        this.currentAbortController = null; // For cancelling requests
        this.requestStartTime = null; // Track request timing
        
        // Bind methods
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleCursorActivity = this.handleCursorActivity.bind(this);
        
        this.init();
    }
    
    init() {
        if (!this.cm) {
            console.error('InlineAIManager: CodeMirror instance not available');
            return;
        }
        
        console.log('✨ InlineAIManager: CodeMirror instance found:', this.cm);
        
        // Set up event listeners with high priority for keydown
        this.cm.on('change', this.handleTextChange);
        this.cm.on('keydown', this.handleKeyDown);
        this.cm.on('keyup', this.handleKeyUp);
        this.cm.on('cursorActivity', this.handleCursorActivity);
        
        // Add additional keydown listener with capture for Tab key reliability
        if (this.cm.getWrapperElement) {
            const wrapper = this.cm.getWrapperElement();
            wrapper.addEventListener('keydown', this.handleKeyDown, true); // Use capture phase
        }
        
        // Add suggestion styles
        this.addSuggestionStyles();
        
        console.log('✨ Inline AI Suggestions enabled');
    }
    
    handleTextChange(cm, change) {
        console.log('🔄 InlineAI: Text change detected', { enabled: this.enabled, isGenerating: this.isGenerating, origin: change.origin });
        
        if (!this.enabled) {
            console.log('❌ InlineAI: Disabled, skipping');
            return;
        }
        
        // Always clear existing suggestions and cancel any pending requests when user types
        if (change.origin === '+input') {
            console.log('🧹 InlineAI: User typing - clearing all suggestions and cancelling requests');
            this.cancelCurrentRequest();
            this.clearAllSuggestions();
        }
        
        // Only trigger on user input, not programmatic changes
        if (change.origin !== '+input') {
            console.log('❌ InlineAI: Not user input, skipping');
            return;
        }
        
        // Don't queue new requests if we're already generating
        if (this.isGenerating) {
            console.log('❌ InlineAI: Already generating, skipping new request');
            return;
        }
        
        console.log('⏰ InlineAI: Setting debounce timer');
        
        // Clear any existing timer
        clearTimeout(this.debounceTimer);
        
        // Set a longer debounce to only trigger when user actually pauses
        this.debounceTimer = setTimeout(() => {
            console.log('🎯 InlineAI: User paused typing, triggering suggestion');
            this.triggerSuggestion();
        }, this.debounceDelay);
    }
    
    handleKeyDown(cm, event) {
        // Handle different calling patterns (CodeMirror vs DOM event)
        if (typeof cm === 'object' && cm.key) {
            // Called directly as DOM event, cm is actually the event
            event = cm;
        }
        
        if (!event || !event.key) {
            console.warn('⚠️ InlineAI: handleKeyDown called without valid event');
            return;
        }
        
        console.log('⌨️ InlineAI: Key pressed:', event.key, 'Has suggestion:', !!this.currentSuggestion);
        
        // Handle Tab to accept suggestion - make this the highest priority
        if (event.key === 'Tab' && this.currentSuggestion) {
            console.log('✅ InlineAI: Tab pressed, accepting suggestion');
                  // Add visual feedback
        const container = document.querySelector('[data-suggestion-widget="true"]');
        if (container) {
            container.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
            container.style.borderColor = '#4CAF50';
            container.style.transform = 'scale(1.1)';
            container.style.boxShadow = '0 8px 24px rgba(76, 175, 80, 0.6)';
        }
            
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            // Use setTimeout to ensure this executes after any other event handlers
            setTimeout(() => {
                this.acceptSuggestion();
            }, 0);
            return false;
        }
        
        // Handle Escape to dismiss suggestion
        if (event.key === 'Escape' && this.currentSuggestion) {
            console.log('❌ InlineAI: Escape pressed, dismissing suggestion');
            event.preventDefault();
            event.stopPropagation();
            this.clearAllSuggestions();
            return false;
        }
        
        // Clear suggestion on navigation keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
            if (this.currentSuggestion) {
                console.log('🧹 InlineAI: Navigation key pressed, clearing suggestion');
                this.clearAllSuggestions();
            }
        }
    }
    
    handleKeyUp(cm, event) {
        // Additional key handling if needed
    }
    
    handleCursorActivity(cm) {
        // Clear suggestion when cursor moves (unless it's just at the end of suggestion)
        if (this.currentSuggestion) {
            const cursor = cm.getCursor();
            const suggestionEnd = this.getSuggestionEndPos();
            
            if (!cursor || !suggestionEnd || 
                cursor.line !== suggestionEnd.line || 
                cursor.ch !== suggestionEnd.ch) {
                this.clearAllSuggestions();
            }
        }
    }
    
    async triggerSuggestion() {
        console.log('🎯 InlineAI: triggerSuggestion called', { enabled: this.enabled, isGenerating: this.isGenerating });
        
        if (!this.enabled || this.isGenerating) return;
        
        const cursor = this.cm.getCursor();
        const currentLine = this.cm.getLine(cursor.line);
        
        console.log('📍 InlineAI: Cursor position', { cursor, currentLine, lineLength: currentLine.length });
        
        // Don't trigger if cursor is not at end of line
        if (cursor.ch !== currentLine.length) {
            console.log('❌ InlineAI: Cursor not at end of line');
            return;
        }
        
        // Don't trigger for very short content
        if (currentLine.length < this.minTriggerLength) {
            console.log('❌ InlineAI: Line too short', { length: currentLine.length, minLength: this.minTriggerLength });
            return;
        }
        
        // Get context around cursor
        const context = this.getContext(cursor);
        
        // Don't re-generate if context hasn't changed much
        if (context === this.lastContext) {
            console.log('❌ InlineAI: Context unchanged');
            return;
        }
        this.lastContext = context;
        
        console.log('🚀 InlineAI: Starting suggestion generation...', { contextLength: context.content.length });
        
        // Set generating state BEFORE starting anything
        this.isGenerating = true;
        this.requestStartTime = Date.now();
        
        // Show loading indicator immediately
        this.showLoadingIndicator();
        
        try {
            // Create abort controller for this request
            this.currentAbortController = new AbortController();
            
            // Set up timeout
            const timeoutId = setTimeout(() => {
                console.log('⏰ InlineAI: Request timeout');
                if (this.currentAbortController) {
                    this.currentAbortController.abort();
                }
            }, this.requestTimeout);
            
            // Generate suggestion with abort signal
            const suggestion = await this.generateSuggestion(context, cursor, this.currentAbortController.signal);
            
            // Clear timeout since request completed
            clearTimeout(timeoutId);
            
            // Check if request was cancelled while we were waiting
            if (!this.isGenerating || (this.currentAbortController && this.currentAbortController.signal.aborted)) {
                console.log('🚫 InlineAI: Request was cancelled, ignoring result');
                return;
            }
            
            console.log('✅ InlineAI: Suggestion received', { suggestion });
            
            if (suggestion && suggestion.trim()) {
                this.showSuggestion(suggestion, cursor);
            } else {
                console.log('❌ InlineAI: No suggestion generated');
                this.clearAllSuggestions();
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('🚫 InlineAI: Request aborted');
            } else {
                console.error('❌ InlineAI: Error generating suggestion:', error);
                // Show a brief error message if API key is missing
                if (error.message.includes('API key not configured')) {
                    this.showErrorMessage('Set API key in chat panel');
                }
            }
            this.clearAllSuggestions();
        } finally {
            // Always reset state
            this.isGenerating = false;
            this.currentAbortController = null;
            this.requestStartTime = null;
            console.log('🔄 InlineAI: Generation complete, state reset');
        }
    }
    
    getContext(cursor) {
        const maxLines = 100; // Increased context window for better understanding
        const startLine = Math.max(0, cursor.line - maxLines);
        const endLine = Math.min(this.cm.lineCount() - 1, cursor.line + 20);
        
        let beforeCursor = '';
        let afterCursor = '';
        
        // Add file type context
        const fileName = this.fileManager.getCurrentFile()?.name || 'untitled';
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        
        // Get content before cursor (more comprehensive)
        for (let i = startLine; i <= cursor.line; i++) {
            const line = this.cm.getLine(i);
            if (i === cursor.line) {
                // Current line up to cursor
                beforeCursor += line.substring(0, cursor.ch);
            } else {
                beforeCursor += line + '\n';
            }
        }
        
        // Get content after cursor
        for (let i = cursor.line; i <= endLine; i++) {
            const line = this.cm.getLine(i);
            if (i === cursor.line) {
                // Current line from cursor onwards
                const remaining = line.substring(cursor.ch);
                if (remaining.trim()) {
                    afterCursor += remaining + '\n';
                }
            } else {
                afterCursor += line + '\n';
            }
        }
        
        // Full context with cursor marker
        const fullContext = beforeCursor + '█CURSOR█' + afterCursor;
        
        // Also get the current line for analysis
        const currentLine = this.cm.getLine(cursor.line);
        const lineBeforeCursor = currentLine.substring(0, cursor.ch);
        const lineAfterCursor = currentLine.substring(cursor.ch);
        
        // Get next few lines for duplicate detection
        let nextLines = '';
        for (let i = cursor.line + 1; i < Math.min(cursor.line + 6, this.cm.lineCount()); i++) {
            const line = this.cm.getLine(i);
            nextLines += line + '\n';
        }
        
        return {
            content: fullContext,
            beforeCursor,
            afterCursor,
            currentLine,
            lineBeforeCursor,
            lineAfterCursor,
            nextLines: nextLines.trim(),
            fileName,
            fileExtension,
            cursorPosition: cursor,
            language: this.getLanguageFromExtension(fileExtension),
            totalLines: this.cm.lineCount()
        };
    }
    
    getLanguageFromExtension(ext) {
        const langMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'react',
            'tsx': 'react',
            'py': 'python',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'md': 'markdown',
            'vue': 'vue',
            'php': 'php',
            'cpp': 'cpp',
            'c': 'c',
            'java': 'java',
            'go': 'go',
            'rs': 'rust'
        };
        return langMap[ext] || 'text';
    }
    
    async generateSuggestion(context, cursor, abortSignal) {
        console.log('🚀 InlineAI: generateSuggestion started');
        
        if (!this.aiManager) {
            throw new Error('AI Manager not available');
        }
        
        // Check if request was already cancelled
        if (abortSignal && abortSignal.aborted) {
            throw new Error('Request aborted');
        }
        
        const prompt = this.buildSuggestionPrompt(context);
        console.log('📝 InlineAI: Built prompt:', prompt);
        
        try {
            // Get current model from chat panel
            const modelSelect = document.getElementById('chat-ai-model');
            const model = modelSelect ? modelSelect.value : 'deepseek/deepseek-r1-0528:free';
            console.log('🤖 InlineAI: Using model:', model);
            
            // Check if API key is available
            const apiKey = localStorage.getItem('openrouter_api_key');
            if (!apiKey) {
                console.warn('⚠️ InlineAI: No API key found in localStorage');
                throw new Error('API key not configured. Please set your OpenRoute API key in the chat panel.');
            }
            
            console.log('🔑 InlineAI: Making request...');
            
            // No quota enforcement - free models use platform key, paid require user key

            // Use the existing AI manager to get suggestion
            const messages = [
                {
                    role: "system",
                    content: `You are an expert code completion assistant. Provide intelligent, contextual code suggestions.

CRITICAL RULES:
1. Complete the code naturally from the cursor position (marked with █CURSOR█)
2. NEVER duplicate existing code that's already present in the file
3. Only suggest what should be added/completed at the cursor position
4. Consider the full file context to avoid repetition
5. If a line is incomplete, complete ONLY that line
6. If a line is complete, suggest the NEXT logical code
7. Keep suggestions concise (1-3 lines typically)
8. Maintain proper indentation and coding style
9. Return ONLY the code to be inserted, nothing else
10. DO NOT repeat code that already exists before or after the cursor

CONTEXT ANALYSIS:
- Look at the code before the cursor to understand what's already written
- Look at the code after the cursor to see what comes next
- Only suggest the missing piece between these sections
- Never duplicate function names, variable declarations, or existing logic`
                },
                {
                    role: "user",
                    content: prompt
                }
            ];
            
            console.log('📤 InlineAI: Sending API request...');
            
            // Check if cancelled before making request
            if (abortSignal && abortSignal.aborted) {
                throw new Error('Request aborted before API call');
            }
            
            const response = await this.aiManager.callOpenRouteAPI(model, messages);
            
            // Check if cancelled after receiving response
            if (abortSignal && abortSignal.aborted) {
                throw new Error('Request aborted after API call');
            }
            
            console.log('📥 InlineAI: Received response:', response);
            
            // Extract the response content
            let suggestion = '';
            if (response && response.choices && response.choices.length > 0) {
                suggestion = response.choices[0].message.content;
                console.log('✅ InlineAI: Extracted suggestion:', suggestion);
            } else {
                console.warn('⚠️ InlineAI: Invalid response format');
                return null;
            }
            
            return this.cleanSuggestion(suggestion);
            
        } catch (error) {
            console.error('❌ InlineAI: API request failed:', error);
            throw error;
        }
    }
    
    buildSuggestionPrompt(context) {
        return `File: ${context.fileName} (${context.language})
Total Lines: ${context.totalLines}

FULL FILE CONTEXT:
\`\`\`${context.language}
${context.content}
\`\`\`

CURSOR POSITION ANALYSIS:
- Current line: "${context.currentLine}"
- Text before cursor: "${context.lineBeforeCursor}"
- Text after cursor: "${context.lineAfterCursor}"
- Next few lines after cursor:
${context.nextLines || 'No lines follow'}

CRITICAL INSTRUCTION: Complete the code at the █CURSOR█ position. 

ANTI-DUPLICATION RULES:
1. NEVER repeat text that appears in "Text after cursor"
2. NEVER repeat any code that already exists in the next few lines
3. If you see closing tags like </div>, </p>, }, ), ;, etc. after the cursor, DO NOT include them in your suggestion
4. If the current line already has content after the cursor, DO NOT duplicate it
5. Only suggest the missing piece that would naturally go at the cursor position

COMPLETION GUIDELINES:
- If the line is incomplete (like "const name = "), complete just that part
- If the line is complete, suggest the next logical statement
- Maintain proper indentation
- Keep suggestions concise (1-3 lines typically)
- Match the existing code style

Provide ONLY the code to insert at the cursor position:`;
    }
    
    cleanSuggestion(rawSuggestion) {
        if (!rawSuggestion) return '';
        
        // Remove code blocks if AI wrapped the response
        let cleaned = rawSuggestion.replace(/```[\w]*\n?/g, '').trim();
        
        // Remove common AI response prefixes
        cleaned = cleaned.replace(/^(Here's the completion:|The completion is:|Complete code:|Completion:|Here's|This completes)/i, '').trim();
        
        // Get current context to check for duplicates
        const cursor = this.cm.getCursor();
        const currentLine = this.cm.getLine(cursor.line);
        const textAfterCursor = currentLine.substring(cursor.ch);
        
        // Get next few lines to check for existing content
        let textAfterCurrentLine = '';
        for (let i = cursor.line + 1; i < Math.min(cursor.line + 10, this.cm.lineCount()); i++) {
            textAfterCurrentLine += this.cm.getLine(i) + '\n';
        }
        const combinedAfterText = textAfterCursor + textAfterCurrentLine;
        
        console.log('🧹 InlineAI: Checking for duplicates', {
            suggestion: cleaned,
            afterCursor: textAfterCursor,
            nextLines: textAfterCurrentLine.substring(0, 100)
        });
        
        // Remove duplicate closing tags, brackets, and characters
        const duplicatesToCheck = [
            // HTML/XML closing tags
            { pattern: /<\/([^>]+)>/g, type: 'closing_tag' },
            // Closing brackets and parentheses
            { pattern: /[}\]\)]/g, type: 'bracket' },
            // Semicolons
            { pattern: /;/g, type: 'semicolon' },
            // Closing quotes
            { pattern: /['"`]/g, type: 'quote' },
            // Commas
            { pattern: /,/g, type: 'comma' }
        ];
        
        // Check each potential duplicate
        duplicatesToCheck.forEach(({ pattern, type }) => {
            const matches = cleaned.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // If this character/tag already exists after cursor, remove it from suggestion
                    if (combinedAfterText.includes(match)) {
                        console.log(`🧹 InlineAI: Removing duplicate ${type}:`, match);
                        // Remove the first occurrence of this duplicate from the end
                        const lastIndex = cleaned.lastIndexOf(match);
                        if (lastIndex !== -1) {
                            cleaned = cleaned.substring(0, lastIndex) + cleaned.substring(lastIndex + match.length);
                        }
                    }
                });
            }
        });
        
        // Special handling for common patterns
        // If there's already content after cursor and suggestion would duplicate it
        if (textAfterCursor.trim() && cleaned.includes(textAfterCursor.trim())) {
            console.log('🧹 InlineAI: Removing text that already exists after cursor');
            cleaned = cleaned.replace(textAfterCursor.trim(), '');
        }
        
        // Remove multiple consecutive empty lines
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        // Remove empty lines and trim
        cleaned = cleaned.trim();
        
        // Limit suggestion length
        if (cleaned.length > this.maxSuggestionLength) {
            cleaned = cleaned.substring(0, this.maxSuggestionLength);
            // Try to end at a complete line
            const lastNewline = cleaned.lastIndexOf('\n');
            if (lastNewline > cleaned.length * 0.7) {
                cleaned = cleaned.substring(0, lastNewline);
            }
        }
        
        return cleaned;
    }
    
    showSuggestion(suggestion, cursor) {
        console.log('💡 InlineAI: Showing suggestion');
        
        // Always clear any existing suggestions first - this is critical!
        this.clearAllSuggestions();
        
        if (!suggestion.trim()) {
            console.log('❌ InlineAI: Empty suggestion, skipping');
            return;
        }
        
        // Store suggestion data
        this.currentSuggestion = {
            text: suggestion,
            startPos: cursor,
            endPos: this.calculateEndPosition(cursor, suggestion)
        };
        
        console.log('💾 InlineAI: Stored suggestion');
        
        // Create the suggestion display
        this.createSuggestionWidget(suggestion, cursor);
    }
    
    createSuggestionWidget(suggestion, cursor) {
        console.log('🎨 InlineAI: Creating inline suggestion');
        console.log('🎨 InlineAI: Suggestion text:', JSON.stringify(suggestion));
        console.log('🎨 InlineAI: Cursor position:', cursor);
        
        // Create main container
        const container = document.createElement('div');
        container.className = 'inline-ai-suggestion-container';
        container.setAttribute('data-suggestion-widget', 'true'); // For cleanup tracking
        
        // Add click handler to accept suggestion
        container.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('�️ InlineAI: Container clicked, accepting');
            this.acceptSuggestion();
        });
        
        // Create content wrapper
        const content = document.createElement('div');
        content.className = 'inline-ai-suggestion-content';
        
        // Handle single vs multi-line suggestions
        const lines = suggestion.split('\n').filter(line => line.trim() !== ''); // Remove empty lines
        console.log('🎨 InlineAI: Processing lines:', lines);
        
        // If no meaningful content after filtering, show raw suggestion
        if (lines.length === 0) {
            console.log('🎨 InlineAI: No lines after filtering, using raw suggestion');
            content.textContent = suggestion || '(empty suggestion)';
            container.classList.add('single-line');
            container.appendChild(content);
        } else if (lines.length === 1 && suggestion.length <= 60) {
            // Single line suggestion - inline style
            content.textContent = suggestion;
            container.classList.add('single-line');
            container.appendChild(content);
        } else {
            // Multi-line suggestion - block style
            container.classList.add('multi-line');
            
            // Add each line
            lines.forEach(line => {
                const lineElement = document.createElement('div');
                lineElement.className = 'suggestion-line';
                lineElement.textContent = line;
                content.appendChild(lineElement);
            });
            
            // Add instructions
            const instructions = document.createElement('div');
            instructions.className = 'suggestion-instructions';
            instructions.innerHTML = `
                <span><kbd>Tab</kbd> Accept</span>
                <span><kbd>Esc</kbd> Dismiss</span>
                <span>Click to accept</span>
            `;
            
            container.appendChild(content);
            container.appendChild(instructions);
        }
        
        console.log('🎨 InlineAI: Container created with content');
        console.log('🎨 InlineAI: Container classes:', container.className);
        console.log('🎨 InlineAI: Container text content:', container.textContent);
        
        // Professional styling applied via CSS classes
        
        // Create the widget and track it - MANUAL POSITIONING APPROACH
        console.log('🎨 InlineAI: About to manually position widget');
        try {
            // Get the CodeMirror wrapper to append to
            const cmWrapper = this.cm.getWrapperElement();
            console.log('🎨 InlineAI: CM Wrapper:', cmWrapper);
            
            // Get cursor coordinates
            const coords = this.cm.cursorCoords(cursor, 'page');
            console.log('🎨 InlineAI: Cursor coords:', coords);
            
            // Append to body first to get accurate measurements
            document.body.appendChild(container);
            
            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            // Get container dimensions
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            
            // Calculate initial position
            let left = coords.left;
            let top = coords.bottom;
            
            // Check horizontal overflow and adjust
            if (left + containerWidth > viewportWidth + scrollX) {
                // Would overflow right edge, position to the left of cursor
                left = Math.max(scrollX + 10, coords.left - containerWidth - 10);
                
                // If still overflows, position it to fit within viewport
                if (left + containerWidth > viewportWidth + scrollX) {
                    left = viewportWidth + scrollX - containerWidth - 10;
                }
            }
            
            // Ensure minimum left margin and maximum right boundary
            left = Math.max(scrollX + 10, left);
            left = Math.min(left, viewportWidth + scrollX - containerWidth - 10);
            
            // Check vertical overflow and adjust
            if (top + containerHeight > viewportHeight + scrollY) {
                // Would overflow bottom edge, position above cursor
                top = coords.top - containerHeight - 10;
                
                // If still overflows at top, position at top of viewport with some margin
                if (top < scrollY + 10) {
                    top = scrollY + 10;
                }
            }
            
            // Ensure minimum top margin
            top = Math.max(scrollY + 10, top);
            
            // Apply final position
            container.style.position = 'absolute';
            container.style.left = left + 'px';
            container.style.top = top + 'px';
            container.style.zIndex = '999999';
            
            console.log('🎨 InlineAI: Widget positioned with viewport bounds check:', {
                original: { left: coords.left, top: coords.bottom },
                adjusted: { left, top },
                viewport: { width: viewportWidth, height: viewportHeight },
                container: { width: containerWidth, height: containerHeight }
            });
            
            console.log('🎨 InlineAI: Widget manually positioned and added to body');
            
            // Track it differently for manual cleanup
            this.activeWidgets.add({ 
                clear: () => {
                    if (container.parentNode) {
                        container.parentNode.removeChild(container);
                    }
                },
                node: container
            });
            
            // Immediate check
            const widgetInDOM = document.querySelector('[data-suggestion-widget="true"]');
            console.log('🎨 InlineAI: Widget immediately in DOM:', !!widgetInDOM);
            
            if (widgetInDOM) {
                const rect = widgetInDOM.getBoundingClientRect();
                console.log('🎨 InlineAI: Widget rect:', rect);
                console.log('🎨 InlineAI: Widget visible:', rect.width > 0 && rect.height > 0);
                console.log('🎨 InlineAI: Widget computed display:', window.getComputedStyle(widgetInDOM).display);
            }
            
        } catch (error) {
            console.error('❌ InlineAI: Error creating widget:', error);
        }
        
        console.log('✅ InlineAI: Suggestion widget created and tracked');
    }
    
    addSuggestionStyles() {
        if (document.getElementById('inline-ai-suggestion-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'inline-ai-suggestion-styles';
        style.textContent = `
            /* Main suggestion container */
            .inline-ai-suggestion-container {
                position: relative;
                max-width: 500px;
                min-width: 200px;
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
                cursor: pointer;
                z-index: 999999 !important;
                user-select: none;
                filter: drop-shadow(0 0 10px rgba(74, 144, 226, 0.3));
                transition: all 0.3s ease-out;
                isolation: isolate;
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            /* Single line suggestions - CONSISTENT STYLING */
            .inline-ai-suggestion-container.single-line {
                display: inline-block !important;
                background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%) !important;
                color: #ffffff !important;
                border: 2px solid #357abd !important;
                border-radius: 6px;
                padding: 6px 12px;
                margin: 0 6px;
                opacity: 1 !important;
                font-style: normal;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
                letter-spacing: 0.5px;
                position: relative;
                z-index: 999999 !important;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 400px;
                visibility: visible !important;
            }
            
            .inline-ai-suggestion-container.single-line:hover {
                background: linear-gradient(135deg, #357abd 0%, #2968a3 100%) !important;
                border-color: #2968a3 !important;
                box-shadow: 0 6px 16px rgba(74, 144, 226, 0.6);
                transform: translateY(-2px);
                opacity: 1 !important;
            }
            
            /* Multi-line suggestions - CONSISTENT STYLING */
            .inline-ai-suggestion-container.multi-line {
                display: block !important;
                background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%) !important;
                color: #ffffff !important;
                border: 2px solid #357abd !important;
                border-radius: 6px;
                padding: 12px 16px;
                margin: 8px 0;
                box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
                opacity: 1 !important;
                font-weight: 600;
                transition: all 0.3s ease;
                position: relative;
                z-index: 999999 !important;
                visibility: visible !important;
            }
            
            .inline-ai-suggestion-container.multi-line:hover {
                background: linear-gradient(135deg, #357abd 0%, #2968a3 100%) !important;
                border-color: #2968a3 !important;
                box-shadow: 0 6px 16px rgba(74, 144, 226, 0.6);
                transform: translateY(-2px);
                opacity: 1 !important;
            }
            
            /* Suggestion content */
            .inline-ai-suggestion-content {
                color: #ffffff !important;
                opacity: 1 !important;
                font-style: normal;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                letter-spacing: 0.3px;
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
                visibility: visible !important;
            }
            
            /* Multi-line content styling */
            .inline-ai-suggestion-container.multi-line .suggestion-line {
                margin: 2px 0;
                white-space: pre-wrap; /* Changed from 'pre' to 'pre-wrap' for word wrapping */
                font-family: inherit;
                word-wrap: break-word;
                overflow-wrap: break-word;
                max-width: 100%;
            }
            
            .inline-ai-suggestion-container.multi-line .suggestion-line:first-child {
                margin-top: 0;
            }
            
            .inline-ai-suggestion-container.multi-line .suggestion-line:last-child {
                margin-bottom: 8px;
            }
            
            /* Instructions bar - SIMPLIFIED */
            .suggestion-instructions {
                font-size: 11px;
                color: #ffffff !important;
                opacity: 1 !important;
                font-style: normal;
                font-weight: 500;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                display: flex;
                gap: 12px;
                align-items: center;
                letter-spacing: 0.3px;
            }
            
            .suggestion-instructions kbd {
                background: rgba(255, 255, 255, 0.2) !important;
                color: #ffffff !important;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-family: inherit;
                border: 1px solid rgba(255, 255, 255, 0.3);
                font-weight: 600;
                letter-spacing: 0.3px;
            }
            
            /* Loading indicator */
            .inline-ai-loading {
                display: inline-block !important;
                background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%) !important;
                color: #ffffff !important;
                border: 2px solid #357abd !important;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: 600;
                letter-spacing: 0.5px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
                animation: loading-pulse 1.5s ease-in-out infinite;
                z-index: 999999 !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            /* Error message */
            .inline-ai-error {
                opacity: 0.9;
                color: #ff6b6b;
                font-size: 12px;
                font-weight: 500;
                background: rgba(255, 107, 107, 0.1);
                padding: 4px 8px;
                border-radius: 4px;
                border-left: 3px solid #ff6b6b;
            }
            
            @keyframes loading-pulse {
                0%, 100% { 
                    opacity: 1 !important; 
                    transform: scale(1);
                }
                50% { 
                    opacity: 1 !important; 
                    transform: scale(1.05);
                    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.6);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    clearAllSuggestions() {
        console.log('🧹 InlineAI: Clearing all suggestions');
        
        // Clear all tracked widgets (both CodeMirror and manual)
        this.activeWidgets.forEach(widget => {
            try {
                if (widget && typeof widget.clear === 'function') {
                    widget.clear();
                }
            } catch (e) {
                console.warn('Warning: Could not clear widget:', e);
            }
        });
        this.activeWidgets.clear();
        
        // Also remove any lingering DOM elements (including manually positioned ones)
        const existingWidgets = document.querySelectorAll('[data-suggestion-widget="true"]');
        console.log('🧹 InlineAI: Found widgets to remove:', existingWidgets.length);
        existingWidgets.forEach(element => {
            try {
                console.log('🧹 InlineAI: Removing widget:', element);
                element.remove();
            } catch (e) {
                console.warn('Warning: Could not remove DOM element:', e);
            }
        });
        
        // Clear suggestion state
        this.currentSuggestion = null;
        this.lastTriggerPos = null;
        
        console.log('✅ InlineAI: All suggestions cleared');
    }
    
    clearSuggestion() {
        // Alias for clearAllSuggestions for backward compatibility
        this.clearAllSuggestions();
    }

    showLoadingIndicator() {
        const cursor = this.cm.getCursor();
        const span = document.createElement('span');
        span.className = 'inline-ai-loading';
        span.innerHTML = '✨ Generating...';
        span.setAttribute('data-suggestion-widget', 'true');
        
        // Append to body first to get accurate measurements
        document.body.appendChild(span);
        
        // Manual positioning with viewport bounds checking
        const coords = this.cm.cursorCoords(cursor, 'page');
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        // Get span dimensions
        const spanRect = span.getBoundingClientRect();
        const spanWidth = spanRect.width;
        const spanHeight = spanRect.height;
        
        // Calculate position with viewport bounds
        let left = coords.left;
        let top = coords.bottom;
        
        // Check horizontal overflow
        if (left + spanWidth > viewportWidth + scrollX) {
            left = Math.max(scrollX + 10, coords.left - spanWidth - 10);
        }
        left = Math.max(scrollX + 10, left);
        
        // Check vertical overflow
        if (top + spanHeight > viewportHeight + scrollY) {
            top = coords.top - spanHeight - 10;
            if (top < scrollY + 10) {
                top = scrollY + 10;
            }
        }
        top = Math.max(scrollY + 10, top);
        
        span.style.position = 'absolute';
        span.style.left = left + 'px';
        span.style.top = top + 'px';
        span.style.zIndex = '999999';
        
        this.activeWidgets.add({
            clear: () => {
                if (span.parentNode) {
                    span.parentNode.removeChild(span);
                }
            },
            node: span
        });
    }
    
    hideLoadingIndicator() {
        // Loading indicator will be cleared by clearAllSuggestions
    }
    
    showErrorMessage(message) {
        const cursor = this.cm.getCursor();
        const span = document.createElement('span');
        span.className = 'inline-ai-error';
        span.innerHTML = `⚠️ ${message}`;
        span.setAttribute('data-suggestion-widget', 'true');
        
        const errorWidget = this.cm.addWidget(cursor, span, false);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            try {
                if (errorWidget) {
                    errorWidget.clear();
                }
            } catch (e) {
                console.warn('Could not clear error widget:', e);
            }
        }, 3000);
    }
    
    calculateEndPosition(startPos, text) {
        const lines = text.split('\n');
        if (lines.length === 1) {
            return {
                line: startPos.line,
                ch: startPos.ch + text.length
            };
        } else {
            return {
                line: startPos.line + lines.length - 1,
                ch: lines[lines.length - 1].length
            };
        }
    }
    
    getSuggestionEndPos() {
        return this.currentSuggestion ? this.currentSuggestion.endPos : null;
    }
    
    acceptSuggestion() {
        console.log('✅ InlineAI: acceptSuggestion called');
        
        if (!this.currentSuggestion) {
            console.log('❌ InlineAI: No current suggestion to accept');
            return;
        }
        
        const { text, startPos } = this.currentSuggestion;
        console.log('📝 InlineAI: Inserting text:', { text: text.substring(0, 50) + '...', startPos });
        
        // Insert the suggestion text
        this.cm.replaceRange(text, startPos, startPos);
        
        // Move cursor to end of inserted text
        const endPos = this.calculateEndPosition(startPos, text);
        this.cm.setCursor(endPos);
        
        console.log('📍 InlineAI: Moved cursor to:', endPos);
        
        // Clear the suggestion
        this.clearAllSuggestions();
        
        // Focus back to editor
        this.cm.focus();
        
        console.log('✅ InlineAI: Suggestion accepted successfully');
    }
    
    enable() {
        this.enabled = true;
        console.log('✨ Inline AI Suggestions enabled');
    }
    
    disable() {
        this.enabled = false;
        this.clearAllSuggestions();
        console.log('🚫 Inline AI Suggestions disabled');
    }
    
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    }
    
    // Force reset the generating state (for debugging)
    forceReset() {
        console.log('🔄 InlineAI: Force resetting state');
        this.cancelCurrentRequest();
    }
    
    getStatus() {
        return {
            enabled: this.enabled,
            isGenerating: this.isGenerating,
            hasSuggestion: !!this.currentSuggestion,
            activeWidgets: this.activeWidgets.size,
            hasAbortController: !!this.currentAbortController,
            debounceDelay: this.debounceDelay,
            requestTimeout: this.requestTimeout,
            requestAge: this.requestStartTime ? Date.now() - this.requestStartTime : null
        };
    }
    
    // Configuration methods
    setDebounceDelay(delay) {
        this.debounceDelay = Math.max(100, delay);
    }
    
    setMinTriggerLength(length) {
        this.minTriggerLength = Math.max(1, length);
    }
    
    cancelCurrentRequest() {
        console.log('🚫 InlineAI: Cancelling current request');
        
        // Cancel any ongoing API request
        if (this.currentAbortController) {
            console.log('🚫 InlineAI: Aborting API request');
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
        
        // Clear generating state
        this.isGenerating = false;
        this.requestStartTime = null;
        
        // Clear any pending timers
        clearTimeout(this.debounceTimer);
        
        // Clear all loading indicators
        this.clearAllSuggestions();
        
        console.log('✅ InlineAI: Request cancellation complete');
    }
    
    destroy() {
        // Clean up event listeners
        if (this.cm) {
            this.cm.off('change', this.handleTextChange);
            this.cm.off('keydown', this.handleKeyDown);
            this.cm.off('keyup', this.handleKeyUp);
            this.cm.off('cursorActivity', this.handleCursorActivity);
        }
        
        // Cancel any pending requests
        this.cancelCurrentRequest();
        
        console.log('🧹 InlineAIManager destroyed');
    }
}
