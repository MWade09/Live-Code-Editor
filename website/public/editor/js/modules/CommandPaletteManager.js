/**
 * CommandPaletteManager - VS Code-style command palette
 * Provides quick access to all editor commands
 */
export class CommandPaletteManager {
    constructor(editor, codeMirror, managers = {}) {
        this.editor = editor
        this.cm = codeMirror
        this.managers = managers
        this.selectedIndex = 0
        this.filteredCommands = []
        
        // Build command registry
        this.commands = this.buildCommandList()
        
        // Create UI
        this.createPaletteUI()
        
        // Attach event listeners
        this.attachEventListeners()
        
        console.log('✅ CommandPaletteManager initialized')
    }

    /**
     * Build comprehensive list of all available commands
     */
    buildCommandList() {
        return [
            // File Operations
            {
                id: 'file.save',
                label: 'File: Save',
                description: 'Save the current file',
                shortcut: 'Ctrl+S',
                category: 'File',
                action: () => this.executeFileCommand('save')
            },
            {
                id: 'file.saveAs',
                label: 'File: Save As',
                description: 'Save file with new name',
                shortcut: 'Ctrl+Shift+S',
                category: 'File',
                action: () => this.executeFileCommand('saveAs')
            },
            {
                id: 'file.new',
                label: 'File: New File',
                description: 'Create a new file',
                shortcut: 'Ctrl+N',
                category: 'File',
                action: () => this.executeFileCommand('new')
            },
            {
                id: 'file.open',
                label: 'File: Open File',
                description: 'Open an existing file',
                shortcut: 'Ctrl+O',
                category: 'File',
                action: () => this.executeFileCommand('open')
            },
            {
                id: 'file.closeAll',
                label: 'File: Close All Files',
                description: 'Close all open files',
                shortcut: 'Ctrl+Shift+W',
                category: 'File',
                action: () => this.executeFileCommand('closeAll')
            },

            // Edit Operations
            {
                id: 'edit.format',
                label: 'Format Document',
                description: 'Format the entire document',
                shortcut: 'Alt+Shift+F',
                category: 'Edit',
                action: () => this.managers.formattingManager?.formatCode()
            },
            {
                id: 'edit.toggleComment',
                label: 'Toggle Line Comment',
                description: 'Comment or uncomment current line',
                shortcut: 'Ctrl+/',
                category: 'Edit',
                action: () => this.managers.keyboardManager?.toggleComment(this.cm)
            },
            {
                id: 'edit.toggleBlockComment',
                label: 'Toggle Block Comment',
                description: 'Comment or uncomment selection as block',
                shortcut: 'Ctrl+Shift+/',
                category: 'Edit',
                action: () => this.managers.keyboardManager?.toggleBlockComment(this.cm)
            },
            {
                id: 'edit.duplicateLine',
                label: 'Duplicate Line',
                description: 'Duplicate current line or selection',
                shortcut: 'Ctrl+K Ctrl+D',
                category: 'Edit',
                action: () => this.managers.keyboardManager?.duplicateLine(this.cm)
            },
            {
                id: 'edit.deleteLine',
                label: 'Delete Line',
                description: 'Delete current line',
                shortcut: 'Ctrl+Shift+K',
                category: 'Edit',
                action: () => this.managers.keyboardManager?.deleteLines(this.cm)
            },
            {
                id: 'edit.moveLineUp',
                label: 'Move Line Up',
                description: 'Move current line up',
                shortcut: 'Alt+Up',
                category: 'Edit',
                action: () => this.managers.keyboardManager?.moveLineUp(this.cm)
            },
            {
                id: 'edit.moveLineDown',
                label: 'Move Line Down',
                description: 'Move current line down',
                shortcut: 'Alt+Down',
                category: 'Edit',
                action: () => this.managers.keyboardManager?.moveLineDown(this.cm)
            },

            // Search & Replace
            {
                id: 'search.find',
                label: 'Find',
                description: 'Open find dialog',
                shortcut: 'Ctrl+F',
                category: 'Search',
                action: () => this.managers.searchManager?.openFindReplace()
            },
            {
                id: 'search.replace',
                label: 'Replace',
                description: 'Open find and replace dialog',
                shortcut: 'Ctrl+H',
                category: 'Search',
                action: () => this.managers.searchManager?.openFindReplace()
            },
            {
                id: 'search.findNext',
                label: 'Find Next',
                description: 'Find next occurrence',
                shortcut: 'F3',
                category: 'Search',
                action: () => this.managers.searchManager?.findNext()
            },
            {
                id: 'search.findPrevious',
                label: 'Find Previous',
                description: 'Find previous occurrence',
                shortcut: 'Shift+F3',
                category: 'Search',
                action: () => this.managers.searchManager?.findPrevious()
            },

            // View Controls
            {
                id: 'view.toggleMinimap',
                label: 'View: Toggle Minimap',
                description: 'Show or hide the minimap',
                shortcut: 'Ctrl+K M',
                category: 'View',
                action: () => this.managers.minimapManager?.toggleMinimap()
            },
            {
                id: 'view.toggleLineHighlight',
                label: 'View: Toggle Line Highlight',
                description: 'Enable or disable line highlighting',
                shortcut: 'Ctrl+K L',
                category: 'View',
                action: () => this.managers.lineHighlightManager?.toggleLineHighlight()
            },
            {
                id: 'view.toggleBracketColorization',
                label: 'View: Toggle Bracket Colorization',
                description: 'Enable or disable rainbow bracket colors',
                shortcut: 'Ctrl+K B',
                category: 'View',
                action: () => {
                    const enabled = this.managers.bracketColorizerManager?.toggle();
                    this.showNotification(enabled ? 'Bracket colorization enabled' : 'Bracket colorization disabled');
                }
            },
            {
                id: 'view.toggleTerminal',
                label: 'View: Toggle Terminal',
                description: 'Show or hide the integrated terminal',
                shortcut: 'Ctrl+`',
                category: 'View',
                action: () => this.toggleTerminal()
            },
            {
                id: 'view.zoomIn',
                label: 'View: Zoom In',
                description: 'Increase editor font size',
                shortcut: 'Ctrl+=',
                category: 'View',
                action: () => this.managers.keyboardManager?.zoomIn()
            },
            {
                id: 'view.zoomOut',
                label: 'View: Zoom Out',
                description: 'Decrease editor font size',
                shortcut: 'Ctrl+-',
                category: 'View',
                action: () => this.managers.keyboardManager?.zoomOut()
            },
            {
                id: 'view.resetZoom',
                label: 'View: Reset Zoom',
                description: 'Reset editor font size to default',
                shortcut: 'Ctrl+0',
                category: 'View',
                action: () => this.managers.keyboardManager?.resetZoom()
            },

            // Code Folding
            {
                id: 'fold.all',
                label: 'Fold All',
                description: 'Fold all code blocks',
                shortcut: 'Ctrl+K Ctrl+0',
                category: 'Folding',
                action: () => this.managers.keyboardManager?.foldAll()
            },
            {
                id: 'fold.unfoldAll',
                label: 'Unfold All',
                description: 'Unfold all code blocks',
                shortcut: 'Ctrl+K Ctrl+J',
                category: 'Folding',
                action: () => this.managers.keyboardManager?.unfoldAll()
            },
            {
                id: 'fold.toggle',
                label: 'Toggle Fold',
                description: 'Toggle fold at cursor',
                shortcut: 'Ctrl+Shift+[',
                category: 'Folding',
                action: () => this.cm.foldCode(this.cm.getCursor())
            },

            // Multiple Cursors
            {
                id: 'cursor.addAbove',
                label: 'Add Cursor Above',
                description: 'Add cursor to line above',
                shortcut: 'Ctrl+Alt+Up',
                category: 'Cursors',
                action: () => this.managers.keyboardManager?.addCursorAbove(this.cm)
            },
            {
                id: 'cursor.addBelow',
                label: 'Add Cursor Below',
                description: 'Add cursor to line below',
                shortcut: 'Ctrl+Alt+Down',
                category: 'Cursors',
                action: () => this.managers.keyboardManager?.addCursorBelow(this.cm)
            },
            {
                id: 'cursor.selectNext',
                label: 'Select Next Occurrence',
                description: 'Select next occurrence of current word',
                shortcut: 'Ctrl+D',
                category: 'Cursors',
                action: () => this.managers.keyboardManager?.selectNextOccurrence(this.cm)
            },
            {
                id: 'cursor.selectAll',
                label: 'Select All Occurrences',
                description: 'Select all occurrences of current word',
                shortcut: 'Ctrl+Shift+L',
                category: 'Cursors',
                action: () => this.managers.keyboardManager?.selectAllOccurrences(this.cm)
            },

            // Linting
            {
                id: 'lint.toggleLinting',
                label: 'Toggle Linting',
                description: 'Enable or disable code linting',
                shortcut: 'Ctrl+Shift+L',
                category: 'Linting',
                action: () => this.managers.lintManager?.toggleLinting()
            },
            {
                id: 'lint.nextError',
                label: 'Go to Next Error',
                description: 'Jump to next linting error',
                shortcut: 'F8',
                category: 'Linting',
                action: () => this.managers.lintManager?.jumpToNextError()
            },
            {
                id: 'lint.prevError',
                label: 'Go to Previous Error',
                description: 'Jump to previous linting error',
                shortcut: 'Shift+F8',
                category: 'Linting',
                action: () => this.managers.lintManager?.jumpToPrevError()
            },

            // Theme
            {
                id: 'theme.dark',
                label: 'Theme: Dark Mode',
                description: 'Switch to dark theme',
                category: 'Theme',
                action: () => this.setTheme('dark')
            },
            {
                id: 'theme.light',
                label: 'Theme: Light Mode',
                description: 'Switch to light theme',
                category: 'Theme',
                action: () => this.setTheme('light')
            },

            // Snippets
            {
                id: 'snippets.browse',
                label: 'Snippets: Browse Snippets',
                description: 'Browse and insert code snippets',
                shortcut: 'Alt+S',
                category: 'Snippets',
                action: () => this.managers.snippetManager?.showSnippetPalette()
            },

            // Help
            {
                id: 'help.shortcuts',
                label: 'Help: Keyboard Shortcuts',
                description: 'Show all keyboard shortcuts',
                category: 'Help',
                action: () => this.showKeyboardShortcuts()
            }
        ]
    }

