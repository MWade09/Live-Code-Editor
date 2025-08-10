/**
 * Main Application File - Coordinates all modules and handles initialization
 */
import { FileManager } from './modules/FileManager.js';
import { FileExplorerManager } from './modules/FileExplorerManager.js';
import { Editor } from './modules/Editor-New.js';
import { Preview } from './modules/Preview.js';
import { Resizer } from './modules/Resizer.js';
import { ThemeManager } from './modules/ThemeManager.js';
import { DeployManager } from './modules/DeployManager.js';
import { AIManager } from './modules/AIManager.js';
import { InlineAIManager } from './modules/InlineAIManager.js';
import { AICodeActionsManager } from './modules/AICodeActionsManager.js';
import { ProjectSyncManager } from './modules/ProjectSyncManager.js';

// Load chat panel scripts - CSS is now loaded directly in HTML
(function() {
    console.log('Loading chat panel components...');
    
    // Function to load scripts in order
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = (error) => {
            console.error('Error loading script', src, error);
        };
        document.head.appendChild(script);
    }
    
    // Load chat panel script, then model manager script
    loadScript('js/chat-panel.js', function() {
        console.log('Chat panel script loaded');
        loadScript('js/model-manager.js', function() {
            console.log('Model manager script loaded');
        });
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Live Editor Application Starting...');
    console.log('📅 Date:', new Date().toISOString());
    console.log('🌐 User Agent:', navigator.userAgent);
    
    // Modal Animation Functions
    function showModal(modalElement) {
        modalElement.style.display = 'flex';
        setTimeout(() => {
            modalElement.classList.add('show');
        }, 10);
    }

    function hideModal(modalElement) {
        modalElement.classList.remove('show');
        setTimeout(() => {
            modalElement.style.display = 'none';
        }, 300);
    }
      // Initialize all managers
    const fileManager = new FileManager();
    const editor = new Editor(document.getElementById('editor'), fileManager);
    const preview = new Preview(document.getElementById('preview-frame'), fileManager);
    const resizer = new Resizer(
        document.getElementById('dragMe'),
        document.querySelector('.left-pane'), 
        document.querySelector('.chat-pane')
    );
    const themeManager = new ThemeManager();
    const deployManager = new DeployManager(fileManager);
    const aiManager = new AIManager(editor, fileManager);
    
    // Initialize InlineAIManager with error handling
    let inlineAIManager;
    try {
        inlineAIManager = new InlineAIManager(editor, aiManager, fileManager);
        console.log('✅ InlineAIManager initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize InlineAIManager:', error);
        inlineAIManager = null;
    }
    
    // Initialize AICodeActionsManager with error handling
    let aiCodeActionsManager;
    try {
        aiCodeActionsManager = new AICodeActionsManager(editor, aiManager, fileManager);
        console.log('✅ AICodeActionsManager initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize AICodeActionsManager:', error);
        aiCodeActionsManager = null;
    }
    
    const fileExplorerManager = new FileExplorerManager(fileManager, editor);
    const projectSync = new ProjectSyncManager(fileManager);
    
    // Global app state
    window.app = {
        fileManager,
        editor,
        preview,
        resizer,
        themeManager,
        deployManager,
        aiManager,
        inlineAIManager,
        aiCodeActionsManager,
        fileExplorerManager,
        showModal,
        hideModal,
        renderFileTabs,
        projectSync
    };
    
    // Expose inline AI manager globally for debugging
    if (inlineAIManager) {
        window.inlineAI = inlineAIManager;
        console.log('🐞 Debug: window.inlineAI available for debugging');
    }
    
    // Expose AI code actions manager globally for debugging
    if (aiCodeActionsManager) {
        window.aiCodeActions = aiCodeActionsManager;
        console.log('🐞 Debug: window.aiCodeActions available for debugging');
    }
    
    // Initialize the application
    initializeApp();

    // Guest banner logic
    try {
        const guestBanner = document.getElementById('guest-banner');
        const remainingEl = document.getElementById('guest-remaining');
        const addKeyBtn = document.getElementById('guest-add-key-btn');
        const hasKey = !!localStorage.getItem('openrouter_api_key');
        if (guestBanner && !hasKey) {
            const LIMIT = 10;
            const used = parseInt(localStorage.getItem('guest_ai_requests_used') || '0', 10);
            const remaining = Math.max(LIMIT - used, 0);
            if (remainingEl) remainingEl.textContent = `(Remaining: ${remaining}/${LIMIT})`;
            guestBanner.classList.add('show');
        }
        if (addKeyBtn) {
            addKeyBtn.addEventListener('click', () => {
                // Focus API key field in chat panel if present
                const keyInput = document.getElementById('chat-api-key') || document.getElementById('ai-api-key');
                if (keyInput) {
                    keyInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    keyInput.focus();
                }
            });
        }
    } catch (e) {
        console.warn('Guest banner init failed:', e);
    }
    
    function initializeApp() {
        // Initialize file explorer manager
        fileExplorerManager.init();
        
        // Load current file if available
        editor.loadCurrentFile();
        
        // Update preview if live preview is enabled
        if (preview.isLivePreview) {
            preview.updatePreview();
        }
        
        // Set up file tabs
        renderFileTabs();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('Application initialized successfully');

        // If URL contains ?project=, load from website and enable auto-save
        try {
            const params = new URLSearchParams(window.location.search);
            const projectId = params.get('project');
            const siteOrigin = params.get('site');
            if (projectId) {
                projectSync.loadWebsiteProject(projectId)
                    .then(() => {
                        // Hide welcome, show editor view
                        const editorToggle = document.getElementById('editor-toggle');
                        if (editorToggle && !editorToggle.classList.contains('active')) {
                            editorToggle.click();
                        }
                        console.log('[ProjectSync] Loaded project from website');
                        // Add Back to Website and Sync buttons into header near Deploy/Community
                        try {
                            const controls = document.querySelector('header .controls .view-controls');
                            const themeToggle = document.getElementById('theme-toggle');
                            if (controls && themeToggle) {
                                if (siteOrigin) {
                                    const backBtn = document.createElement('button');
                                    backBtn.id = 'back-to-website-btn';
                                    backBtn.className = 'community-btn';
                                    backBtn.title = 'Back to Website';
                                    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> <span>Back</span>';
                                    backBtn.addEventListener('click', () => {
                                        const target = `${siteOrigin.replace(/\/$/, '')}/projects/${projectId}`;
                                        window.location.href = target;
                                    });
                                    controls.insertBefore(backBtn, themeToggle);
                                }

                                const syncBtn = document.createElement('button');
                                syncBtn.id = 'project-sync-btn';
                                syncBtn.className = 'deploy-btn';
                                syncBtn.title = 'Sync with Website';
                                syncBtn.innerHTML = '<i class="fas fa-rotate"></i> <span>Sync</span>';

                                const setSaving = () => { syncBtn.querySelector('span').textContent = 'Saving...'; syncBtn.disabled = true; };
                                const setSynced = () => { syncBtn.querySelector('span').textContent = 'Synced'; syncBtn.disabled = false; };
                                const setError = () => { syncBtn.querySelector('span').textContent = 'Retry Sync'; syncBtn.disabled = false; };
                                const doSync = async () => {
                                    setSaving();
                                    const result = await projectSync.saveToWebsite();
                                    if (result.ok) {
                                        setSynced();
                                        showStatusMessage('Synced to website');
                                    } else {
                                        setError();
                                        console.warn('Save failed:', result.error);
                                        showStatusMessage('Sync failed');
                                    }
                                };
                                syncBtn.addEventListener('click', doSync);
                                controls.insertBefore(syncBtn, themeToggle);
                                // Initial sync shortly after load
                                setTimeout(doSync, 500);
                            }
                        } catch {}
                        // Clear any stale local files after loading
                        try {
                            localStorage.removeItem('editorFiles');
                            localStorage.removeItem('editorOpenTabs');
                            localStorage.removeItem('editorActiveTabIndex');
                            localStorage.removeItem('editorRecentFiles');
                        } catch {}
                        // Hook up auto-save (debounced)
                        let saveTimer = null;
                        editor.codeMirror.on('change', () => {
                            clearTimeout(saveTimer);
                            saveTimer = setTimeout(async () => {
                                const syncBtn = document.getElementById('project-sync-btn');
                                if (syncBtn) syncBtn.querySelector('span').textContent = 'Saving...';
                                const result = await projectSync.saveToWebsite();
                                if (!result.ok) {
                                    console.warn('Save failed:', result.error);
                                    if (syncBtn) syncBtn.querySelector('span').textContent = 'Retry Sync';
                                } else {
                                    if (syncBtn) syncBtn.querySelector('span').textContent = 'Synced';
                                }
                            }, 1000);
                        });
                    })
                    .catch(err => console.error('Failed to load website project:', err));
            }
        } catch (e) {
            console.warn('Project sync init failed:', e);
        }
    }
    
    function setupEventListeners() {
        // File operations
        document.getElementById('new-file-btn').addEventListener('click', showNewFileModal);
        document.getElementById('upload-file-btn').addEventListener('click', () => {
            document.getElementById('upload-file-input').click();
        });
        document.getElementById('upload-folder-btn').addEventListener('click', () => {
            document.getElementById('upload-folder-input').click();
        });
        document.getElementById('download-file-btn').addEventListener('click', downloadCurrentFile);
        document.getElementById('download-all-btn').addEventListener('click', downloadAllFiles);
        
        // File input handlers
        document.getElementById('upload-file-input').addEventListener('change', handleFileUpload);
        document.getElementById('upload-folder-input').addEventListener('change', handleFolderUpload);
          // New file modal
        document.getElementById('create-file-btn').addEventListener('click', createNewFile);
        document.getElementById('cancel-new-file-btn').addEventListener('click', () => {
            hideModal(document.getElementById('newFileModal'));
        });
          // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
        
        // Inline AI toggle
        document.getElementById('inline-ai-toggle-btn').addEventListener('click', toggleInlineAI);
        
        // Note: Preview toggle is now handled by chat-panel.js
        
        // Deploy functionality
        document.getElementById('deploy-btn').addEventListener('click', () => {
            deployManager.showDeployModal();
        });
        document.getElementById('confirm-deploy-btn').addEventListener('click', () => {
            deployManager.deployToNetlify();
        });
        document.getElementById('cancel-deploy-btn').addEventListener('click', () => {
            deployManager.hideDeployModal();
        });
        
        // Community button click
        document.getElementById('community-btn').addEventListener('click', () => {
            // Open community website in new tab
            window.open('https://ailiveeditor.netlify.app/community', '_blank');
        });
          // AI Assistant functionality (handled by chat panel)
        // The AI functionality is now integrated into the chat panel
        if (document.getElementById('cancel-ai-btn')) {
            document.getElementById('cancel-ai-btn').addEventListener('click', () => {
                aiManager.hideAIModal();
            });
        }
        
        // Editor change listener for live preview
        editor.codeMirror.on('change', () => {
            if (preview.isLivePreview) {
                setTimeout(() => preview.updatePreview(), 300);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    function handleKeyboardShortcuts(e) {
        // Ctrl+S - Save (sync to website when enabled)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            (async () => {
                if (projectSync && projectSync.syncEnabled) {
                    const result = await projectSync.saveToWebsite();
                    if (result.ok) {
                        showStatusMessage('Synced to website');
                    } else {
                        showStatusMessage('Sync failed');
                    }
                } else {
                    showStatusMessage('File saved');
                }
            })();
        }
        
        // Ctrl+N - New file
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            showNewFileModal();
        }
        
        // Ctrl+O - Upload file
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            document.getElementById('upload-file-input').click();
        }
        
        // Ctrl+Shift+P - Show AI Assistant
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            aiManager.showAIModal();
        }
        
        // Ctrl+Shift+I - Toggle Inline AI
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            toggleInlineAI();
        }
    }
    
    function showNewFileModal() {
        showModal(document.getElementById('newFileModal'));
        document.getElementById('file-name').focus();
    }
    
    function createNewFile() {
        const fileName = document.getElementById('file-name').value.trim();
        
        if (!fileName) {
            alert('Please enter a file name');
            return;
        }
        
        // Check if file already exists
        const existingFile = fileManager.files.find(file => file.name === fileName);
        if (existingFile) {
            alert('A file with this name already exists');
            return;
        }
        
        // Create the new file
        const newFile = fileManager.createNewFile(fileName);
        
        // Load the new file in the editor
        editor.loadFile(newFile);
        
        // Update tabs
        renderFileTabs();
        
        // Hide modal
        hideModal(document.getElementById('newFileModal'));
        
        // Clear input
        document.getElementById('file-name').value = '';
        
        // Focus editor
        editor.focus();
        
        showStatusMessage(`Created new file: ${fileName}`);
    }
    
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        fileManager.uploadFile(file)
            .then(newFile => {
                editor.loadFile(newFile);
                renderFileTabs();
                preview.updatePreview();
                showStatusMessage(`Uploaded: ${file.name}`);
            })
            .catch(error => {
                console.error('Error uploading file:', error);
                alert(`Error uploading file: ${error.message}`);
            });
        
        // Clear the input
        event.target.value = '';
    }
    
    function handleFolderUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        fileManager.uploadFolder(files)
            .then(result => {
                editor.loadCurrentFile();
                renderFileTabs();
                preview.updatePreview();
                showStatusMessage(`Uploaded ${result.success} files${result.failed > 0 ? `, ${result.failed} failed` : ''}`);
            })
            .catch(error => {
                console.error('Error uploading folder:', error);
                alert(`Error uploading folder: ${error.message}`);
            });
        
        // Clear the input
        event.target.value = '';
    }
    
    function downloadCurrentFile() {
        if (fileManager.downloadCurrentFile()) {
            showStatusMessage('File downloaded');
        } else {
            alert('No file to download');
        }
    }
    
    function downloadAllFiles() {
        if (fileManager.downloadAllFiles()) {
            showStatusMessage('All files downloaded as ZIP');
        } else {
            alert('No files to download');
        }
    }
      function toggleTheme() {
        const isDark = themeManager.toggleTheme();
        editor.setTheme(isDark);
        showStatusMessage(`Switched to ${isDark ? 'dark' : 'light'} theme`);
    }
    
    function toggleInlineAI() {
        if (!inlineAIManager) {
            console.error('InlineAIManager not available');
            showStatusMessage('Inline AI not available');
            return;
        }
        
        const isEnabled = inlineAIManager.toggle();
        const button = document.getElementById('inline-ai-toggle-btn');
        
        if (isEnabled) {
            button.classList.add('active');
            button.title = 'Disable Inline AI Suggestions (Ctrl+Shift+I)';
            showStatusMessage('Inline AI suggestions enabled');
        } else {
            button.classList.remove('active');
            button.title = 'Enable Inline AI Suggestions (Ctrl+Shift+I)';
            showStatusMessage('Inline AI suggestions disabled');
        }
    }
    
    // Note: togglePreview function moved to chat-panel.js
    // function togglePreview() { ... }
    
    function renderFileTabs() {
        const tabsContainer = document.getElementById('file-tabs');
        tabsContainer.innerHTML = '';
        
        // Get open tab files instead of all files
        const openTabFiles = fileManager.getOpenTabFiles();
        const activeTabFile = fileManager.getActiveTabFile();
        
        // Show/hide welcome screen based on open tabs
        updateViewState(openTabFiles.length === 0);
        
        openTabFiles.forEach((file, index) => {
            if (!file) return; // Skip if file was deleted but still in tabs
            
            const tab = document.createElement('div');
            tab.className = `file-tab ${file === activeTabFile ? 'active' : ''}`;
            tab.innerHTML = `
                <span class="tab-name">${file.name}</span>
                <button class="close-tab" onclick="closeTab('${file.id}')" title="Close tab">×</button>
            `;
            
            // Tab click to switch files
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-tab')) return;
                switchToTab(file.id);
            });
            
            // Right-click context menu for tabs
            tab.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showTabContextMenu(e, file.id);
            });
            
            tabsContainer.appendChild(tab);
        });
        
        // Add new file button
        const newTabBtn = document.createElement('button');
        newTabBtn.className = 'new-file-tab';
        newTabBtn.innerHTML = '<i class="fas fa-plus"></i>';
        newTabBtn.title = 'New file';
        newTabBtn.addEventListener('click', showNewFileModal);
        tabsContainer.appendChild(newTabBtn);
    }
    
    function switchToTab(fileId) {
        if (fileManager.setActiveTab(fileId)) {
            editor.loadCurrentFile();
            renderFileTabs();
            if (preview.isLivePreview) {
                preview.updatePreview();
            }
            
            // Update file explorer active states
            if (window.fileExplorer && window.fileExplorer.updateActiveStates) {
                window.fileExplorer.updateActiveStates();
            }
        }
    }
    
    function switchToFile(index) {
        if (fileManager.setCurrentFileIndex(index)) {
            editor.loadCurrentFile();
            renderFileTabs();
            if (preview.isLivePreview) {
                preview.updatePreview();
            }
            
            // Update file explorer active states
            if (window.fileExplorer && window.fileExplorer.updateActiveStates) {
                window.fileExplorer.updateActiveStates();
            }
        }
    }
    
    // Global functions for onclick handlers
    window.closeTab = function(fileId) {
        if (fileManager.closeTab(fileId)) {
            // If there are still open tabs, load the active one
            if (fileManager.openTabs.length > 0) {
                editor.loadCurrentFile();
            } else {
                // No tabs open, clear the editor
                editor.clearEditor();
            }
            renderFileTabs();
            preview.updatePreview();
            showStatusMessage('Tab closed');
            
            // Update file explorer active states
            if (window.fileExplorer && window.fileExplorer.updateActiveStates) {
                window.fileExplorer.updateActiveStates();
            }
        }
    };
    
    // Keep the old closeFile function for actual file deletion (used by file explorer)
    window.closeFile = function(fileId) {
        if (fileManager.deleteFile(fileId)) {
            editor.loadCurrentFile();
            renderFileTabs();
            preview.updatePreview();
            showStatusMessage('File deleted');
            
            // Update file explorer
            if (window.fileExplorer && window.fileExplorer.renderFileTree) {
                window.fileExplorer.renderFileTree();
            }
        }
    };
    
    window.switchToFile = switchToFile;
    window.switchToTab = switchToTab;
    
    // Tab context menu functionality
    function showTabContextMenu(event, fileId) {
        // Remove any existing tab context menu
        const existingMenu = document.getElementById('tab-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        // Hide file explorer context menu to prevent conflicts
        const fileContextMenu = document.getElementById('file-context-menu');
        if (fileContextMenu) {
            fileContextMenu.classList.remove('show');
        }
        
        // Create context menu with unique class to avoid conflicts
        const contextMenu = document.createElement('div');
        contextMenu.id = 'tab-context-menu';
        contextMenu.className = 'tab-context-menu show'; // Add show class for visibility
        contextMenu.style.left = `${event.clientX}px`;
        contextMenu.style.top = `${event.clientY}px`;
        
        const openTabFiles = fileManager.getOpenTabFiles();
        const currentTabIndex = fileManager.openTabs.indexOf(fileId);
        
        contextMenu.innerHTML = `
            <div class="tab-context-menu-item" data-action="close">
                <i class="fas fa-times"></i> Close Tab
            </div>
            <div class="tab-context-menu-item" data-action="close-others" ${openTabFiles.length <= 1 ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                <i class="fas fa-times-circle"></i> Close Others
            </div>
            <div class="tab-context-menu-item" data-action="close-to-right" ${currentTabIndex >= openTabFiles.length - 1 ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                <i class="fas fa-arrow-right"></i> Close to Right
            </div>
            <div class="tab-context-menu-separator"></div>
            <div class="tab-context-menu-item" data-action="close-all">
                <i class="fas fa-times-circle"></i> Close All
            </div>
        `;
        
        // Add event listeners
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.tab-context-menu-item')?.dataset.action;
            if (action) {
                handleTabContextAction(action, fileId);
                contextMenu.remove();
            }
        });
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        document.body.appendChild(contextMenu);
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 50);
    }
    
    function handleTabContextAction(action, fileId) {
        switch (action) {
            case 'close':
                window.closeTab(fileId);
                break;
            case 'close-others':
                fileManager.closeOtherTabs(fileId);
                editor.loadCurrentFile();
                renderFileTabs();
                preview.updatePreview();
                showStatusMessage('Other tabs closed');
                break;
            case 'close-to-right':
                fileManager.closeTabsToRight(fileId);
                editor.loadCurrentFile();
                renderFileTabs();
                preview.updatePreview();
                showStatusMessage('Tabs to right closed');
                break;
            case 'close-all':
                fileManager.closeAllTabs();
                editor.clearEditor();
                renderFileTabs();
                preview.updatePreview();
                showStatusMessage('All tabs closed');
                break;
        }
        
        // Update file explorer active states
        if (window.fileExplorer && window.fileExplorer.updateActiveStates) {
            window.fileExplorer.updateActiveStates();
        }
    }
    
    function showStatusMessage(message) {
        // Create or update status message
        let statusEl = document.getElementById('status-message');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'status-message';
            statusEl.className = 'status-message';
            document.body.appendChild(statusEl);
        }
        
        statusEl.textContent = message;
        statusEl.style.display = 'block';
        
        // Clear any existing timeout
        if (window.statusTimeout) {
            clearTimeout(window.statusTimeout);
        }
        
        // Hide after 3 seconds
        window.statusTimeout = setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
    
    // ============================================
    // WELCOME SCREEN FUNCTIONALITY
    // ============================================
    
    function updateViewState(showWelcome = false) {
        const welcomeScreen = document.getElementById('welcome-screen');
        const editor = document.getElementById('editor');
        const previewFrame = document.getElementById('preview-frame');
        
        if (showWelcome) {
            // Show welcome screen, hide editor
            welcomeScreen.className = 'welcome-screen active-view fade-in';
            editor.className = 'hidden-view';
            previewFrame.className = 'hidden-view';
            
            // Update welcome screen content
            updateWelcomeScreen();
        } else {
            // Hide welcome screen, show editor based on current view mode
            welcomeScreen.className = 'welcome-screen hidden-view';
            
            // Restore editor/preview view state
            const editorToggle = document.getElementById('editor-toggle');
            const previewToggle = document.getElementById('preview-toggle');
            
            if (editorToggle.classList.contains('active')) {
                editor.className = 'active-view';
                previewFrame.className = 'hidden-view';
            } else if (previewToggle.classList.contains('active')) {
                editor.className = 'hidden-view';
                previewFrame.className = 'active-view';
            }
        }
    }
    
    function updateWelcomeScreen() {
        // Update recent files section
        const recentSection = document.getElementById('welcome-recent-section');
        const recentContainer = document.getElementById('welcome-recent-files');
        
        const recentFiles = fileManager.getRecentFiles();
        
        if (recentFiles.length > 0) {
            recentSection.style.display = 'block';
            recentContainer.innerHTML = '';
            
            // Show up to 6 recent files
            recentFiles.slice(0, 6).forEach(recentFile => {
                const file = fileManager.files.find(f => f.id === recentFile.id);
                const fileName = file ? file.name : recentFile.name;
                const icon = getFileIcon(fileName);
                const timeAgo = getTimeAgo(recentFile.timestamp);
                
                const recentBtn = document.createElement('button');
                recentBtn.className = 'recent-file-btn';
                recentBtn.innerHTML = `
                    <i class="${icon}"></i>
                    <div class="file-info">
                        <span class="file-name" title="${fileName}">${fileName}</span>
                        <span class="file-time">${timeAgo}</span>
                    </div>
                `;
                
                recentBtn.addEventListener('click', () => {
                    if (fileManager.setCurrentFileById(recentFile.id)) {
                        fileManager.openFileInTab(recentFile.id);
                        editor.loadCurrentFile();
                        renderFileTabs();
                        if (preview.isLivePreview) {
                            preview.updatePreview();
                        }
                    }
                });
                
                recentContainer.appendChild(recentBtn);
            });
        } else {
            recentSection.style.display = 'none';
        }
    }
    
    function getFileIcon(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        switch (ext) {
            case 'html': return 'fab fa-html5';
            case 'css': return 'fab fa-css3-alt';
            case 'js': return 'fab fa-js-square';
            case 'json': return 'fas fa-brackets-curly';
            case 'md': return 'fab fa-markdown';
            case 'txt': return 'fas fa-file-text';
            case 'py': return 'fab fa-python';
            default: return 'fas fa-file';
        }
    }
    
    function getTimeAgo(timestamp) {
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
    
    function setupWelcomeScreenListeners() {
        // New file button
        const newFileBtn = document.getElementById('welcome-new-file');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => {
                showNewFileModal();
            });
        }
        
        // New folder button
        const newFolderBtn = document.getElementById('welcome-new-folder');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => {
                if (fileExplorerManager.showNewFolderModal) {
                    fileExplorerManager.showNewFolderModal();
                }
            });
        }
        
        // File explorer button
        const fileExplorerBtn = document.getElementById('welcome-file-explorer');
        if (fileExplorerBtn) {
            fileExplorerBtn.addEventListener('click', () => {
                fileExplorerManager.showSidebar();
            });
        }
    }
    
    // Initialize welcome screen listeners
    setupWelcomeScreenListeners();
});
