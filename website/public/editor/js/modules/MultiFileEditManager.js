/**
 * MultiFileEditManager class - Handles AI-suggested multi-file edits
 * Parses AI responses for file edit proposals and shows diff UI
 */
export class MultiFileEditManager {
    constructor(fileManager, editor, aiManager) {
        console.log('📝 MultiFileEditManager: Initializing...');
        this.fileManager = fileManager;
        this.editor = editor;
        this.aiManager = aiManager;
        this.pendingEdits = [];
        this.diffContainer = null;
        
        this.initializeDiffViewer();
    }
    
    /**
     * Initialize the diff viewer container
     */
    initializeDiffViewer() {
        // Create diff viewer container (will be shown/hidden as needed)
        this.diffContainer = document.createElement('div');
        this.diffContainer.id = 'multi-file-diff-viewer';
        this.diffContainer.className = 'multi-file-diff-viewer hidden';
        
        // Insert into chat panel
        const chatPanel = document.querySelector('.chat-pane');
        if (chatPanel) {
            chatPanel.appendChild(this.diffContainer);
        }
        
        console.log('✅ MultiFileEditManager: Diff viewer initialized');
    }
    
    /**
     * Parse AI response for file edit proposals
     * Format: <file-edit>filename: path/to/file\naction: create|modify\n```lang\ncode\n```\n</file-edit>
     * @param {string} aiResponse - AI response text
     * @returns {Array} Array of edit proposals
     */
    parseEditProposals(aiResponse) {
        const edits = [];
        const fileEditRegex = /<file-edit>([\s\S]*?)<\/file-edit>/g;
        
        let match;
        while ((match = fileEditRegex.exec(aiResponse)) !== null) {
            const editBlock = match[1];
            
            // Parse filename
            const filenameMatch = editBlock.match(/filename:\s*(.+)/);
            const filename = filenameMatch ? filenameMatch[1].trim() : null;
            
            // Parse action
            const actionMatch = editBlock.match(/action:\s*(\w+)/);
            const action = actionMatch ? actionMatch[1].trim() : 'modify';
            
            // Parse code content (everything after the metadata)
            const codeMatch = editBlock.match(/```(\w+)?\n([\s\S]*?)```/);
            const language = codeMatch ? codeMatch[1] || 'text' : 'text';
            const content = codeMatch ? codeMatch[2].trim() : '';
            
            // Parse description (optional)
            const descMatch = editBlock.match(/description:\s*(.+)/);
            const description = descMatch ? descMatch[1].trim() : '';
            
            if (filename && content) {
                edits.push({
                    filename,
                    action, // 'create', 'modify', 'delete'
                    content,
                    language,
                    description
                });
            }
        }
        
        console.log(`📝 Parsed ${edits.length} file edit proposal(s)`);
        return edits;
    }
    