    /**
     * Create palette UI overlay
     */
    createPaletteUI() {
        const palette = document.createElement('div')
        palette.id = 'command-palette'
        palette.className = 'command-palette hidden'
        palette.innerHTML = `
            <div class="palette-backdrop"></div>
            <div class="palette-container">
                <div class="palette-header">
                    <input 
                        type="text" 
                        id="palette-search" 
                        class="palette-search"
                        placeholder="Type a command or search..." 
                        autocomplete="off"
                        spellcheck="false"
                    >
                </div>
                <div class="palette-results" id="palette-results"></div>
                <div class="palette-footer">
                    <span class="palette-hint">
                        <kbd>↑</kbd><kbd>↓</kbd> Navigate
                        <kbd>Enter</kbd> Execute
                        <kbd>Esc</kbd> Close
                    </span>
                </div>
            </div>
        `
        
        document.body.appendChild(palette)
        
        this.paletteEl = palette
        this.backdropEl = palette.querySelector('.palette-backdrop')
        this.searchInput = palette.querySelector('#palette-search')
        this.resultsEl = palette.querySelector('#palette-results')
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value)
        })

        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyDown(e)
        })

        // Backdrop click to close
        this.backdropEl.addEventListener('click', () => {
            this.hide()
        })

        // Prevent clicks inside palette from closing
        this.paletteEl.querySelector('.palette-container').addEventListener('click', (e) => {
            e.stopPropagation()
        })
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault()
                this.moveSelection(1)
                break
            
            case 'ArrowUp':
                e.preventDefault()
                this.moveSelection(-1)
                break
            
            case 'Enter':
                e.preventDefault()
                this.executeSelected()
                break
            
            case 'Escape':
                e.preventDefault()
                this.hide()
                break
            
            case 'Tab':
                e.preventDefault()
                this.moveSelection(e.shiftKey ? -1 : 1)
                break
        }
    }

    /**
     * Move selection up or down
     */
    moveSelection(delta) {
        if (this.filteredCommands.length === 0) return
        
        this.selectedIndex = Math.max(0, Math.min(
            this.filteredCommands.length - 1,
            this.selectedIndex + delta
        ))
        
        this.renderResults()
        this.scrollToSelected()
    }

    /**
     * Scroll to show selected item
     */
    scrollToSelected() {
        const selectedEl = this.resultsEl.querySelector('.palette-item.selected')
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
    }

    /**
     * Execute selected command
     */
    executeSelected() {
        if (this.filteredCommands.length === 0) return
        
        const command = this.filteredCommands[this.selectedIndex]
        if (command && command.action) {
            this.hide()
            
            // Execute command with small delay to allow palette to close
            setTimeout(() => {
                try {
                    command.action()
                    console.log(`✅ Executed command: ${command.label}`)
                } catch (error) {
                    console.error(`❌ Error executing command ${command.id}:`, error)
                }
            }, 100)
        }
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        this.selectedIndex = 0
        
        if (!query.trim()) {
            this.filteredCommands = [...this.commands]
        } else {
            const lowerQuery = query.toLowerCase()
            
            // Fuzzy search across label, description, and category
            this.filteredCommands = this.commands.filter(cmd => {
                const searchText = `${cmd.label} ${cmd.description || ''} ${cmd.category || ''}`.toLowerCase()
                return searchText.includes(lowerQuery)
            })
            
            // Sort by relevance (exact matches first)
            this.filteredCommands.sort((a, b) => {
                const aLabel = a.label.toLowerCase()
                const bLabel = b.label.toLowerCase()
                const aStarts = aLabel.startsWith(lowerQuery)
                const bStarts = bLabel.startsWith(lowerQuery)
                
                if (aStarts && !bStarts) return -1
                if (!aStarts && bStarts) return 1
                return 0
            })
        }
        
        this.renderResults()
    }

    /**
     * Render filtered results
     */
    renderResults() {
        if (this.filteredCommands.length === 0) {
            this.resultsEl.innerHTML = `
                <div class="palette-empty">
                    <p>No commands found</p>
                </div>
            `
            return
        }
        
        // Group by category
        const grouped = this.filteredCommands.reduce((acc, cmd) => {
            const category = cmd.category || 'Other'
            if (!acc[category]) acc[category] = []
            acc[category].push(cmd)
            return acc
        }, {})
        
        // Render grouped results
        let html = ''
        Object.entries(grouped).forEach(([category, commands]) => {
            html += `<div class="palette-category">${category}</div>`
            
            commands.forEach((cmd) => {
                const globalIdx = this.filteredCommands.indexOf(cmd)
                const isSelected = globalIdx === this.selectedIndex
                
                html += `
                    <div class="palette-item ${isSelected ? 'selected' : ''}" 
                         data-index="${globalIdx}"
                         onclick="window.commandPaletteInstance?.selectAndExecute(${globalIdx})">
                        <div class="palette-item-main">
                            <span class="palette-label">${this.escapeHTML(cmd.label)}</span>
                            ${cmd.description ? `<span class="palette-description">${this.escapeHTML(cmd.description)}</span>` : ''}
                        </div>
                        ${cmd.shortcut ? `<span class="palette-shortcut">${this.formatShortcut(cmd.shortcut)}</span>` : ''}
                    </div>
                `
            })
        })
        
        this.resultsEl.innerHTML = html
    }

    /**
     * Select and execute command by index (called from onclick)
     */
    selectAndExecute(index) {
        this.selectedIndex = index
        this.executeSelected()
    }

    /**
     * Format keyboard shortcut for display
     */
    formatShortcut(shortcut) {
        return shortcut
            .split('+')
            .map(key => `<kbd>${key}</kbd>`)
            .join('')
    }

    /**
     * Escape HTML for security
     */
    escapeHTML(str) {
        const div = document.createElement('div')
        div.textContent = str
        return div.innerHTML
    }

    /**
     * Show command palette
     */
    show() {
        this.paletteEl.classList.remove('hidden')
        this.searchInput.value = ''
        this.selectedIndex = 0
        this.filteredCommands = [...this.commands]
        this.renderResults()
        
        // Focus search input with delay
        setTimeout(() => {
            this.searchInput.focus()
        }, 50)
        
        console.log('📋 Command palette opened')
    }

    /**
     * Hide command palette
     */
    hide() {
        this.paletteEl.classList.add('hidden')
        
        // Return focus to editor
        setTimeout(() => {
            this.cm.focus()
        }, 50)
    }

    /**
     * Toggle command palette visibility
     */
    toggle() {
        if (this.paletteEl.classList.contains('hidden')) {
            this.show()
        } else {
            this.hide()
        }
    }

    // =====================================================
    // COMMAND IMPLEMENTATIONS
    // =====================================================

    /**
     * Execute file commands
     */
    executeFileCommand(action) {
        const fileManager = this.editor.fileManager
        
        switch(action) {
            case 'save':
                fileManager.saveFile?.()
                break
            case 'saveAs':
                fileManager.saveAs?.()
                break
            case 'new':
                fileManager.createNewFile?.()
                break
            case 'open':
                fileManager.openFile?.()
                break
            case 'closeAll':
                fileManager.closeAllFiles?.()
                break
        }
    }

    /**
     * Toggle terminal
     */
    toggleTerminal() {
        const terminalBtn = document.querySelector('[data-action="toggle-terminal"]')
        if (terminalBtn) {
            terminalBtn.click()
        }
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme')
            this.cm.setOption('theme', 'monokai')
        } else {
            document.body.classList.remove('dark-theme')
            this.cm.setOption('theme', 'eclipse')
        }
        
        // Save preference
        localStorage.setItem('editor-theme', theme)
    }

    /**
     * Show keyboard shortcuts help
     */
    showKeyboardShortcuts() {
        const shortcuts = this.managers.keyboardManager?.getKeyboardShortcutsList?.()
        
        if (shortcuts) {
            // Create modal with shortcuts
            console.log('Keyboard Shortcuts:', shortcuts)
            alert('Check console for keyboard shortcuts list')
            // TODO: Create nice modal UI for shortcuts
        }
    }
}

// Make instance globally accessible for onclick handlers
window.commandPaletteInstance = null
