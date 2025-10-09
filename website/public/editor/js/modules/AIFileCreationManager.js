/**
 * AI File Creation Manager
 * Handles file creation suggestions from AI responses
 * Parse <create-file> tags and show preview dialog before creating
 */

export class AIFileCreationManager {
    constructor(fileManager) {
        this.fileManager = fileManager;
        this.pendingCreations = [];
        this.createUI();
    }
    
    /**
     * Create the file creation preview UI
     */
    createUI() {
        const previewDialog = document.createElement('div');
        previewDialog.id = 'ai-file-creation-dialog';
        previewDialog.className = 'ai-file-creation-dialog';
        previewDialog.innerHTML = `
            <div class="ai-file-creation-content">
                <div class="ai-file-creation-header">
                    <h3>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="11" x2="12" y2="17"></line>
                            <line x1="9" y1="14" x2="15" y2="14"></line>
                        </svg>
                        AI File Creation
                    </h3>
                    <button class="close-dialog-btn" onclick="window.aiFileCreationManager.closeDialog()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="ai-file-creation-body">
                    <p class="creation-description">The AI wants to create the following files for you:</p>
                    <div class="file-creation-list" id="file-creation-list"></div>
                </div>
                <div class="ai-file-creation-footer">
                    <button class="cancel-creation-btn" onclick="window.aiFileCreationManager.closeDialog()">Cancel</button>
                    <button class="create-all-files-btn" onclick="window.aiFileCreationManager.createAllFiles()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Create All Files
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(previewDialog);
        this.dialog = previewDialog;
    }
    
    /**
     * Parse AI response for file creation tags
     * Format: <create-file>filename: path/to/file.js\n```lang\ncode\n```</create-file>
     * @param {string} aiResponse - The AI response text
     * @returns {Array} Array of file creation proposals
     */
    parseFileCreations(aiResponse) {
        const creations = [];
        const createFileRegex = /<create-file>([\s\S]*?)<\/create-file>/g;
        let match;
        
        while ((match = createFileRegex.exec(aiResponse)) !== null) {
            const content = match[1].trim();
            
            // Extract filename
            const filenameMatch = content.match(/filename:\s*(.+)/);
            if (!filenameMatch) continue;
            
            const filename = filenameMatch[1].trim();
            
            // Extract code from code block
            const codeBlockMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);
            if (!codeBlockMatch) continue;
            
            const language = codeBlockMatch[1] || 'text';
            const code = codeBlockMatch[2].trim();
            
            // Extract optional description
            const descMatch = content.match(/description:\s*(.+)/);
            const description = descMatch ? descMatch[1].trim() : '';
            
            creations.push({
                filename,
                language,
                code,
                description,
                status: 'pending'
            });
        }
        
        return creations;
    }
    
    /**
     * Show file creation dialog with previews
     * @param {Array} creations - Array of file creation proposals
     */
    showCreationDialog(creations) {
        if (!creations || creations.length === 0) {
            console.log('No file creations to show');
            return;
        }
        
        this.pendingCreations = creations;
        const listContainer = document.getElementById('file-creation-list');
        listContainer.innerHTML = '';
        
        creations.forEach((creation, index) => {
            const fileCard = this.renderFileCreationCard(creation, index);
            listContainer.appendChild(fileCard);
        });
        
        this.dialog.style.display = 'flex';
    }
    
    /**
     * Render a single file creation card
     * @param {Object} creation - File creation data
     * @param {number} index - Index in the list
     * @returns {HTMLElement} The file card element
     */
    renderFileCreationCard(creation, index) {
        const card = document.createElement('div');
        card.className = 'file-creation-card';
        card.dataset.index = index;
        
        // Detect if file already exists
        const existingFile = this.fileManager.files.find(f => f.name === creation.filename);
        const fileExists = !!existingFile;
        
        // Get file extension for icon
        const ext = creation.filename.split('.').pop();
        const icon = this.getFileIcon(ext);
        
        card.innerHTML = `
            <div class="file-creation-card-header">
                <div class="file-info">
                    ${icon}
                    <span class="filename">${this.escapeHtml(creation.filename)}</span>
                    ${fileExists ? '<span class="file-exists-badge">FILE EXISTS</span>' : ''}
                </div>
                <div class="file-actions">
                    <button class="preview-file-btn" onclick="window.aiFileCreationManager.togglePreview(${index})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Preview
                    </button>
                    <button class="create-single-file-btn" onclick="window.aiFileCreationManager.createSingleFile(${index})" 
                            ${fileExists ? 'title="Will overwrite existing file"' : ''}>
                        ${fileExists ? 'Overwrite' : 'Create'}
                    </button>
                </div>
            </div>
            ${creation.description ? `<p class="file-description">${this.escapeHtml(creation.description)}</p>` : ''}
            <div class="file-preview" id="file-preview-${index}" style="display: none;">
                <pre><code class="language-${creation.language}">${this.escapeHtml(creation.code)}</code></pre>
            </div>
        `;
        
        return card;
    }
    
    /**
     * Toggle file preview
     * @param {number} index - Index of the file
     */
    togglePreview(index) {
        const preview = document.getElementById(`file-preview-${index}`);
        const btn = event.target.closest('.preview-file-btn');
        
        if (preview.style.display === 'none') {
            preview.style.display = 'block';
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                Hide
            `;
            
            // Apply syntax highlighting if Prism is available
            if (typeof Prism !== 'undefined') {
                Prism.highlightElement(preview.querySelector('code'));
            }
        } else {
            preview.style.display = 'none';
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Preview
            `;
        }
    }
    
    /**
     * Create a single file
     * @param {number} index - Index of the file to create
     */
    async createSingleFile(index) {
        const creation = this.pendingCreations[index];
        if (!creation) return;
        
        try {
            // Check if file exists
            const existingFile = this.fileManager.files.find(f => f.name === creation.filename);
            
            if (existingFile) {
                // Update existing file
                existingFile.content = creation.code;
                this.fileManager.saveFilesToStorage();
                
                // If it's the currently open file, update editor
                if (this.fileManager.currentFile === existingFile.name) {
                    this.fileManager.editor.setValue(creation.code);
                }
                
                console.log(`✅ Updated file: ${creation.filename}`);
            } else {
                // Create new file
                this.fileManager.createNewFile(creation.filename, creation.code);
                console.log(`✅ Created file: ${creation.filename}`);
            }
            
            // Mark as created
            creation.status = 'created';
            
            // Update UI
            const card = this.dialog.querySelector(`[data-index="${index}"]`);
            if (card) {
                card.style.opacity = '0.6';
                const btn = card.querySelector('.create-single-file-btn');
                btn.disabled = true;
                btn.innerHTML = '✓ Created';
                btn.style.background = '#28a745';
            }
            
            // Show success notification
            if (window.aiManager) {
                window.aiManager.updateStatus(`File ${creation.filename} ${existingFile ? 'updated' : 'created'}!`, 'success');
            }
            
        } catch (error) {
            console.error('Error creating file:', error);
            if (window.aiManager) {
                window.aiManager.updateStatus(`Failed to create ${creation.filename}`, 'error');
            }
        }
    }
    
    /**
     * Create all pending files
     */
    async createAllFiles() {
        for (let i = 0; i < this.pendingCreations.length; i++) {
            if (this.pendingCreations[i].status === 'pending') {
                await this.createSingleFile(i);
            }
        }
        
        // Close dialog after a short delay
        setTimeout(() => {
            this.closeDialog();
        }, 1500);
    }
    
    /**
     * Close the creation dialog
     */
    closeDialog() {
        this.dialog.style.display = 'none';
        this.pendingCreations = [];
    }
    
    /**
     * Get file icon based on extension
     * @param {string} ext - File extension
     * @returns {string} Icon SVG HTML
     */
    getFileIcon(ext) {
        const icons = {
            'js': '📜',
            'ts': '📘',
            'jsx': '⚛️',
            'tsx': '⚛️',
            'html': '🌐',
            'css': '🎨',
            'json': '📋',
            'md': '📝',
            'py': '🐍',
            'txt': '📄'
        };
        
        return `<span class="file-icon">${icons[ext] || '📄'}</span>`;
    }
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
