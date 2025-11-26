/**
 * DiffManager - Smart diff/patch application for AI file edits
 * 
 * Features:
 * - Line-by-line diff generation
 * - Visual diff display with syntax highlighting
 * - Smart patch application with conflict detection
 * - Merge support for concurrent edits
 * - Undo/redo support via change tracking
 * 
 * Uses a simple LCS-based diff algorithm for efficiency
 */
export class DiffManager {
    constructor() {
        console.log('📊 DiffManager: Initialized');
        
        // Change history for undo support
        this.changeHistory = [];
        this.maxHistory = 50;
    }
    
    /**
     * Generate a diff between two texts
     * @param {string} oldText - Original text
     * @param {string} newText - New text
     * @returns {Object} { hunks: Array, stats: Object }
     */
    generateDiff(oldText, newText) {
        const oldLines = oldText.split('\n');
        const newLines = newText.split('\n');
        
        // Find LCS (Longest Common Subsequence) to identify changes
        const lcs = this.findLCS(oldLines, newLines);
        
        // Generate hunks from LCS
        const hunks = this.generateHunks(oldLines, newLines, lcs);
        
        // Calculate stats
        const stats = this.calculateStats(hunks);
        
        return { hunks, stats };
    }
    
    /**
     * Find Longest Common Subsequence between two arrays
     * @param {Array} a - First array
     * @param {Array} b - Second array
     * @returns {Array} LCS indices
     */
    findLCS(a, b) {
        const m = a.length;
        const n = b.length;
        
        // Build LCS table
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        
        // Backtrack to find LCS
        const lcs = [];
        let i = m, j = n;
        
        while (i > 0 && j > 0) {
            if (a[i - 1] === b[j - 1]) {
                lcs.unshift({ oldIndex: i - 1, newIndex: j - 1, line: a[i - 1] });
                i--;
                j--;
            } else if (dp[i - 1][j] > dp[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }
        
        return lcs;
    }
    
    /**
     * Generate diff hunks from LCS
     * @param {Array} oldLines - Original lines
     * @param {Array} newLines - New lines
     * @param {Array} lcs - LCS result
     * @returns {Array} Diff hunks
     */
    generateHunks(oldLines, newLines, lcs) {
        const hunks = [];
        let oldIndex = 0;
        let newIndex = 0;
        let lcsIndex = 0;
        
        while (oldIndex < oldLines.length || newIndex < newLines.length) {
            const lcsItem = lcs[lcsIndex];
            
            // Check if we've reached an LCS match
            if (lcsItem && oldIndex === lcsItem.oldIndex && newIndex === lcsItem.newIndex) {
                // Context line (unchanged)
                hunks.push({
                    type: 'context',
                    oldLine: oldIndex + 1,
                    newLine: newIndex + 1,
                    content: oldLines[oldIndex]
                });
                oldIndex++;
                newIndex++;
                lcsIndex++;
            } else {
                // Changes detected
                const nextLcs = lcs[lcsIndex];
                const deletions = [];
                const additions = [];
                
                // Collect deletions
                while (oldIndex < oldLines.length && (!nextLcs || oldIndex < nextLcs.oldIndex)) {
                    deletions.push({
                        type: 'deletion',
                        oldLine: oldIndex + 1,
                        content: oldLines[oldIndex]
                    });
                    oldIndex++;
                }
                
                // Collect additions
                while (newIndex < newLines.length && (!nextLcs || newIndex < nextLcs.newIndex)) {
                    additions.push({
                        type: 'addition',
                        newLine: newIndex + 1,
                        content: newLines[newIndex]
                    });
                    newIndex++;
                }
                
                // Add hunks
                hunks.push(...deletions, ...additions);
            }
        }
        
        return hunks;
    }
    
    /**
     * Calculate diff statistics
     * @param {Array} hunks - Diff hunks
     * @returns {Object} Statistics
     */
    calculateStats(hunks) {
        let additions = 0;
        let deletions = 0;
        let unchanged = 0;
        
        for (const hunk of hunks) {
            switch (hunk.type) {
                case 'addition':
                    additions++;
                    break;
                case 'deletion':
                    deletions++;
                    break;
                case 'context':
                    unchanged++;
                    break;
            }
        }
        
        return {
            additions,
            deletions,
            unchanged,
            total: additions + deletions + unchanged,
            changePercentage: Math.round(((additions + deletions) / (additions + deletions + unchanged)) * 100) || 0
        };
    }
    
    /**
     * Generate HTML for diff display
     * @param {Object} diff - Diff result from generateDiff
     * @param {Object} options - Display options
     * @returns {string} HTML string
     */
    generateDiffHTML(diff, options = {}) {
        const {
            showLineNumbers = true,
            contextLines = 3,
            collapseUnchanged = true,
            maxLines = 100
        } = options;
        
        let html = '<div class="diff-container">';
        
        // Stats header
        html += `
            <div class="diff-stats">
                <span class="diff-stat additions">+${diff.stats.additions}</span>
                <span class="diff-stat deletions">-${diff.stats.deletions}</span>
                <span class="diff-stat unchanged">${diff.stats.unchanged} unchanged</span>
            </div>
        `;
        
        // Hunks
        const displayHunks = this.collapseContext(diff.hunks, contextLines, collapseUnchanged);
        let lineCount = 0;
        
        html += '<div class="diff-lines">';
        
        for (const hunk of displayHunks) {
            if (lineCount >= maxLines) {
                html += `<div class="diff-truncated">... ${diff.hunks.length - lineCount} more lines</div>`;
                break;
            }
            
            if (hunk.type === 'collapse') {
                html += `
                    <div class="diff-line diff-collapse">
                        <span class="line-number">...</span>
                        <span class="line-content">${hunk.count} unchanged lines</span>
                    </div>
                `;
            } else {
                const lineClass = `diff-line diff-${hunk.type}`;
                const prefix = hunk.type === 'addition' ? '+' : hunk.type === 'deletion' ? '-' : ' ';
                const lineNum = hunk.type === 'deletion' ? hunk.oldLine : hunk.newLine || hunk.oldLine;
                
                html += `
                    <div class="${lineClass}">
                        ${showLineNumbers ? `<span class="line-number">${lineNum || ''}</span>` : ''}
                        <span class="line-prefix">${prefix}</span>
                        <span class="line-content">${this.escapeHtml(hunk.content)}</span>
                    </div>
                `;
            }
            
            lineCount++;
        }
        
        html += '</div></div>';
        
        return html;
    }
    
    /**
     * Collapse consecutive context lines for cleaner display
     * @param {Array} hunks - All hunks
     * @param {number} contextLines - Lines to show around changes
     * @param {boolean} collapse - Whether to collapse
     * @returns {Array} Collapsed hunks
     */
    collapseContext(hunks, contextLines, collapse) {
        if (!collapse) return hunks;
        
        const result = [];
        let contextCount = 0;
        
        for (let i = 0; i < hunks.length; i++) {
            const hunk = hunks[i];
            const prevIsChange = i > 0 && hunks[i - 1].type !== 'context';
            const nextIsChange = i < hunks.length - 1 && hunks[i + 1].type !== 'context';
            
            if (hunk.type === 'context') {
                // Near a change - show context
                if (prevIsChange || nextIsChange) {
                    // Flush any collapsed section
                    if (contextCount > contextLines * 2) {
                        result.push({ type: 'collapse', count: contextCount - contextLines });
                    }
                    contextCount = 0;
                    result.push(hunk);
                } else {
                    contextCount++;
                }
            } else {
                // Flush collapsed context before change
                if (contextCount > contextLines) {
                    result.push({ type: 'collapse', count: contextCount - contextLines });
                }
                contextCount = 0;
                result.push(hunk);
            }
        }
        
        // Flush remaining context
        if (contextCount > contextLines) {
            result.push({ type: 'collapse', count: contextCount });
        }
        
        return result;
    }
    
    /**
     * Apply a patch to text with conflict detection
     * @param {string} originalText - Original text
     * @param {string} patchText - New text to apply
     * @param {string} currentText - Current text (may have user edits)
     * @returns {Object} { success: boolean, result: string, conflicts: Array }
     */
    applyPatch(originalText, patchText, currentText) {
        // If current matches original, apply patch directly
        if (currentText === originalText) {
            return {
                success: true,
                result: patchText,
                conflicts: []
            };
        }
        
        // Check if current already matches patch (already applied)
        if (currentText === patchText) {
            return {
                success: true,
                result: patchText,
                conflicts: [],
                alreadyApplied: true
            };
        }
        
        // Attempt three-way merge
        return this.threeWayMerge(originalText, patchText, currentText);
    }
    
    /**
     * Perform three-way merge
     * @param {string} base - Common ancestor
     * @param {string} theirs - AI's changes
     * @param {string} ours - User's changes
     * @returns {Object} Merge result
     */
    threeWayMerge(base, theirs, ours) {
        const baseLines = base.split('\n');
        
        // Find what changed in each version
        const theirDiff = this.generateDiff(base, theirs);
        const ourDiff = this.generateDiff(base, ours);
        
        const conflicts = [];
        const resultLines = [];
        
        // Build index of changes
        const theirChanges = new Map();
        const ourChanges = new Map();
        
        for (const hunk of theirDiff.hunks) {
            if (hunk.type !== 'context' && hunk.oldLine) {
                theirChanges.set(hunk.oldLine, hunk);
            }
        }
        
        for (const hunk of ourDiff.hunks) {
            if (hunk.type !== 'context' && hunk.oldLine) {
                ourChanges.set(hunk.oldLine, hunk);
            }
        }
        
        // Merge line by line
        for (let i = 0; i < baseLines.length; i++) {
            const lineNum = i + 1;
            const theirChange = theirChanges.get(lineNum);
            const ourChange = ourChanges.get(lineNum);
            
            if (theirChange && ourChange) {
                // Both changed same line - conflict
                conflicts.push({
                    line: lineNum,
                    base: baseLines[i],
                    theirs: theirChange.content,
                    ours: ourChange.content
                });
                
                // Use AI's version but mark conflict
                resultLines.push(`<<<<<<< AI Change`);
                resultLines.push(theirChange.type === 'deletion' ? '' : theirChange.content);
                resultLines.push(`=======`);
                resultLines.push(ourChange.type === 'deletion' ? '' : ourChange.content);
                resultLines.push(`>>>>>>> Your Change`);
            } else if (theirChange) {
                // Only AI changed this line
                if (theirChange.type !== 'deletion') {
                    resultLines.push(theirChange.content);
                }
            } else if (ourChange) {
                // Only user changed this line
                if (ourChange.type !== 'deletion') {
                    resultLines.push(ourChange.content);
                }
            } else {
                // No changes - keep original
                resultLines.push(baseLines[i]);
            }
        }
        
        // Handle additions at end
        // (simplified - a full implementation would track additions more carefully)
        
        return {
            success: conflicts.length === 0,
            result: resultLines.join('\n'),
            conflicts
        };
    }
    
    /**
     * Check if file has been modified since a known state
     * @param {string} originalContent - Known original content
     * @param {string} currentContent - Current content
     * @returns {boolean} True if modified
     */
    hasLocalChanges(originalContent, currentContent) {
        return originalContent !== currentContent;
    }
    
    /**
     * Record a change for undo support
     * @param {string} filename - File that was changed
     * @param {string} oldContent - Content before change
     * @param {string} newContent - Content after change
     * @param {string} source - Change source ('ai' or 'user')
     */
    recordChange(filename, oldContent, newContent, source = 'ai') {
        this.changeHistory.push({
            filename,
            oldContent,
            newContent,
            source,
            timestamp: Date.now()
        });
        
        // Trim history if too long
        if (this.changeHistory.length > this.maxHistory) {
            this.changeHistory.shift();
        }
    }
    
    /**
     * Get last change for a file (for undo)
     * @param {string} filename - File to get change for
     * @returns {Object|null} Last change or null
     */
    getLastChange(filename) {
        for (let i = this.changeHistory.length - 1; i >= 0; i--) {
            if (this.changeHistory[i].filename === filename) {
                return this.changeHistory[i];
            }
        }
        return null;
    }
    
    /**
     * Undo last AI change for a file
     * @param {string} filename - File to undo
     * @returns {Object|null} Previous content or null
     */
    undoLastChange(filename) {
        const change = this.getLastChange(filename);
        if (change && change.source === 'ai') {
            // Remove from history
            const index = this.changeHistory.indexOf(change);
            if (index > -1) {
                this.changeHistory.splice(index, 1);
            }
            return { content: change.oldContent, change };
        }
        return null;
    }
    
    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Get CSS styles for diff display
     * @returns {string} CSS styles
     */
    static getStyles() {
        return `
            .diff-container {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 12px;
                border: 1px solid var(--border-color, #333);
                border-radius: 4px;
                overflow: hidden;
                background: var(--bg-secondary, #1e1e1e);
            }
            
            .diff-stats {
                padding: 8px 12px;
                background: var(--bg-tertiary, #252525);
                border-bottom: 1px solid var(--border-color, #333);
                display: flex;
                gap: 12px;
            }
            
            .diff-stat {
                font-size: 11px;
            }
            
            .diff-stat.additions {
                color: #4ade80;
            }
            
            .diff-stat.deletions {
                color: #f87171;
            }
            
            .diff-stat.unchanged {
                color: var(--text-muted, #888);
            }
            
            .diff-lines {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .diff-line {
                display: flex;
                padding: 2px 8px;
                min-height: 20px;
                line-height: 20px;
            }
            
            .diff-line.diff-addition {
                background: rgba(74, 222, 128, 0.15);
            }
            
            .diff-line.diff-deletion {
                background: rgba(248, 113, 113, 0.15);
            }
            
            .diff-line.diff-collapse {
                background: var(--bg-tertiary, #252525);
                color: var(--text-muted, #888);
                font-style: italic;
            }
            
            .line-number {
                min-width: 40px;
                color: var(--text-muted, #666);
                text-align: right;
                padding-right: 8px;
                user-select: none;
            }
            
            .line-prefix {
                min-width: 16px;
                font-weight: bold;
            }
            
            .diff-addition .line-prefix {
                color: #4ade80;
            }
            
            .diff-deletion .line-prefix {
                color: #f87171;
            }
            
            .line-content {
                flex: 1;
                white-space: pre;
                overflow-x: auto;
            }
            
            .diff-truncated {
                padding: 8px 12px;
                text-align: center;
                color: var(--text-muted, #888);
                font-style: italic;
                background: var(--bg-tertiary, #252525);
            }
        `;
    }
}
