/**
 * Main Application File - Coordinates all modules and handles initialization
 */
import { FileManager } from './modules/FileManager.js';
import { Editor } from './modules/Editor-New.js';
import { Preview } from './modules/Preview.js';
import { Resizer } from './modules/Resizer.js';
import { ThemeManager } from './modules/ThemeManager.js';
import { DeployManager } from './modules/DeployManager.js';
import { AIManager } from './modules/AIManager.js';

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
    
    // Global app state
    window.app = {
        fileManager,
        editor,
        preview,
        resizer,
        themeManager,
        deployManager,
        aiManager,
        showModal,
        hideModal
    };
    
    // Initialize the application
    initializeApp();
    
    function initializeApp() {
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
        // Ctrl+S - Save (we auto-save but this provides user feedback)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            // Files are auto-saved, just show a brief confirmation
            showStatusMessage('File saved');
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
    
    // Note: togglePreview function moved to chat-panel.js
    // function togglePreview() { ... }
    
    function renderFileTabs() {
        const tabsContainer = document.getElementById('file-tabs');
        tabsContainer.innerHTML = '';
        
        fileManager.files.forEach((file, index) => {
            const tab = document.createElement('div');
            tab.className = `file-tab ${index === fileManager.currentFileIndex ? 'active' : ''}`;
            tab.innerHTML = `
                <span class="tab-name">${file.name}</span>
                <button class="close-tab" onclick="closeFile('${file.id}')" title="Close file">×</button>
            `;
            
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-tab')) return;
                switchToFile(index);
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
    
    function switchToFile(index) {
        if (fileManager.setCurrentFileIndex(index)) {
            editor.loadCurrentFile();
            renderFileTabs();
            if (preview.isLivePreview) {
                preview.updatePreview();
            }
        }
    }
    
    // Global functions for onclick handlers
    window.closeFile = function(fileId) {
        if (fileManager.deleteFile(fileId)) {
            editor.loadCurrentFile();
            renderFileTabs();
            preview.updatePreview();
            showStatusMessage('File closed');
        }
    };
    
    window.switchToFile = switchToFile;
    
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
});
