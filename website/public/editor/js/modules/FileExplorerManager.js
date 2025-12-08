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
        
        // Step 5: Set up file search functionality
        this.setupFileSearch();
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
                console.log('Right-click event triggered on main file item');
                e.preventDefault();
                e.stopPropagation();
                const fileId = item.dataset.fileId;
                console.log('File ID:', fileId);
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
        if (!contextMenu) {
            console.error('Context menu element not found!');
            return;
        }

        // Hide any existing context menu first
        this.hideContextMenu();
        
        // Hide tab context menu to prevent conflicts
        const tabContextMenu = document.getElementById('tab-context-menu');
        if (tabContextMenu) {
            tabContextMenu.remove();
        }

        // Store the current file ID
        contextMenu.dataset.fileId = fileId;

        // Calculate proper positioning
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 160; // min-width from CSS
        const menuHeight = 200; // estimated height
        
        let left = event.clientX + 5;
        let top = event.clientY + 5;
        
        // Adjust if menu would go off-screen
        if (left + menuWidth > viewportWidth) {
            left = event.clientX - menuWidth - 5;
        }
        if (top + menuHeight > viewportHeight) {
            top = event.clientY - menuHeight - 5;
        }
        
        // Ensure minimum positioning
        left = Math.max(5, left);
        top = Math.max(5, top);
        
        // Position the context menu with proper viewport coordinates
        contextMenu.style.left = `${left}px`;
        contextMenu.style.top = `${top}px`;
        contextMenu.style.position = 'fixed'; // Ensure it's fixed to viewport
        contextMenu.style.zIndex = '15000'; // Ensure it's on top
        
        // Apply all styles directly via JavaScript to override any CSS conflicts
        contextMenu.style.cssText = `
            position: fixed !important;
            left: ${left}px !important;
            top: ${top}px !important;
            z-index: 15000 !important;
            display: block !important;
            visibility: visible !important;
            pointer-events: auto !important;
            background-color: ${document.body.classList.contains('dark-theme') ? '#1a1a2e' : '#ffffff'} !important;
            border: 1px solid ${document.body.classList.contains('dark-theme') ? '#343a40' : '#dee2e6'} !important;
            border-radius: 6px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, ${document.body.classList.contains('dark-theme') ? '0.4' : '0.15'}) !important;
            min-width: 160px !important;
            padding: 4px 0 !important;
            font-family: 'Inter', 'Segoe UI', sans-serif !important;
            font-size: 13px !important;
            line-height: 1.4 !important;
            list-style: none !important;
            margin: 0 !important;
        `;
        
        // Also style the menu items directly
        const menuItemsForStyling = contextMenu.querySelectorAll('.context-menu-item');
        menuItemsForStyling.forEach(item => {
            item.style.cssText = `
                padding: 8px 16px !important;
                cursor: pointer !important;
                font-size: 13px !important;
                color: ${document.body.classList.contains('dark-theme') ? '#e9ecef' : '#212529'} !important;
                display: block !important;
                border: none !important;
                background: transparent !important;
                text-align: left !important;
                width: 100% !important;
                box-sizing: border-box !important;
                font-family: 'Inter', 'Segoe UI', sans-serif !important;
                margin: 0 !important;
                list-style: none !important;
                transition: background-color 0.2s ease !important;
            `;
            
            // Add hover effect
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = document.body.classList.contains('dark-theme') ? '#0f3460' : '#e9ecef';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'transparent';
            });
        });
        
        // Style separators
        const separators = contextMenu.querySelectorAll('.context-menu-separator');
        separators.forEach(sep => {
            sep.style.cssText = `
                height: 1px !important;
                background-color: ${document.body.classList.contains('dark-theme') ? '#343a40' : '#dee2e6'} !important;
                margin: 4px 0 !important;
                border: none !important;
            `;
        });
        
        contextMenu.classList.add('show');
        
        // Debug logging
        console.log('Context menu positioned at:', { left, top });
        console.log('Context menu element:', contextMenu);
        console.log('Context menu classes:', contextMenu.className);
        console.log('Context menu computed style:', window.getComputedStyle(contextMenu));

        // Add click outside handler to hide context menu
        const hideOnOutsideClick = (e) => {
            if (!contextMenu.contains(e.target)) {
                this.hideContextMenu();
                document.removeEventListener('click', hideOnOutsideClick);
            }
        };
        
        // Use setTimeout to avoid immediate hiding from this same click
        setTimeout(() => {
            document.addEventListener('click', hideOnOutsideClick, { once: false });
        }, 50);
        
        // Prevent context menu from being hidden by this right-click
        event.stopPropagation();
        event.preventDefault();

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
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        const contextMenu = document.getElementById('file-context-menu');
        if (contextMenu) {
            contextMenu.classList.remove('show');
            contextMenu.style.display = 'none';
            contextMenu.style.visibility = 'hidden';
            contextMenu.dataset.fileId = '';
        }
    }

    /**
     * Handle context menu actions
     */
    handleContextMenuAction(action, fileId) {
        const file = this.fileManager.files.find(f => f.id === fileId);
        if (!file) return;

        switch (action) {
            case 'close-tab':
                // Close tab but keep file in project
                if (this.fileManager.closeTab(fileId)) {
                    // If there are still open tabs, load the active one
                    if (this.fileManager.openTabs.length > 0) {
                        this.editor.loadCurrentFile();
                    } else {
                        // No tabs open, clear the editor
                        this.editor.clearEditor();
                    }
                    
                    // Update UI
                    this.updateActiveStates();
                    if (window.app && window.app.renderFileTabs) {
                        window.app.renderFileTabs();
                    }
                    if (window.app && window.app.preview) {
                        window.app.preview.updatePreview();
                    }
                    
                    console.log(`Closed tab for file: ${file.name}`);
                }
                break;
                
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
            void e; // Event not needed
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
    
    // ============================================
    // FILE SEARCH FUNCTIONALITY
    // ============================================
    
    /**
     * Set up file search functionality
     */
    setupFileSearch() {
        const searchInput = document.getElementById('file-search-input');
        const clearSearchBtn = document.getElementById('clear-search');
        
        if (!searchInput || !clearSearchBtn) return;
        
        let searchTimeout;
        
        // Real-time search as user types
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Show/hide clear button
            clearSearchBtn.style.display = query ? 'flex' : 'none';
            
            // Debounce search to avoid too frequent updates
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performFileSearch(query);
            }, 300);
        });
        
        // Clear search functionality
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            this.clearFileSearch();
            searchInput.focus();
        });
        
        // Handle Enter key to focus first result
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusFirstSearchResult();
            } else if (e.key === 'Escape') {
                this.clearFileSearch();
                searchInput.blur();
            }
        });
    }
    
    /**
     * Perform file search
     */
    performFileSearch(query) {
        if (!query) {
            this.clearFileSearch();
            return;
        }
        
        const searchResults = this.searchFiles(query);
        this.renderSearchResults(searchResults, query);
    }
    
    /**
     * Search files by name
     */
    searchFiles(query) {
        const searchTerm = query.toLowerCase();
        const results = [];
        
        this.fileManager.files.forEach(file => {
            const fileName = file.name.toLowerCase();
            const fileNameOnly = fileName.includes('/') ? fileName.split('/').pop() : fileName;
            
            // Check if query matches file name or path
            if (fileName.includes(searchTerm) || fileNameOnly.includes(searchTerm)) {
                results.push({
                    ...file,
                    matchScore: this.calculateMatchScore(fileName, fileNameOnly, searchTerm)
                });
            }
        });
        
        // Sort by relevance (match score)
        results.sort((a, b) => b.matchScore - a.matchScore);
        
        return results;
    }
    
    /**
     * Calculate match score for search relevance
     */
    calculateMatchScore(fullName, fileName, searchTerm) {
        let score = 0;
        
        // Exact match in file name gets highest score
        if (fileName === searchTerm) score += 100;
        
        // Starts with search term gets high score
        if (fileName.startsWith(searchTerm)) score += 50;
        
        // Contains search term gets medium score
        if (fileName.includes(searchTerm)) score += 25;
        
        // Full path match gets bonus
        if (fullName.includes(searchTerm)) score += 10;
        
        // Shorter file names get slight bonus for relevance
        score += Math.max(0, 20 - fileName.length);
        
        return score;
    }
    
    /**
     * Render search results
     */
    renderSearchResults(results, query) {
        if (!this.contentElement) return;
        
        let html = '';
        
        if (results.length === 0) {
            html = `
                <div class="search-results-section">
                    <div class="search-results-header">Search Results</div>
                    <div class="search-no-results">
                        No files found matching "${query}"
                    </div>
                </div>
            `;
        } else {
            html = `
                <div class="search-results-section">
                    <div class="search-results-header">
                        Search Results (${results.length} file${results.length !== 1 ? 's' : ''})
                    </div>
                    <ul class="file-tree">
            `;
            
            results.forEach(file => {
                const highlightedName = this.highlightSearchTerm(file.name, query);
                const icon = this.getFileIcon(file.name);
                const currentFile = this.fileManager.getCurrentFile();
                const isActive = currentFile && currentFile.id === file.id;
                const activeClass = isActive ? ' active' : '';
                
                html += `
                    <li class="file-tree-item search-result-item${activeClass}" data-file-id="${file.id}" draggable="true">
                        <span class="file-icon">${icon}</span>
                        <span class="file-name">${highlightedName}</span>
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        this.contentElement.innerHTML = html;
        
        // Add event listeners to search results
        this.addSearchResultListeners();
    }
    
    /**
     * Highlight search term in file names
     */
    highlightSearchTerm(fileName, searchTerm) {
        if (!searchTerm) return fileName;
        
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return fileName.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Add event listeners to search results
     */
    addSearchResultListeners() {
        const searchResultItems = this.contentElement.querySelectorAll('.search-result-item[data-file-id]');
        
        searchResultItems.forEach(item => {
            // Single click to open file
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = item.dataset.fileId;
                
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
                    
                    // Clear search and show normal file tree
                    this.clearFileSearch();
                }
            });
            
            // Right click for context menu
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const fileId = item.dataset.fileId;
                this.showContextMenu(e, fileId);
            });
            
            // Add drag-and-drop functionality
            this.addDragAndDropListeners(item);
        });
    }
    
    /**
     * Focus first search result
     */
    focusFirstSearchResult() {
        const firstResult = this.contentElement.querySelector('.search-result-item[data-file-id]');
        if (firstResult) {
            firstResult.click();
        }
    }
    
    /**
     * Clear file search and show normal file tree
     */
    clearFileSearch() {
        const searchInput = document.getElementById('file-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
        }
        
        // Re-render normal file tree
        this.renderFileTree();
    }
    
    // ============================================
    // MISSING METHODS (RESTORED)
    // ============================================
    
    /**
     * Update active states of file tree items
     */
    updateActiveStates() {
        if (!this.contentElement) return;
        
        // Remove active class from all file items
        const allFileItems = this.contentElement.querySelectorAll('.file-tree-item');
        allFileItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current file
        const currentFile = this.fileManager.getCurrentFile();
        if (currentFile) {
            const activeItem = this.contentElement.querySelector(`[data-file-id="${currentFile.id}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
        
        // Also update tab active states in recent files
        const recentFileItems = this.contentElement.querySelectorAll('.recent-file-item');
        recentFileItems.forEach(item => {
            item.classList.remove('active');
            if (currentFile && item.dataset.fileId === currentFile.id) {
                item.classList.add('active');
            }
        });
    }
    
    /**
     * Add event listeners to recent file items
     */
    addRecentFilesListeners() {
        if (!this.contentElement) return;
        
        const recentFileItems = this.contentElement.querySelectorAll('.recent-file-item');
        recentFileItems.forEach(item => {
            // Remove existing listeners to prevent duplicates
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Add click listener
            newItem.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = newItem.dataset.fileId;
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
                }
            });
            
            // Add context menu listener
            newItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const fileId = newItem.dataset.fileId;
                this.showContextMenu(e, fileId);
            });
        });
    }
    
    /**
     * Update the recent files section only (without full re-render)
     */
    updateRecentFilesSection() {
        if (!this.contentElement) return;
        
        const recentFilesContainer = this.contentElement.querySelector('.recent-files-section');
        if (!recentFilesContainer) return;
        
        const recentFiles = this.fileManager.getRecentFiles();
        const currentFile = this.fileManager.getCurrentFile();
        
        // Clear current recent files
        const recentFilesList = recentFilesContainer.querySelector('.recent-files-list');
        if (recentFilesList) {
            recentFilesList.innerHTML = '';
            
            if (recentFiles.length > 0) {
                recentFiles.forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.className = `recent-file-item${currentFile && currentFile.id === file.id ? ' active' : ''}`;
                    fileItem.dataset.fileId = file.id;
                    
                    const icon = this.getFileIcon(file.name);
                    fileItem.innerHTML = `
                        <span class="file-icon">${icon}</span>
                        <span class="file-name" title="${file.name}">${file.name}</span>
                    `;
                    
                    recentFilesList.appendChild(fileItem);
                });
                
                // Add listeners to new recent file items
                this.addRecentFilesListeners();
            } else {
                recentFilesList.innerHTML = '<div class="no-recent-files">No recent files</div>';
            }
        }
    }
}