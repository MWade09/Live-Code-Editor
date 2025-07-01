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
        
        const structure = this.getFileStructure();
        if (!structure) {
            this.contentElement.innerHTML = '<p style="padding: 16px; color: var(--secondary-text); text-align: center;">No files</p>';
            return;
        }

        let html = '<ul class="file-tree">';
        
        // Render root files
        structure.files.forEach(file => {
            html += this.renderFileItem(file);
        });
        
        // Render folders
        structure.folders.forEach((files, folderName) => {
            html += this.renderFolderItem(folderName, files);
        });
        
        html += '</ul>';
        this.contentElement.innerHTML = html;
        
        // Add click listeners
        this.addFileTreeListeners();
    }

    /**
     * Render a single file item
     */
    renderFileItem(file) {
        const icon = this.getFileIcon(file.name);
        const isActive = this.fileManager.currentFile && this.fileManager.currentFile.id === file.id;
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
        const folderIcon = '<i class="fas fa-folder"></i>';
        let html = `
            <li class="file-tree-item folder-item" data-folder-name="${folderName}">
                <span class="file-icon">${folderIcon}</span>
                <span class="file-name">${folderName}</span>
            </li>
            <div class="folder-content">
        `;
        
        files.forEach(file => {
            html += this.renderFileItem(file);
        });
        
        html += '</div>';
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
                    this.renderFileTree(); // Re-render to update active state
                    
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

            // Double click to rename files
            item.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const fileId = item.dataset.fileId;
                console.log('Double-click detected on file:', fileId);
                this.startRenaming(fileId, item);
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

        // Add drop listeners to folder items
        const folderItems = this.contentElement.querySelectorAll('.file-tree-item.folder-item');
        folderItems.forEach(folderItem => {
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
        if (!this.fileManager || !this.fileManager.files) return null;
        
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
            // Only remove if not dragging over a child element
            if (!folderItem.contains(e.relatedTarget)) {
                folderItem.classList.remove('drop-target');
            }
        });

        folderItem.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderItem.classList.remove('drop-target');
            
            const fileId = e.dataTransfer.getData('text/plain');
            if (fileId && folderName) {
                this.moveFileToFolder(fileId, folderName);
            }
        });
    }

    /**
     * Add drop listener to root area for moving files to root
     */
    addRootDropListener() {
        const fileTree = this.contentElement.querySelector('.file-tree');
        if (!fileTree) return;

        fileTree.addEventListener('dragover', (e) => {
            // Only allow drop if not over a folder or file item
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
            // Only handle drop if not over a folder or file item
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
}
