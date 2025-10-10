/**
 * Chat Panel Integration with AIManager
 * Connects the chat panel UI to use AIManager's advanced features
 * Falls back gracefully if AIManager is not available
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔗 Chat Panel Integration: Starting initialization...');
    
    // Wait for AIManager to be initialized (with timeout)
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    const waitForAIManager = setInterval(() => {
        attempts++;
        
        if (window.aiManager && window.app?.fileManager) {
            clearInterval(waitForAIManager);
            console.log('✅ Chat Panel Integration: AIManager found, enabling advanced features');
            initializeChatPanelIntegration();
        } else if (attempts >= maxAttempts) {
            clearInterval(waitForAIManager);
            console.warn('⚠️ Chat Panel Integration: AIManager not found after timeout, using fallback mode');
            console.log('💬 Chat panel will use built-in functionality without advanced features');
        }
    }, 100);
});

function initializeChatPanelIntegration() {
    console.log('✅ AIManager found, setting up chat panel integration');
    
    const aiManager = window.aiManager;
    const fileManager = window.app?.fileManager;
    
    if (!aiManager) {
        console.error('AIManager not found - integration aborted');
        return;
    }
    
    if (!fileManager) {
        console.error('FileManager not found - integration aborted');
        return;
    }
    
    console.log('✅ AIManager and FileManager ready for integration');
    
    // Setup file context selector for chat panel
    setupChatFileContextSelector();
    
    // Setup project context toggle
    setupChatProjectContextToggle();
    
    // Don't override the send message - let chat-panel.js handle it
    // Instead, expose context building functions for chat-panel.js to use
    exposeHelperFunctions();
    
    console.log('✅ Chat Panel Integration: Advanced features ready');
    console.log('   - File context selector: available');
    console.log('   - Project context toggle: available');
    console.log('   - Helper functions: window.buildChatContext, window.hasAdvancedChatFeatures');
}

/**
 * Setup file context selector for chat panel
 */
