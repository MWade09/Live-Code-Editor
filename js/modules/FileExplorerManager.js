/**
 * FileExplorerManager - Handles file tree view and enhanced file operations
 * Step 1: Basic structure and initialization
 */
export class FileExplorerManager {
    constructor(fileManager, editor) {
        this.fileManager = fileManager;
        this.editor = editor;
        this.isInitialized = false;
        this.isVisible = false;
        this.sidebarElement = null;
        this.contentElement = null;
        
        console.log('FileExplorerManager created - ready for initialization');
    }

    /**
     * Initialize the file explorer (will be called when ready)
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('FileExplorerManager initialized');
        this.isInitialized = true;
        
        // Get DOM elements
        this.sidebarElement = document.getElementById('file-explorer-sidebar');
        this.contentElement = document.getElementById('file-explorer-content');
        
        // Step 1: Just log the current files for now
        this.logCurrentFiles();
        
        // Step 2: Set up the toggle button
        this.setupToggleButton();
        
        // Step 3: Set up close button
        this.setupCloseButton();
        
        // Step 4: Set up new folder button
        this.setupNewFolderButton();
    }

    /**
     * Set up the file explorer toggle button
     */
    setupToggleButton() {
        const toggleButton = document.getElementById('file-explorer-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleSidebar();
            });
            console.log('File Explorer toggle button set up successfully');
        } else {
            console.warn('File Explorer toggle button not found');
        }
    }

    /**
     * Set up the close button in the sidebar
     */
    setupCloseButton() {
        const closeButton = document.getElementById('close-file-explorer');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideSidebar();
            });
        }
    }

    /**
     * Toggle the file explorer sidebar visibility
     */
    toggleSidebar() {
        if (this.isVisible) {
            this.hideSidebar();
        } else {
            this.showSidebar();
        }
    }

    /**
     * Show the file explorer sidebar
     */
    showSidebar() {
        if (!this.sidebarElement) return;
        
        this.sidebarElement.style.display = 'flex';
        this.isVisible = true;
        this.renderFileTree();
        console.log('File Explorer shown');
    }

    /**
     * Hide the file explorer sidebar
     */
    hideSidebar() {
        if (!this.sidebarElement) return;
        
        this.sidebarElement.style.display = 'none';
        this.isVisible = false;
        console.log('File Explorer hidden');
    }

    /**
     * Render the file tree in the sidebar
     */
    renderFileTree() {
        if (!this.contentElement) return;
        
        console.log('=== FILE EXPLORER DEBUG ===');
        console.log('FileManager:', this.fileManager);
        console.log('FileManager.files:', this.fileManager ? this.fileManager.files : 'NO FILEMANAGER');
        
        const structure = this.getFileStructure();
        console.log('File structure:', structure);
        
        if (!structure) {
            console.log('No structure - showing no files message');
            this.contentElement.innerHTML = '<p style="padding: 16px; color: var(--secondary-text); text-align: center;">No files</p>';
            return;
        }

        let html = '';
        
        // Render recent files section
        html += this.renderRecentFilesSection();
        
        // Render main file tree
        html += '<div class="file-tree-section">';
        html += '<div class="file-tree-header">Project Files</div>';
        html += '<ul class="file-tree">';
        
        // Render root files
        structure.files.forEach(file => {
            html += this.renderFileItem(file);
        });
        
        // Render folders
        structure.folders.forEach((files, folderName) => {
            html += this.renderFolderItem(folderName, files);
        });
        
        html += '</ul>';
        html += '</div>';
        
        this.contentElement.innerHTML = html;
        
        // Add click listeners
        this.addFileTreeListeners();
    }

    /**
     * Render a single file item
     */
    renderFileItem(file) {
        const icon = this.getFileIcon(file.name);
        const currentFile = this.fileManager.getCurrentFile();
        const isActive = currentFile && currentFile.id === file.id;
        const activeClass = isActive ? ' active' : '';
        
        return `
            <li class="file-tree-item${activeClass}" data-file-id="${file.id}" draggable="true">
                <span class="file-icon">${icon}</span>
                <span class="file-name">${file.name}</span>
            </li>
        `;
    }

    /**
     * Render a folder item with its contents
     */
    renderFolderItem(folderName, files) {
        let html = `
            <li class="folder-item" data-folder-name="${folderName}">
                <span class="folder-toggle">▶</span>
                <span class="folder-icon"><i class="fas fa-folder"></i></span>
                <span class="folder-name">${folderName}</span>
            </li>
            <div class="folder-content">
                <ul class="file-tree">
        `;
        
        files.forEach(file => {
            html += this.renderFileItem(file);
        });
        
        html += `
                </ul>
            </div>
        `;
        return html;
    }

    /**
     * Get appropriate icon for file type
     */
    getFileIcon(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        switch (ext) {
            case 'html': return '<i class="fab fa-html5" style="color: #e34f26;"></i>';
            case 'css': return '<i class="fab fa-css3-alt" style="color: #1572b6;"></i>';
            case 'js': return '<i class="fab fa-js-square" style="color: #f7df1e;"></i>';
            case 'json': return '<i class="fas fa-brackets-curly" style="color: #00d2d3;"></i>';
            case 'md': return '<i class="fab fa-markdown" style="color: #083fa1;"></i>';
            case 'txt': return '<i class="fas fa-file-text"></i>';
            case 'py': return '<i class="fab fa-python" style="color: #3776ab;"></i>';
            default: return '<i class="fas fa-file"></i>';
        }
    }

    /**
     * Render the recent files section
     */
    renderRecentFilesSection() {
        const recentFiles = this.fileManager.getRecentFiles();
        
        if (recentFiles.length === 0) {
            return ''; // Don't show section if no recent files
        }

        let html = '<div class="recent-files-section">';
        html += '<div class="recent-files-header">';
        html += '<i class="fas fa-clock"></i> Recent Files';
        html += '<button class="clear-recent-btn" title="Clear Recent Files">';
        html += '<i class="fas fa-times"></i>';
        html += '</button>';
        html += '</div>';
        html += '<ul class="recent-files-list">';
        
        recentFiles.slice(0, 5).forEach(recentFile => { // Show max 5 recent files
            // Always show recent files, even if not currently loaded
            const file = this.fileManager.files.find(f => f.id === recentFile.id);
            const fileName = file ? file.name : recentFile.name;
            const icon = this.getFileIcon(fileName);
            const currentFile = this.fileManager.getCurrentFile();
            const isActive = currentFile && currentFile.id === recentFile.id;
            const activeClass = isActive ? ' active' : '';
            const timeAgo = this.getTimeAgo(recentFile.timestamp);
            
            html += `
                <li class="recent-file-item${activeClass}" data-file-id="${recentFile.id}">
                    <span class="file-icon">${icon}</span>
                    <div class="file-info">
                        <span class="file-name">${fileName}</span>
                        <span class="file-time">${timeAgo}</span>
                    </div>
                </li>
            `;
        });
        
        html += '</ul>';
        html += '</div>';
        
        return html;
    }

    /**
     * Get human-readable time ago string
     */
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }

    /**
     * Add click listeners to file tree items
     */
    addFileTreeListeners() {
        const fileItems = this.contentElement.querySelectorAll('.file-tree-item[data-file-id]');
        fileItems.forEach(item => {
            // Single click to switch files
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = item.dataset.fileId;
                if (this.fileManager.setCurrentFileById(fileId)) {
                    this.editor.loadCurrentFile();
                    this.updateActiveStates(); // Update active states without re-rendering
                    this.updateRecentFilesSection(); // Update recent files section
                    
                    // Update file tabs and preview if needed
                    if (window.app && window.app.preview && window.app.preview.isLivePreview) {
                        window.app.preview.updatePreview();
                    }
                    
                    // Re-render file tabs
                    if (window.app && window.app.renderFileTabs) {
                        window.app.renderFileTabs();
                    }
                }
            });

            // Right click for context menu
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const fileId = item.dataset.fileId;
                console.log('Right-click detected on file:', fileId);
                this.showContextMenu(e, fileId);
            });

            // Add drag-and-drop functionality
            this.addDragAndDropListeners(item);
        });

        // Add recent files listeners
        this.addRecentFilesListeners();

        // Add listeners for folder toggle functionality
        const folderItems = this.contentElement.querySelectorAll('.folder-item');
        folderItems.forEach(folderItem => {
            // Add click listener for folder toggle
            folderItem.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFolder(folderItem);
            });

            // Add drag/drop listeners
            this.addFolderDropListeners(folderItem);
        });

        // Add drop listener to the file tree root for moving to root
        this.addRootDropListener();
    }

    /**
     * Log current files to see what we're working with
     */
    logCurrentFiles() {
        if (this.fileManager && this.fileManager.files) {
            console.log('Current files:', this.fileManager.files.map(f => ({
                name: f.name,
                type: f.type,
                id: f.id
            })));
        }
    }

    /**
     * Get file structure organized by folders (basic version)
     */
    getFileStructure() {
        console.log('Getting file structure...');
        if (!this.fileManager || !this.fileManager.files) {
            console.log('No fileManager or files array');
            return null;
        }
        
        console.log('Files found:', this.fileManager.files.length);
        console.log('File details:', this.fileManager.files.map(f => ({ name: f.name, id: f.id, type: f.type })));
        
        const structure = {
            files: [],
            folders: new Map()
        };
        
        this.fileManager.files.forEach(file => {
            const pathParts = file.name.split('/');
            
            if (pathParts.length === 1) {
                // Root level file
                structure.files.push(file);
            } else {
                // File in folder
                const folderName = pathParts[0];
                if (!structure.folders.has(folderName)) {
                    structure.folders.set(folderName, []);
                }
                structure.folders.get(folderName).push({
                    ...file,
                    relativePath: pathParts.slice(1).join('/')
                });
            }
        });
        
        return structure;
    }

    /**
     * Set up the new folder button
     */
    setupNewFolderButton() {
        const newFolderBtn = document.getElementById('new-folder-btn');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => {
                this.showNewFolderModal();
            });
        }
        
        // Set up modal buttons
        const createFolderBtn = document.getElementById('create-folder-btn');
        const cancelFolderBtn = document.getElementById('cancel-new-folder-btn');
        const folderModal = document.getElementById('newFolderModal');
        const folderNameInput = document.getElementById('folder-name-input');
        
        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', () => {
                const folderName = folderNameInput.value.trim();
                if (folderName) {
                    this.createFolder(folderName);
                    this.hideNewFolderModal();
                }
            });
        }
        
        if (cancelFolderBtn) {
            cancelFolderBtn.addEventListener('click', () => {
                this.hideNewFolderModal();
            });
        }
        
        // Handle Enter key in folder name input
        if (folderNameInput) {
            folderNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    createFolderBtn.click();
                }
                if (e.key === 'Escape') {
                    cancelFolderBtn.click();
                }
            });
        }
        
        // Close modal when clicking outside
        if (folderModal) {
            folderModal.addEventListener('click', (e) => {
                if (e.target === folderModal) {
                    this.hideNewFolderModal();
                }
            });
        }
    }

    /**
     * Show the new folder modal
     */
    showNewFolderModal() {
        const modal = document.getElementById('newFolderModal');
        const input = document.getElementById('folder-name-input');
        if (modal && window.app && window.app.showModal) {
            window.app.showModal(modal);
            if (input) {
                input.value = '';
                setTimeout(() => input.focus(), 100);
            }
        }
    }

    /**
     * Hide the new folder modal
     */
    hideNewFolderModal() {
        const modal = document.getElementById('newFolderModal');
        if (modal && window.app && window.app.hideModal) {
            window.app.hideModal(modal);
        }
    }

    /**
     * Create a new folder
     */
    createFolder(folderName) {
        // Validate folder name
        if (!this.isValidFolderName(folderName)) {
            alert('Invalid folder name. Please use only letters, numbers, hyphens, and underscores.');
            return;
        }
        
        // Check if folder already exists
        if (this.folderExists(folderName)) {
            alert('A folder with this name already exists.');
            return;
        }
        
        // Create folder by creating a placeholder file
        const placeholderFileName = `${folderName}/.gitkeep`;
        const placeholderFile = {
            id: Date.now().toString(),
            name: placeholderFileName,
            content: '# This file keeps the folder in version control\n',
            type: 'text'
        };
        
        // Add the placeholder file to the file manager
        this.fileManager.files.push(placeholderFile);
        
        // Save files to storage
        this.fileManager.saveFilesToStorage();
        
        // Re-render the file tree to show the new folder
        this.renderFileTree();
        
        console.log(`Created folder: ${folderName}`);
    }

    /**
     * Check if folder name is valid
     */
    isValidFolderName(name) {
        // Allow letters, numbers, hyphens, underscores, and forward slashes
        const validPattern = /^[a-zA-Z0-9\-_\/]+$/;
        return validPattern.test(name) && !name.startsWith('/') && !name.endsWith('/');
    }

    /**
     * Check if folder already exists
     */
    folderExists(folderName) {
        return this.fileManager.files.some(file => 
            file.name.startsWith(folderName + '/') || file.name === folderName
        );
    }

    /**
     * Start renaming a file (inline editing)
     */
    startRenaming(fileId, itemElement) {
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        const fileNameSpan = itemElement.querySelector('.file-name');
        if (!fileNameSpan) return;

        const originalName = file.name;
        const fileName = file.name.includes('/') ? file.name.split('/').pop() : file.name;
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = fileName;
        input.className = 'file-rename-input';
        input.style.cssText = `
            background: var(--primary-bg);
            border: 1px solid var(--accent-color);
            border-radius: 3px;
            padding: 2px 6px;
            font-size: 13px;
            font-family: inherit;
            color: var(--primary-text);
            width: 100%;
            outline: none;
        `;

        // Replace the span with input
        fileNameSpan.style.display = 'none';
        itemElement.appendChild(input);
        input.focus();
        input.select();

        const finishRenaming = (save = false) => {
            if (save && input.value.trim() && input.value.trim() !== fileName) {
                this.renameFile(fileId, input.value.trim(), originalName);
            }
            input.remove();
            fileNameSpan.style.display = 'block';
        };

        // Handle input events
        input.addEventListener('blur', () => finishRenaming(true));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRenaming(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                finishRenaming(false);
            }
        });
    }

    /**
     * Rename a file
     */
    renameFile(fileId, newFileName, originalName) {
        // Validate new file name
        if (!this.isValidFileName(newFileName)) {
            alert('Invalid file name. Please use only letters, numbers, hyphens, underscores, and dots.');
            return;
        }

        // Find the file
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        // Determine the new full path
        let newFullName;
        if (originalName.includes('/')) {
            // File is in a folder, keep the folder path
            const folderPath = originalName.substring(0, originalName.lastIndexOf('/'));
            newFullName = `${folderPath}/${newFileName}`;
        } else {
            // Root level file
            newFullName = newFileName;
        }

        // Check if a file with the new name already exists
        const existingFile = this.fileManager.files.find(f => f.name === newFullName && f.id !== fileId);
        if (existingFile) {
            alert('A file with this name already exists.');
            return;
        }

        // Update the file name
        file.name = newFullName;
        
        // Update file type based on new extension
        file.type = this.fileManager.getFileType(newFullName);

        // Save to storage
        this.fileManager.saveFilesToStorage();

        // Re-render everything
        this.renderFileTree();
        if (window.app && window.app.renderFileTabs) {
            window.app.renderFileTabs();
        }

        console.log(`Renamed file from "${originalName}" to "${newFullName}"`);
    }

    /**
     * Move a file to a different folder
     */
    moveFile(fileId, targetFolderName) {
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        const fileName = file.name.includes('/') ? file.name.split('/').pop() : file.name;
        const newFullName = targetFolderName ? `${targetFolderName}/${fileName}` : fileName;

        // Check if target already exists
        const existingFile = this.fileManager.files.find(f => f.name === newFullName && f.id !== fileId);
        if (existingFile) {
            alert('A file with this name already exists in the target location.');
            return;
        }

        const originalName = file.name;
        file.name = newFullName;

        // Save to storage
        this.fileManager.saveFilesToStorage();

        // Re-render everything
        this.renderFileTree();
        if (window.app && window.app.renderFileTabs) {
            window.app.renderFileTabs();
        }

        console.log(`Moved file from "${originalName}" to "${newFullName}"`);
    }

    /**
     * Check if file name is valid
     */
    isValidFileName(name) {
        // Allow letters, numbers, hyphens, underscores, dots
        const validPattern = /^[a-zA-Z0-9\-_.]+$/;
        return validPattern.test(name) && !name.startsWith('.') && name.includes('.');
    }

    /**
     * Show context menu for file operations
     */
    showContextMenu(event, fileId) {
        const contextMenu = document.getElementById('file-context-menu');
        if (!contextMenu) return;

        // Position the context menu
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;

        // Store the current file ID
        contextMenu.dataset.fileId = fileId;

        // Add event listeners to menu items
        const menuItems = contextMenu.querySelectorAll('.context-menu-item[data-action]');
        menuItems.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                this.handleContextMenuAction(action, fileId);
                this.hideContextMenu();
            };
        });

        // Hide menu when clicking outside
        const hideOnClickOutside = (e) => {
            if (!contextMenu.contains(e.target)) {
                this.hideContextMenu();
                document.removeEventListener('click', hideOnClickOutside);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', hideOnClickOutside);
        }, 100);
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        const contextMenu = document.getElementById('file-context-menu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }

    /**
     * Handle context menu actions
     */
    handleContextMenuAction(action, fileId) {
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        switch (action) {
            case 'rename':
                // Find the file tree item and start renaming
                const fileItem = this.contentElement.querySelector(`[data-file-id="${fileId}"]`);
                if (fileItem) {
                    this.startRenaming(fileId, fileItem);
                }
                break;
                
            case 'duplicate':
                this.duplicateFile(fileId);
                break;

            case 'copy-content':
                this.copyFileContent(fileId);
                break;

            case 'export':
                this.exportFile(fileId);
                break;
                
            case 'delete':
                this.deleteFile(fileId);
                break;
                
            case 'move-to-root':
                this.moveFileToRoot(fileId);
                break;
                
            default:
                console.warn('Unknown context menu action:', action);
        }
    }

    /**
     * Duplicate a file
     */
    duplicateFile(fileId) {
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        // Generate new name
        const extension = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
        const nameWithoutExt = extension ? file.name.slice(0, -extension.length) : file.name;
        const newName = `${nameWithoutExt}_copy${extension}`;

        // Create duplicate
        const duplicateFile = {
            id: Date.now().toString(),
            name: newName,
            content: file.content,
            type: file.type
        };

        // Add to file manager
        this.fileManager.files.push(duplicateFile);
        this.fileManager.saveFilesToStorage();

        // Re-render
        this.renderFileTree();
        if (window.app && window.app.renderFileTabs) {
            window.app.renderFileTabs();
        }

        console.log(`Duplicated file: ${file.name} → ${newName}`);
    }

    /**
     * Delete a file
     */
    deleteFile(fileId) {
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
            // Use the existing deleteFile method from FileManager
            if (this.fileManager.deleteFile && this.fileManager.deleteFile(fileId)) {
                // Re-render
                this.renderFileTree();
                if (window.app && window.app.renderFileTabs) {
                    window.app.renderFileTabs();
                }
                console.log(`Deleted file: ${file.name}`);
            } else {
                // Fallback manual deletion
                const index = this.fileManager.files.findIndex(f => f.id === fileId);
                if (index !== -1) {
                    this.fileManager.files.splice(index, 1);
                    
                    // Update current file index if needed
                    if (this.fileManager.currentFileIndex >= index) {
                        this.fileManager.currentFileIndex = Math.max(0, this.fileManager.currentFileIndex - 1);
                        if (this.fileManager.files.length === 0) {
                            this.fileManager.currentFileIndex = -1;
                        }
                    }
                    
                    this.fileManager.saveFilesToStorage();
                    this.renderFileTree();
                    if (window.app && window.app.renderFileTabs) {
                        window.app.renderFileTabs();
                    }
                    
                    // Reload editor if needed
                    if (this.fileManager.files.length > 0) {
                        this.editor.loadCurrentFile();
                    }
                    
                    console.log(`Deleted file: ${file.name}`);
                }
            }
        }
    }

    /**
     * Move file to root folder
     */
    moveFileToRoot(fileId) {
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        if (!file.name.includes('/')) {
            alert('File is already in the root folder.');
            return;
        }

        const fileName = file.name.split('/').pop();
        const newName = fileName;

        // Check if file already exists in root
        const existingFile = this.fileManager.files.find(f => f.name === newName && f.id !== fileId);
        if (existingFile) {
            alert('A file with this name already exists in the root folder.');
            return;
        }

        const originalName = file.name;
        file.name = newName;

        this.fileManager.saveFilesToStorage();
        this.renderFileTree();
        if (window.app && window.app.renderFileTabs) {
            window.app.renderFileTabs();
        }

        console.log(`Moved file from "${originalName}" to root: "${newName}"`);
    }

    /**
     * Copy file content to clipboard for pasting in other projects
     */
    copyFileContent(fileId) {
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        try {
            // Create a text to copy that includes file metadata
            const copyText = `/* File: ${file.name} */\n${file.content}`;
            
            // Use the Clipboard API if available
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(copyText).then(() => {
                    this.showToast(`File content copied to clipboard: ${file.name}`);
                    console.log(`Copied content of "${file.name}" to clipboard`);
                }).catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    this.fallbackCopyToClipboard(copyText, file.name);
                });
            } else {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(copyText, file.name);
            }
        } catch (error) {
            console.error('Error copying file content:', error);
            alert('Failed to copy file content to clipboard.');
        }
    }

    /**
     * Fallback method to copy text to clipboard
     */
    fallbackCopyToClipboard(text, fileName) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast(`File content copied to clipboard: ${fileName}`);
            console.log(`Copied content of "${fileName}" to clipboard (fallback method)`);
        } catch (err) {
            console.error('Fallback copy failed:', err);
            alert('Failed to copy file content to clipboard.');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    /**
     * Export file as download for use in other projects
     */
    exportFile(fileId) {
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        try {
            // Create a blob with the file content
            const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
            
            // Create a download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name.includes('/') ? file.name.split('/').pop() : file.name;
            a.style.display = 'none';
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            this.showToast(`File exported: ${a.download}`);
            console.log(`Exported file: ${a.download}`);
        } catch (error) {
            console.error('Error exporting file:', error);
            alert('Failed to export file.');
        }
    }

    /**
     * Show a temporary toast notification
     */
    showToast(message, duration = 3000) {
        // Remove any existing toast
        const existingToast = document.querySelector('.file-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'file-toast';
        toast.textContent = message;
        
        // Add to document
        document.body.appendChild(toast);
        
        // Show with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Hide and remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * Add drag-and-drop listeners to file items
     */
    addDragAndDropListeners(fileItem) {
        const fileId = fileItem.dataset.fileId;
        
        // Drag start
        fileItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', fileId);
            e.dataTransfer.effectAllowed = 'move';
            fileItem.classList.add('dragging');
            console.log('Started dragging file:', fileId);
        });

        // Drag end
        fileItem.addEventListener('dragend', (e) => {
            fileItem.classList.remove('dragging');
            // Remove all drop indicators
            this.contentElement.querySelectorAll('.drop-target').forEach(el => {
                el.classList.remove('drop-target');
            });
        });
    }

    /**
     * Add drop listeners to folder items
     */
    addFolderDropListeners(folderItem) {
        const folderName = folderItem.dataset.folderName;
        
        folderItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            folderItem.classList.add('drop-target');
        });

        folderItem.addEventListener('dragleave', (e) => {
            if (!folderItem.contains(e.relatedTarget)) {
                folderItem.classList.remove('drop-target');
            }
        });

        folderItem.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderItem.classList.remove('drop-target');
            
            const fileId = e.dataTransfer.getData('text/plain');
            if (fileId) {
                this.moveFileToFolder(fileId, folderName);
            }
        });
    }

    /**
     * Add drop listener to the file tree root for moving to root
     */
    addRootDropListener() {
        const fileTree = this.contentElement.querySelector('.file-tree-content');
        if (!fileTree) return;

        fileTree.addEventListener('dragover', (e) => {
            // Only allow drop on the root, not on file items
            if (!e.target.closest('.file-tree-item')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                fileTree.classList.add('drop-target-root');
            }
        });

        fileTree.addEventListener('dragleave', (e) => {
            if (!fileTree.contains(e.relatedTarget)) {
                fileTree.classList.remove('drop-target-root');
            }
        });

        fileTree.addEventListener('drop', (e) => {
            // Only handle drop on root area
            if (!e.target.closest('.file-tree-item')) {
                e.preventDefault();
                e.stopPropagation();
                fileTree.classList.remove('drop-target-root');
                
                const fileId = e.dataTransfer.getData('text/plain');
                if (fileId) {
                    this.moveFileToFolder(fileId, null); // null = root
                }
            }
        });
    }

    /**
     * Move a file to a specific folder (or root if folderName is null)
     */
    moveFileToFolder(fileId, folderName) {
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        const fileName = file.name.includes('/') ? file.name.split('/').pop() : file.name;
        const newFullName = folderName ? `${folderName}/${fileName}` : fileName;

        // Check if target already exists
        const existingFile = this.fileManager.files.find(f => f.name === newFullName && f.id !== fileId);
        if (existingFile) {
            alert('A file with this name already exists in the target location.');
            return;
        }

        const originalName = file.name;
        file.name = newFullName;

        // Save to storage
        this.fileManager.saveFilesToStorage();

        // Re-render everything
        this.renderFileTree();
        if (window.app && window.app.renderFileTabs) {
            window.app.renderFileTabs();
        }

        const destination = folderName || 'root';
        console.log(`Moved file from "${originalName}" to ${destination}: "${newFullName}"`);
    }

    /**
     * Toggle folder open/closed state
     */
    toggleFolder(folderElement) {
        const folderContent = folderElement.nextElementSibling;
        const toggleIcon = folderElement.querySelector('.folder-toggle');
        
        if (!folderContent || !toggleIcon) return;
        
        const isExpanded = folderElement.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse folder
            folderElement.classList.remove('expanded');
            toggleIcon.textContent = '▶';
        } else {
            // Expand folder
            folderElement.classList.add('expanded');
            toggleIcon.textContent = '▼';
        }
        
        console.log(`Folder ${isExpanded ? 'collapsed' : 'expanded'}:`, folderElement.dataset.folderName);
    }

    /**
     * Refresh the file tree (useful when files are added/removed)
     */
    refresh() {
        if (this.isVisible) {
            this.renderFileTree();
        }
    }

    /**
     * Clear recent files list
     */
    clearRecentFiles() {
        this.fileManager.clearRecentFiles();
        this.updateRecentFilesSection(); // Update just the recent files section
    }

    /**
     * Test method to verify everything is working
     */
    test() {
        console.log('FileExplorerManager test:');
        console.log('- FileManager exists:', !!this.fileManager);
        console.log('- Editor exists:', !!this.editor);
        console.log('- Initialized:', this.isInitialized);
        
        const structure = this.getFileStructure();
        if (structure) {
            console.log('- Root files:', structure.files.length);
            console.log('- Folders:', structure.folders.size);
        }
        
        return true;
    }

    /**
     * Update active states of files without re-rendering the entire tree
     */
    updateActiveStates() {
        const currentFile = this.fileManager.getCurrentFile();
        if (!this.contentElement || !currentFile) {
            return;
        }
        
        // Remove active class from all file items
        const allFileItems = this.contentElement.querySelectorAll('.file-tree-item[data-file-id], .recent-file-item[data-file-id]');
        allFileItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current file items
        const currentFileId = currentFile.id;
        const currentFileItems = this.contentElement.querySelectorAll(`[data-file-id="${currentFileId}"]`);
        currentFileItems.forEach(item => {
            item.classList.add('active');
        });
    }

    /**
     * Load a recent file that's not currently in the files array
     */
    loadRecentFile(fileId) {
        const recentFiles = this.fileManager.getRecentFiles();
        const recentFile = recentFiles.find(rf => rf.id === fileId);
        
        if (!recentFile) {
            console.error('Recent file not found with ID:', fileId);
            return;
        }
        
        // Try to load from localStorage first
        const allStoredFiles = localStorage.getItem('editorFiles');
        if (allStoredFiles) {
            const storedFiles = JSON.parse(allStoredFiles);
            const storedFile = storedFiles.find(f => f.id === fileId);
            
            if (storedFile) {
                // Add the file back to the current files array
                this.fileManager.files.push(storedFile);
                
                // Now try to select it
                if (this.fileManager.setCurrentFileById(fileId)) {
                    this.editor.loadCurrentFile();
                    this.renderFileTree(); // Re-render since we added a file
                    
                    // Update file tabs and preview if needed
                    if (window.app && window.app.preview && window.app.preview.isLivePreview) {
                        window.app.preview.updatePreview();
                    }
                    
                    // Re-render file tabs
                    if (window.app && window.app.renderFileTabs) {
                        window.app.renderFileTabs();
                    }
                    
                    console.log('Successfully loaded recent file:', recentFile.name);
                    return;
                }
            }
        }
        
        // If file couldn't be loaded from storage, create a new file with the name
        console.warn('Could not load recent file from storage, creating new file:', recentFile.name);
        this.fileManager.createNewFile(recentFile.name, '// File content was not found\n// This is a new file with the same name\n');
    }

    /**
     * Update just the recent files section without re-rendering the entire tree
     */
    updateRecentFilesSection() {
        if (!this.contentElement) return;
        
        // Find the existing recent files section
        const existingSection = this.contentElement.querySelector('.recent-files-section');
        const newSectionHTML = this.renderRecentFilesSection();
        
        if (existingSection && newSectionHTML) {
            // Replace the existing section with updated content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newSectionHTML;
            const newSection = tempDiv.firstElementChild;
            
            existingSection.parentNode.replaceChild(newSection, existingSection);
            
            // Re-add event listeners for the new recent files section
            this.addRecentFilesListeners();
        } else if (!existingSection && newSectionHTML) {
            // Add recent files section if it doesn't exist
            const fileTreeSection = this.contentElement.querySelector('.file-tree-section');
            if (fileTreeSection) {
                fileTreeSection.insertAdjacentHTML('beforebegin', newSectionHTML);
                this.addRecentFilesListeners();
            }
        } else if (existingSection && !newSectionHTML) {
            // Remove recent files section if no recent files
            existingSection.remove();
        }
    }

    /**
     * Add event listeners specifically for recent files section
     */
    addRecentFilesListeners() {
        // Add listeners for recent file items
        const recentFileItems = this.contentElement.querySelectorAll('.recent-file-item[data-file-id]');
        recentFileItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = item.dataset.fileId;
                
                // Try to select the file if it's already loaded
                if (this.fileManager.setCurrentFileById(fileId)) {
                    this.editor.loadCurrentFile();
                    this.updateActiveStates();
                    
                    // Update file tabs and preview if needed
                    if (window.app && window.app.preview && window.app.preview.isLivePreview) {
                        window.app.preview.updatePreview();
                    }
                    
                    // Re-render file tabs
                    if (window.app && window.app.renderFileTabs) {
                        window.app.renderFileTabs();
                    }
                } else {
                    // File not currently loaded, try to load it from recent files data
                    this.loadRecentFile(fileId);
                }
            });
        });

        // Add listener for clear recent files button
        const clearRecentBtn = this.contentElement.querySelector('.clear-recent-btn');
        if (clearRecentBtn) {
            clearRecentBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearRecentFiles();
            });
        }
    }
}