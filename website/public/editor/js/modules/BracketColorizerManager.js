/**
 * BracketColorizerManager.js
 * Provides rainbow bracket colorization for nested brackets
 * Colors brackets at different nesting levels for better code readability
 */

class BracketColorizerManager {
    constructor(editor, codeMirror) {
        this.editor = editor;
        this.codeMirror = codeMirror;
        this.enabled = true;
        this.overlayMode = null;
        
        // Bracket pairs to colorize
        this.bracketPairs = {
            '(': ')',
            '[': ']',
            '{': '}'
        };
        
        // Color levels (5 colors rotating)
        this.colorLevels = 5;
        
        this.initialize();
    }

    /**
     * Initialize bracket colorization
     */
    initialize() {
        // Enable CodeMirror's built-in bracket matching for hover effect
        this.codeMirror.setOption('matchBrackets', true);
        this.codeMirror.setOption('autoCloseBrackets', true);
        
        // Create and add the overlay mode
        this.createOverlayMode();
        this.enable();
        
        console.log('BracketColorizerManager initialized');
    }

    /**
     * Create CodeMirror overlay mode for bracket colorization
     */
    createOverlayMode() {
        const bracketPairs = this.bracketPairs;
        const colorLevels = this.colorLevels;
        
        this.overlayMode = {
            token: function(stream, state) {
                // Initialize state if needed
                if (!state.bracketStack) {
                    state.bracketStack = [];
                }
                
                const char = stream.peek();
                
                // Check if current character is an opening bracket
                if (char && bracketPairs[char]) {
                    stream.next();
                    const level = state.bracketStack.length % colorLevels;
                    state.bracketStack.push(char);
                    return `bracket bracket-level-${level} bracket-open`;
                }
                
                // Check if current character is a closing bracket
                const closingBrackets = Object.values(bracketPairs);
                if (char && closingBrackets.includes(char)) {
                    stream.next();
                    
                    // Pop from stack if there's a matching opening bracket
                    if (state.bracketStack.length > 0) {
                        const lastOpen = state.bracketStack[state.bracketStack.length - 1];
                        if (bracketPairs[lastOpen] === char) {
                            state.bracketStack.pop();
                        }
                    }
                    
                    const level = state.bracketStack.length % colorLevels;
                    return `bracket bracket-level-${level} bracket-close`;
                }
                
                // Not a bracket, skip this character
                stream.next();
                return null;
            },
            
            startState: function() {
                return {
                    bracketStack: []
                };
            }
        };
    }

    /**
     * Enable bracket colorization
     */
    enable() {
        if (!this.enabled && this.overlayMode) {
            this.codeMirror.addOverlay(this.overlayMode);
            this.enabled = true;
            console.log('Bracket colorization enabled');
        }
    }

    /**
     * Disable bracket colorization
     */
    disable() {
        if (this.enabled && this.overlayMode) {
            this.codeMirror.removeOverlay(this.overlayMode);
            this.enabled = false;
            console.log('Bracket colorization disabled');
        }
    }

    /**
     * Toggle bracket colorization on/off
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
     * Check if bracket colorization is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Refresh bracket colorization (useful after mode changes)
     */
    refresh() {
        if (this.enabled) {
            this.disable();
            this.enable();
        }
    }

    /**
     * Get bracket nesting level at cursor position
     */
    getBracketLevelAtCursor() {
        const cursor = this.codeMirror.getCursor();
        const token = this.codeMirror.getTokenAt(cursor);
        
        if (token.type && token.type.includes('bracket-level-')) {
            const match = token.type.match(/bracket-level-(\d+)/);
            if (match) {
                return parseInt(match[1]);
            }
        }
        
        return null;
    }

    /**
     * Highlight matching bracket pair on demand
     */
    highlightMatchingBracket() {
        const cursor = this.codeMirror.getCursor();
        const token = this.codeMirror.getTokenAt(cursor);
        
        // Use CodeMirror's built-in bracket matching
        if (token.string && (this.bracketPairs[token.string] || Object.values(this.bracketPairs).includes(token.string))) {
            // CodeMirror's matchBrackets addon handles this automatically
            // The styling is done via CSS
            return true;
        }
        
        return false;
    }

    /**
     * Get statistics about bracket usage
     */
    getBracketStats() {
        const content = this.codeMirror.getValue();
        const stats = {
            parentheses: { open: 0, close: 0 },
            brackets: { open: 0, close: 0 },
            braces: { open: 0, close: 0 },
            maxNesting: 0
        };
        
        let stack = [];
        let maxDepth = 0;
        
        for (let char of content) {
            switch (char) {
                case '(':
                    stats.parentheses.open++;
                    stack.push(char);
                    break;
                case ')':
                    stats.parentheses.close++;
                    if (stack.length > 0 && stack[stack.length - 1] === '(') {
                        stack.pop();
                    }
                    break;
                case '[':
                    stats.brackets.open++;
                    stack.push(char);
                    break;
                case ']':
                    stats.brackets.close++;
                    if (stack.length > 0 && stack[stack.length - 1] === '[') {
                        stack.pop();
                    }
                    break;
                case '{':
                    stats.braces.open++;
                    stack.push(char);
                    break;
                case '}':
                    stats.braces.close++;
                    if (stack.length > 0 && stack[stack.length - 1] === '{') {
                        stack.pop();
                    }
                    break;
            }
            
            maxDepth = Math.max(maxDepth, stack.length);
        }
        
        stats.maxNesting = maxDepth;
        stats.balanced = 
            stats.parentheses.open === stats.parentheses.close &&
            stats.brackets.open === stats.brackets.close &&
            stats.braces.open === stats.braces.close;
        
        return stats;
    }

    /**
     * Find unmatched brackets in the code
     */
    findUnmatchedBrackets() {
        const content = this.codeMirror.getValue();
        const lines = content.split('\n');
        const unmatched = [];
        
        let stack = [];
        
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            
            for (let ch = 0; ch < line.length; ch++) {
                const char = line[ch];
                
                if (this.bracketPairs[char]) {
                    stack.push({ char, line: lineNum, ch });
                } else if (Object.values(this.bracketPairs).includes(char)) {
                    if (stack.length === 0) {
                        // Closing bracket without opening
                        unmatched.push({
                            type: 'extra_close',
                            char,
                            line: lineNum,
                            ch
                        });
                    } else {
                        const last = stack[stack.length - 1];
                        if (this.bracketPairs[last.char] === char) {
                            stack.pop();
                        } else {
                            // Mismatched bracket
                            unmatched.push({
                                type: 'mismatch',
                                char,
                                expected: this.bracketPairs[last.char],
                                line: lineNum,
                                ch
                            });
                        }
                    }
                }
            }
        }
        
        // Remaining items in stack are unclosed brackets
        for (let item of stack) {
            unmatched.push({
                type: 'unclosed',
                char: item.char,
                line: item.line,
                ch: item.ch
            });
        }
        
        return unmatched;
    }

    /**
     * Destroy the manager and clean up
     */
    destroy() {
        this.disable();
        console.log('BracketColorizerManager destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BracketColorizerManager;
}