function setupChatFileContextSelector() {
    const toggleBtn = document.getElementById('chat-file-context-toggle-btn');
    const selector = document.getElementById('chat-file-context-selector');
    const fileList = document.getElementById('chat-file-context-list');
    const countBadge = document.getElementById('chat-file-context-count');
    
    if (!toggleBtn || !selector) {
        console.warn('Chat file context UI elements not found');
        return;
    }
    
    // Track selected files
    window.chatSelectedFileIds = new Set();
    
    // Toggle selector visibility
    toggleBtn.addEventListener('click', () => {
        if (selector.style.display === 'none') {
            selector.style.display = 'block';
            updateChatFileList();
        } else {
            selector.style.display = 'none';
        }
    });
    
    // Update file list when files change
    if (window.app?.fileManager) {
        const originalSave = window.app.fileManager.saveFilesToStorage;
        window.app.fileManager.saveFilesToStorage = function() {
            originalSave.call(this);
            if (selector.style.display !== 'none') {
                updateChatFileList();
            }
        };
    }
    
    /**
     * Update the file list in the selector
     */
    function updateChatFileList() {
        if (!fileList || !window.app?.fileManager) return;
        
        const files = window.app.fileManager.files || [];
        fileList.innerHTML = '';
        
        if (files.length === 0) {
            fileList.innerHTML = '<div class="no-files">No files in project</div>';
            return;
        }
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-context-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `chat-file-${file.name}`;
            checkbox.checked = window.chatSelectedFileIds.has(file.name);
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    window.chatSelectedFileIds.add(file.name);
                } else {
                    window.chatSelectedFileIds.delete(file.name);
                }
                updateChatContextSize();
            });
            
            const label = document.createElement('label');
            label.htmlFor = `chat-file-${file.name}`;
            label.textContent = file.name;
            
            const fileSize = document.createElement('span');
            fileSize.className = 'file-size';
            fileSize.textContent = formatFileSize(getFileSize(file.content));
            
            fileItem.appendChild(checkbox);
            fileItem.appendChild(label);
            fileItem.appendChild(fileSize);
            fileList.appendChild(fileItem);
        });
        
        updateChatContextSize();
    }
    
    /**
     * Update context size display
     */
    function updateChatContextSize() {
        const sizeValue = document.getElementById('chat-context-size-value');
        const warning = document.getElementById('chat-context-size-warning');
        const warningText = document.getElementById('chat-context-warning-text');
        
        if (!window.app?.fileManager) return;
        
        let totalSize = 0;
        const files = window.app.fileManager.files || [];
        
        window.chatSelectedFileIds.forEach(fileName => {
            const file = files.find(f => f.name === fileName);
            if (file) {
                totalSize += getFileSize(file.content);
            }
        });
        
        // Update badge count
        if (countBadge) {
            countBadge.textContent = window.chatSelectedFileIds.size;
        }
        
        // Update size display
        if (sizeValue) {
            sizeValue.textContent = formatFileSize(totalSize);
        }
        
        // Show warnings
        if (warning) {
            const maxSize = 100 * 1024; // 100KB
            const warningThreshold = 50 * 1024; // 50KB
            
            if (totalSize >= maxSize) {
                warning.style.display = 'flex';
                warning.style.color = '#dc3545';
                if (warningText) {
                    warningText.textContent = 'Context size exceeds maximum limit!';
                }
            } else if (totalSize >= warningThreshold) {
                warning.style.display = 'flex';
                warning.style.color = '#ffc107';
                if (warningText) {
                    warningText.textContent = 'Context size is approaching the limit.';
                }
            } else {
                warning.style.display = 'none';
            }
        }
    }
    
    function getFileSize(content) {
        return new Blob([content || '']).size;
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

/**
 * Setup project context toggle for chat panel
 */
function setupChatProjectContextToggle() {
    const toggleBtn = document.getElementById('project-context-toggle-btn');
    
    if (!toggleBtn) {
        console.warn('Project context toggle button not found');
        return;
    }
    
    // Track state
    window.chatIncludeProjectContext = false;
    
    toggleBtn.addEventListener('click', () => {
        window.chatIncludeProjectContext = !window.chatIncludeProjectContext;
        
        if (window.chatIncludeProjectContext) {
            toggleBtn.classList.add('active');
            toggleBtn.style.background = 'var(--accent-color)';
            toggleBtn.style.color = 'white';
            console.log('✅ Project context enabled for chat');
        } else {
            toggleBtn.classList.remove('active');
            toggleBtn.style.background = '';
            toggleBtn.style.color = '';
            console.log('❌ Project context disabled for chat');
        }
    });
}

/**
 * Expose helper functions globally for chat-panel.js to use
 */
function exposeHelperFunctions() {
    /**
     * Build context from selected files and project context
     * @param {string} userMessage - The user's message
     * @returns {string} - Enhanced message with context
     */
    window.buildChatContext = function(userMessage) {
        let context = '';
        
        // Add project context if enabled
        if (window.chatIncludeProjectContext && window.aiManager?.projectContextManager) {
        try {
            const projectSummary = window.aiManager.projectContextManager.generateProjectSummary();
            if (projectSummary) {
                context += '\n\nPROJECT CONTEXT:\n' + projectSummary + '\n';
            }
        } catch (e) {
            console.warn('Failed to generate project context:', e);
        }
    }
    
    // Add selected files context
    if (window.chatSelectedFileIds && window.chatSelectedFileIds.size > 0 && window.app?.fileManager) {
        context += '\n\nSELECTED FILES CONTEXT:\n';
        const files = window.app.fileManager.files || [];
        
        window.chatSelectedFileIds.forEach(fileName => {
            const file = files.find(f => f.name === fileName);
            if (file) {
                context += `\n=== File: ${file.name} ===\n`;
                context += file.content + '\n';
            }
        });
    }
    
    // Return enhanced message
    if (context) {
        return context + '\n\nUSER REQUEST:\n' + userMessage;
    }
    
        return userMessage;
    };

    /**
     * Check if advanced features are available
     * @returns {boolean}
     */
    window.hasAdvancedChatFeatures = function() {
        return !!(window.aiManager && window.chatSelectedFileIds !== undefined);
    };
}