    /**
     * Show diff viewer with all pending edits
     * @param {Array} edits - Array of edit proposals
     */
    showDiffViewer(edits) {
        if (!edits || edits.length === 0) {
            return;
        }
        
        this.pendingEdits = edits;
        
        // Build diff viewer HTML
        let html = `
            <div class="diff-viewer-header">
                <h3>📝 Proposed Changes (${edits.length} file${edits.length > 1 ? 's' : ''})</h3>
                <button class="close-diff-btn" onclick="window.multiFileEditManager.hideDiffViewer()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="diff-viewer-body">
        `;
        
        edits.forEach((edit, index) => {
            const existingFile = this.fileManager.files.find(f => f.name === edit.filename);
            const isNew = !existingFile;
            const actionIcon = this.getActionIcon(edit.action);
            const actionText = this.getActionText(edit.action);
            
            html += `
                <div class="diff-item" data-index="${index}">
                    <div class="diff-item-header">
                        <div class="diff-item-title">
                            <span class="diff-action-icon">${actionIcon}</span>
                            <span class="diff-filename">${edit.filename}</span>
                            <span class="diff-action-badge ${edit.action}">${actionText}</span>
                        </div>
                        <div class="diff-item-actions">
                            ${edit.action !== 'delete' ? `<button class="diff-btn preview-btn" onclick="window.multiFileEditManager.previewEdit(${index})">
                                <i class="fas fa-eye"></i> Preview
                            </button>` : ''}
                            <button class="diff-btn apply-btn" onclick="window.multiFileEditManager.applyEdit(${index})">
                                <i class="fas fa-check"></i> Apply
                            </button>
                            <button class="diff-btn skip-btn" onclick="window.multiFileEditManager.skipEdit(${index})">
                                <i class="fas fa-times"></i> Skip
                            </button>
                        </div>
                    </div>
                    ${edit.description ? `<div class="diff-description">${this.escapeHtml(edit.description)}</div>` : ''}
                    <div class="diff-preview" id="diff-preview-${index}" style="display: none;">
                        ${isNew ? this.renderNewFilePreview(edit) : this.renderDiffPreview(edit, existingFile)}
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
            <div class="diff-viewer-footer">
                <button class="diff-btn cancel-all-btn" onclick="window.multiFileEditManager.hideDiffViewer()">
                    Cancel All
                </button>
                <button class="diff-btn apply-all-btn" onclick="window.multiFileEditManager.applyAllEdits()">
                    <i class="fas fa-check-double"></i> Apply All Changes
                </button>
            </div>
        `;
        
        this.diffContainer.innerHTML = html;
        this.diffContainer.classList.remove('hidden');
        
        // Scroll to diff viewer
        this.diffContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    /**
     * Render preview for new file
     */
    renderNewFilePreview(edit) {
        return `
            <div class="new-file-preview">
                <div class="code-block">
                    <div class="code-header">
                        <span class="language-badge">${edit.language}</span>
                        <span class="file-size">${this.formatFileSize(edit.content.length)}</span>
                    </div>
                    <pre><code class="language-${edit.language}">${this.escapeHtml(edit.content)}</code></pre>
                </div>
            </div>
        `;
    }
    
    /**
     * Render unified diff preview
     */
    renderDiffPreview(edit, existingFile) {
        const oldLines = existingFile.content.split('\n');
        const newLines = edit.content.split('\n');
        
        // Simple line-by-line diff
        let diffHtml = '<div class="unified-diff"><pre>';
        
        const maxLines = Math.max(oldLines.length, newLines.length);
        for (let i = 0; i < maxLines; i++) {
            const oldLine = oldLines[i];
            const newLine = newLines[i];
            
            if (oldLine === undefined) {
                // Added line
                diffHtml += `<div class="diff-line added">+ ${this.escapeHtml(newLine)}</div>`;
            } else if (newLine === undefined) {
                // Removed line
                diffHtml += `<div class="diff-line removed">- ${this.escapeHtml(oldLine)}</div>`;
            } else if (oldLine !== newLine) {
                // Modified line
                diffHtml += `<div class="diff-line removed">- ${this.escapeHtml(oldLine)}</div>`;
                diffHtml += `<div class="diff-line added">+ ${this.escapeHtml(newLine)}</div>`;
            } else {
                // Unchanged line
                diffHtml += `<div class="diff-line unchanged">  ${this.escapeHtml(oldLine)}</div>`;
            }
        }
        
        diffHtml += '</pre></div>';
        return diffHtml;
    }
    
    /**
     * Preview a specific edit (toggle preview visibility)
     */
    previewEdit(index) {
        const preview = document.getElementById(`diff-preview-${index}`);
        if (preview) {
            if (preview.style.display === 'none') {
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        }
    }
    
    /**
     * Apply a single edit
     */
    applyEdit(index) {
        const edit = this.pendingEdits[index];
        if (!edit) return;
        
        console.log(`✅ Applying edit to ${edit.filename}...`);
        
        try {
            if (edit.action === 'create') {
                // Create new file
                const newFile = this.fileManager.createNewFile(edit.filename, edit.content);
                this.fileManager.openFileInTab(newFile.id);
                this.showNotification(`✅ Created ${edit.filename}`, 'success');
            } else if (edit.action === 'modify') {
                // Update existing file
                const existingFile = this.fileManager.files.find(f => f.name === edit.filename);
                if (existingFile) {
                    existingFile.content = edit.content;
                    this.fileManager.saveFilesToStorage();
                    
                    // If file is currently open, update editor
                    const currentFile = this.fileManager.getCurrentFile();
                    if (currentFile && currentFile.id === existingFile.id) {
                        this.editor.setValue(edit.content);
                    }
                    
                    this.showNotification(`✅ Updated ${edit.filename}`, 'success');
                } else {
                    // File doesn't exist, create it instead
                    const newFile = this.fileManager.createNewFile(edit.filename, edit.content);
                    this.fileManager.openFileInTab(newFile.id);
                    this.showNotification(`✅ Created ${edit.filename} (file not found)`, 'success');
                }
            } else if (edit.action === 'delete') {
                // Delete file
                const existingFile = this.fileManager.files.find(f => f.name === edit.filename);
                if (existingFile) {
                    this.fileManager.deleteFile(existingFile.id);
                    this.showNotification(`✅ Deleted ${edit.filename}`, 'success');
                }
            }
            
            // Remove edit from pending list
            this.pendingEdits.splice(index, 1);
            
            // Remove diff item from UI
            const diffItem = document.querySelector(`.diff-item[data-index="${index}"]`);
            if (diffItem) {
                diffItem.remove();
            }
            
            // If no more edits, hide diff viewer
            if (this.pendingEdits.length === 0) {
                this.hideDiffViewer();
            } else {
                // Update header count
                this.updateDiffViewerHeader();
            }
            
        } catch (error) {
            console.error('Error applying edit:', error);
            this.showNotification(`❌ Failed to apply edit: ${error.message}`, 'error');
        }
    }
    
    /**
     * Skip a single edit
     */
    skipEdit(index) {
        console.log(`⏭️ Skipping edit ${index}`);
        
        // Remove edit from pending list
        this.pendingEdits.splice(index, 1);
        
        // Remove diff item from UI
        const diffItem = document.querySelector(`.diff-item[data-index="${index}"]`);
        if (diffItem) {
            diffItem.remove();
        }
        
        // If no more edits, hide diff viewer
        if (this.pendingEdits.length === 0) {
            this.hideDiffViewer();
        } else {
            this.updateDiffViewerHeader();
        }
    }
    
    /**
     * Apply all pending edits
     */
    applyAllEdits() {
        console.log(`✅ Applying all ${this.pendingEdits.length} edits...`);
        
        // Apply each edit in sequence
        const editsToApply = [...this.pendingEdits];
        editsToApply.forEach((edit, index) => {
            this.applyEdit(0); // Always apply index 0 since array shrinks
        });
        
        this.showNotification(`✅ Applied all changes`, 'success');
        this.hideDiffViewer();
    }
    
    /**
     * Hide diff viewer
     */
    hideDiffViewer() {
        this.diffContainer.classList.add('hidden');
        this.pendingEdits = [];
    }
    
    /**
     * Update diff viewer header with new count
     */
    updateDiffViewerHeader() {
        const header = this.diffContainer.querySelector('.diff-viewer-header h3');
        if (header) {
            header.textContent = `📝 Proposed Changes (${this.pendingEdits.length} file${this.pendingEdits.length > 1 ? 's' : ''})`;
        }
    }
    
    /**
     * Get action icon
     */
    getActionIcon(action) {
        const icons = {
            create: '➕',
            modify: '✏️',
            delete: '🗑️'
        };
        return icons[action] || '📄';
    }
    
    /**
     * Get action text
     */
    getActionText(action) {
        const texts = {
            create: 'New',
            modify: 'Modified',
            delete: 'Delete'
        };
        return texts[action] || action;
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Use AI status for now (could create custom notification system later)
        if (this.aiManager && this.aiManager.updateStatus) {
            this.aiManager.updateStatus(message, type);
        } else {
            console.log(message);
        }
    }
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
