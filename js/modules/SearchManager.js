/**
 * SearchManager - Handles all find/replace functionality
 */
export class SearchManager {
    constructor(editor, codeMirror) {
        this.editor = editor;
        this.codeMirror = codeMirror;
        this.currentMatchIndex = 0;
        this.allMatches = [];
        this.searchState = null;
    }    /**
     * Show advanced find dialog (now shows both find and replace)
     */
    showAdvancedFind() {
        this.createSearchDialog('both');
    }

    /**
     * Show advanced replace dialog (same as find now)
     */
    showAdvancedReplace() {
        this.createSearchDialog('both');
    }

    /**
     * Show global search dialog
     */
    showGlobalSearch() {
        this.createGlobalSearchDialog('find');
    }

    /**
     * Show global replace dialog
     */
    showGlobalReplace() {
        this.createGlobalSearchDialog('replace');
    }    /**
     * Create search dialog with find and replace
     */
    createSearchDialog(mode) {
        const selection = this.codeMirror.getSelection();
        
        const dialogHTML = `
            <div class="search-dialog">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; flex: 1;">
                        <span style="margin-right: 8px; min-width: 60px; color: var(--secondary-text);">Find:</span>
                        <input type="text" id="search-input" placeholder="Search..." value="${selection}" style="flex: 1; margin-right: 8px;" />                        
                        <button id="find-next-btn" class="find-next-btn">Next</button>
                        <button id="find-prev-btn" class="find-prev-btn secondary">Prev</button>
                    </div>
                    <button id="close-search-btn" class="close-search-btn" title="Close (Esc)" style="margin-left: 8px;">&times;</button>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="margin-right: 8px; min-width: 60px; color: var(--secondary-text);">Replace:</span>
                    <input type="text" id="replace-input" placeholder="Replace with..." style="flex: 1; margin-right: 8px;" />
                    <button id="replace-next-btn" class="replace-btn">Replace</button>
                    <button id="replace-all-btn" class="replace-all-btn">All</button>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="regex-checkbox" /> Regex
                    </label>
                    <label style="display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="case-checkbox" /> Case sensitive
                    </label>
                    <label style="display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="word-checkbox" /> Whole word
                    </label>
                    <span id="search-stats" style="margin-left: auto; color: var(--secondary-text); font-size: 12px;"></span>
                </div>
            </div>
        `;        this.codeMirror.openDialog(dialogHTML, () => {}, {
            closeOnEnter: false,
            closeOnBlur: false
        });
        
        // Focus the search input
        setTimeout(() => {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
                this.setupSearchHandlers(true); // Always pass true since we always show replace
            }
        }, 100);
    }

    /**
     * Setup search event handlers
     */
    setupSearchHandlers(isReplace) {
        const searchInput = document.getElementById('search-input');
        const replaceInput = document.getElementById('replace-input');
        const regexCheckbox = document.getElementById('regex-checkbox');
        const caseCheckbox = document.getElementById('case-checkbox');
        const wordCheckbox = document.getElementById('word-checkbox');
        const searchStats = document.getElementById('search-stats');
        
        // Add event listeners for buttons
        const findNextBtn = document.getElementById('find-next-btn');
        const findPrevBtn = document.getElementById('find-prev-btn');
        const closeBtn = document.getElementById('close-search-btn');
        const replaceNextBtn = document.getElementById('replace-next-btn');
        const replaceAllBtn = document.getElementById('replace-all-btn');
          if (findNextBtn) {
            findNextBtn.addEventListener('click', () => {
                if (this.allMatches.length > 0) {
                    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.allMatches.length;
                    this.selectMatch(this.allMatches[this.currentMatchIndex]);
                    if (searchStats) {
                        searchStats.textContent = `${this.currentMatchIndex + 1} of ${this.allMatches.length} matches`;
                    }
                }
            });
        }
        
        if (findPrevBtn) {
            findPrevBtn.addEventListener('click', () => {
                if (this.allMatches.length > 0) {
                    this.currentMatchIndex = (this.currentMatchIndex - 1 + this.allMatches.length) % this.allMatches.length;
                    this.selectMatch(this.allMatches[this.currentMatchIndex]);
                    if (searchStats) {
                        searchStats.textContent = `${this.currentMatchIndex + 1} of ${this.allMatches.length} matches`;
                    }
                }
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeDialog();
            });
        }
        
        if (replaceNextBtn) {
            replaceNextBtn.addEventListener('click', () => {
                const query = searchInput.value;
                const replacement = replaceInput.value;
                if (query && this.allMatches.length > 0) {
                    const currentMatch = this.allMatches[this.currentMatchIndex];
                    this.codeMirror.replaceRange(replacement, currentMatch.from, currentMatch.to);
                    
                    // Update search after replacement
                    setTimeout(() => {
                        updateSearch();
                        if (this.allMatches.length > 0) {
                            if (this.currentMatchIndex >= this.allMatches.length) {
                                this.currentMatchIndex = Math.max(0, this.allMatches.length - 1);
                            }
                            if (this.allMatches[this.currentMatchIndex]) {
                                this.selectMatch(this.allMatches[this.currentMatchIndex]);
                                if (searchStats) {
                                    searchStats.textContent = `${this.currentMatchIndex + 1} of ${this.allMatches.length} matches`;
                                }
                            }
                        }
                    }, 50);
                }
            });
        }
        
        if (replaceAllBtn) {
            replaceAllBtn.addEventListener('click', () => {
                const query = searchInput.value;
                const replacement = replaceInput.value;
                if (query && this.allMatches.length > 0) {
                    let count = 0;
                    // Replace from end to beginning to maintain position accuracy
                    for (let i = this.allMatches.length - 1; i >= 0; i--) {
                        const match = this.allMatches[i];
                        this.codeMirror.replaceRange(replacement, match.from, match.to);
                        count++;
                    }
                    
                    if (searchStats) {
                        searchStats.textContent = `Replaced ${count} occurrences`;
                    }
                    setTimeout(() => {
                        updateSearch();
                    }, 100);
                }
            });
        }
        
        // Helper function to update search statistics
        const updateStatsDisplay = (total, current = 1) => {
            if (!searchStats) return;
            if (total === 0) {
                searchStats.textContent = 'No matches';
            } else if (total === 1) {
                searchStats.textContent = '1 match';
            } else {
                searchStats.textContent = `${current} of ${total} matches`;
            }
        };
        
        const updateSearch = () => {
            const query = searchInput.value;
            if (query) {
                const options = this.getSearchOptions();
                this.searchState = this.performSearch(query, options);
                this.allMatches = this.getAllMatches(query, options);
                this.currentMatchIndex = 0;
                updateStatsDisplay(this.allMatches.length);
                if (this.allMatches.length > 0) {
                    this.selectMatch(this.allMatches[this.currentMatchIndex]);
                }
            } else {
                this.codeMirror.operation(() => {
                    this.codeMirror.getAllMarks().forEach(mark => {
                        if (mark.className === 'cm-searching' || mark.className === 'cm-current-search-match') {
                            mark.clear();
                        }
                    });
                });
                searchStats.textContent = '';
                this.searchState = null;
                this.allMatches = [];
                this.currentMatchIndex = 0;
            }
        };
          // Real-time search as user types
        searchInput.addEventListener('input', updateSearch);
        regexCheckbox.addEventListener('change', updateSearch);
        caseCheckbox.addEventListener('change', updateSearch);
        wordCheckbox.addEventListener('change', updateSearch);

        // Handle Escape key to close dialog
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closeDialog();
            }
        };

        // Add escape key listener to both inputs
        searchInput.addEventListener('keydown', handleKeyDown);
        if (replaceInput) {
            replaceInput.addEventListener('keydown', handleKeyDown);
        }
        
        if (isReplace) {
            window.replaceNext = () => {
                const query = searchInput.value;
                const replacement = replaceInput.value;
                if (query && this.allMatches.length > 0) {
                    const currentMatch = this.allMatches[this.currentMatchIndex];
                    this.codeMirror.replaceRange(replacement, currentMatch.from, currentMatch.to);
                    
                    // Update search after replacement
                    setTimeout(() => {
                        updateSearch();
                        if (this.allMatches.length > 0) {
                            // Stay on same index or move to next available
                            if (this.currentMatchIndex >= this.allMatches.length) {
                                this.currentMatchIndex = Math.max(0, this.allMatches.length - 1);
                            }
                            if (this.allMatches[this.currentMatchIndex]) {
                                this.selectMatch(this.allMatches[this.currentMatchIndex]);
                                updateStatsDisplay(this.allMatches.length, this.currentMatchIndex + 1);
                            }
                        }
                    }, 50);
                }
            };
            
            window.replaceAll = () => {
                const query = searchInput.value;
                const replacement = replaceInput.value;
                if (query && this.allMatches.length > 0) {
                    let count = 0;
                    // Replace from end to beginning to maintain position accuracy
                    for (let i = this.allMatches.length - 1; i >= 0; i--) {
                        const match = this.allMatches[i];
                        this.codeMirror.replaceRange(replacement, match.from, match.to);
                        count++;
                    }
                    
                    searchStats.textContent = `Replaced ${count} occurrences`;
                    setTimeout(() => {
                        updateSearch();
                    }, 50);
                }
            };
        }
        
        // Keyboard shortcuts
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    window.findPrev();
                } else {
                    window.findNext();
                }
            } else if (e.key === 'Escape') {
                this.codeMirror.focus();
                this.codeMirror.closeDialog();
            }
        });
        
        if (replaceInput) {
            replaceInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.ctrlKey) {
                        window.replaceAll();
                    } else {
                        window.replaceNext();
                    }
                } else if (e.key === 'Escape') {
                    this.codeMirror.focus();
                    this.codeMirror.closeDialog();
                }
            });
        }
    }

    /**
     * Get search options from checkboxes
     */
    getSearchOptions() {
        const regexCheckbox = document.getElementById('regex-checkbox');
        const caseCheckbox = document.getElementById('case-checkbox');
        const wordCheckbox = document.getElementById('word-checkbox');
        
        return {
            regex: regexCheckbox?.checked || false,
            caseSensitive: caseCheckbox?.checked || false,
            wholeWord: wordCheckbox?.checked || false
        };
    }

    /**
     * Perform search and highlight matches
     */
    performSearch(query, options) {
        try {
            let searchQuery = query;
            
            if (options.regex) {
                try {
                    searchQuery = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
                } catch (e) {
                    // Invalid regex, treat as literal text
                    searchQuery = this.escapeRegex(query);
                }
            } else {
                searchQuery = this.escapeRegex(query);
                if (options.wholeWord) {
                    searchQuery = new RegExp(`\\b${searchQuery}\\b`, options.caseSensitive ? 'g' : 'gi');
                }
            }
            
            // Clear existing highlights
            this.codeMirror.operation(() => {
                this.codeMirror.getAllMarks().forEach(mark => {
                    if (mark.className === 'cm-searching') mark.clear();
                });
            });
            
            // Perform the search
            const searchState = this.codeMirror.getSearchCursor(searchQuery, this.codeMirror.getCursor());
            
            // Highlight all matches
            this.highlightAllMatches(searchQuery, options);
            
            // Find first match
            if (searchState.findNext()) {
                this.codeMirror.setSelection(searchState.from(), searchState.to());
                this.codeMirror.scrollIntoView(searchState.from());
            }
            
            return searchState;
        } catch (e) {
            console.error('Search error:', e);
            return null;
        }
    }

    /**
     * Highlight all matches in the document
     */
    highlightAllMatches(query, options) {
        const cursor = this.codeMirror.getSearchCursor(query, CodeMirror.Pos(this.codeMirror.firstLine(), 0));
        const matches = [];
        
        while (cursor.findNext()) {
            matches.push({
                from: cursor.from(),
                to: cursor.to()
            });
        }
        
        this.codeMirror.operation(() => {
            matches.forEach(match => {
                this.codeMirror.markText(match.from, match.to, {
                    className: 'cm-searching'
                });
            });
        });
        
        return matches.length;
    }

    /**
     * Get all matches for a search query
     */
    getAllMatches(query, options) {
        const matches = [];
        let searchQuery = query;
        
        if (options.regex) {
            try {
                searchQuery = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
            } catch (e) {
                searchQuery = this.escapeRegex(query);
            }
        } else {
            searchQuery = this.escapeRegex(query);
            if (options.wholeWord) {
                searchQuery = new RegExp(`\\b${searchQuery}\\b`, options.caseSensitive ? 'g' : 'gi');
            }
        }
        
        const cursor = this.codeMirror.getSearchCursor(searchQuery, CodeMirror.Pos(this.codeMirror.firstLine(), 0), options.caseSensitive);
        
        while (cursor.findNext()) {
            matches.push({
                from: cursor.from(),
                to: cursor.to()
            });
        }
        
        return matches;
    }
    
    /**
     * Select a specific match
     */
    selectMatch(match) {
        if (!match) return;
        
        this.codeMirror.setSelection(match.from, match.to);
        this.codeMirror.scrollIntoView(match.from, 50);
        
        // Clear previous selection highlighting
        this.codeMirror.operation(() => {
            this.codeMirror.getAllMarks().forEach(mark => {
                if (mark.className === 'cm-current-search-match') mark.clear();
            });
        });
        
        // Highlight current match differently
        this.codeMirror.markText(match.from, match.to, {
            className: 'cm-current-search-match'
        });
    }

    /**
     * Close the search dialog and clear all search highlights
     */
    closeDialog() {
        // Clear all search highlights
        this.codeMirror.operation(() => {
            this.codeMirror.getAllMarks().forEach(mark => {
                if (mark.className === 'cm-searching' || mark.className === 'cm-current-search-match') {
                    mark.clear();
                }
            });
        });

        // Reset search state
        this.searchState = null;
        this.allMatches = [];
        this.currentMatchIndex = 0;        // Close the CodeMirror dialog - simplified approach
        // Find and remove the dialog element directly
        const wrapper = this.codeMirror.getWrapperElement();
        const dialog = wrapper.querySelector('.CodeMirror-dialog');
        if (dialog) {
            dialog.remove();
        }
        
        // Clear CodeMirror's dialog state
        if (this.codeMirror.state.dialog) {
            this.codeMirror.state.dialog = null;
        }

        // Remove global window functions
        delete window.findNext;
        delete window.findPrev;
        delete window.replaceNext;
        delete window.replaceAll;
        delete window.closeSearchDialog;

        // Focus back to editor
        this.codeMirror.focus();
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Create global search dialog (placeholder for future implementation)
     */
    createGlobalSearchDialog(mode) {
        // Placeholder for global search across all files
        this.editor.showNotification('Global search across files - Coming soon!');
    }
}
