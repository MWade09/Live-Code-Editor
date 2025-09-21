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
import { TerminalManager } from './modules/TerminalManager.js';
import { VersionControlManager } from './modules/VersionControlManager.js';

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
    const versionControl = new VersionControlManager(projectSync, fileManager);
    const terminalManager = new TerminalManager(projectSync);
    
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
        projectSync,
        versionControl,
        terminalManager
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

        // Initialize terminal dock and restore visibility
        try {
            initTerminalPanel();
            const toggle = document.getElementById('terminal-toggle-btn');
            if (toggle) toggle.addEventListener('click', toggleTerminalPanel);
            const wasVisible = localStorage.getItem('terminalVisible') === '1';
            if (wasVisible) {
                const panel = document.getElementById('terminal-panel');
                if (panel) panel.style.display = 'block';
                const btn = document.getElementById('terminal-toggle-btn');
                if (btn) btn.classList.add('active');
            }
        } catch {}

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

                                let lastSavedAt = null;
                                const setSaving = () => { syncBtn.querySelector('span').textContent = 'Saving...'; syncBtn.disabled = true; };
                                const setSynced = () => { syncBtn.querySelector('span').textContent = 'Synced'; syncBtn.disabled = false; lastSavedAt = Date.now(); updateSaveTooltip(); };
                                const setError = () => { syncBtn.querySelector('span').textContent = 'Retry Sync'; syncBtn.disabled = false; };
                                function updateSaveTooltip() {
                                    if (!lastSavedAt) return;
                                    const dt = new Date(lastSavedAt);
                                    syncBtn.title = `Last saved ${dt.toLocaleTimeString()}`;
                                }
                                // Add explicit Save button next to Sync
                                const saveBtn = document.createElement('button');
                                saveBtn.id = 'project-save-btn';
                                saveBtn.className = 'deploy-btn';
                                saveBtn.title = 'Save Project (Ctrl+S)';
                                saveBtn.innerHTML = '<i class="fas fa-save"></i> <span>Save</span>';
                                saveBtn.addEventListener('click', async () => {
                                    setSaving();
                                    const result = await projectSync.saveToWebsite();
                                    if (result.ok) {
                                        setSynced();
                                        showStatusMessage('Saved');
                                        // Clear dirty flags on success
                                        const openFiles = fileManager.getOpenTabFiles();
                                        openFiles.forEach(f => fileManager.clearDirty(f.id));
                                        renderFileTabs();
                                    } else if (result.error === 'Unauthorized' || result.error === 'No project') {
                                        await handleGuestSaveFlow(projectSync);
                                    } else {
                                        setError();
                                        showStatusMessage('Save failed');
                                    }
                                });
                                const doSync = async () => {
                                    setSaving();
                                    const result = await projectSync.saveToWebsite();
                                    if (result.ok) {
                                        setSynced();
                                        showStatusMessage('Synced to website');
                                    } else if (result.conflict) {
                                        syncBtn.querySelector('span').textContent = 'Resolve…';
                                        syncBtn.disabled = false;
                                        showConflictDialog(result.serverContent, async (action) => {
                                            if (action === 'pull') {
                                                const r = await projectSync.pullLatest();
                                                if (r.ok) {
                                                    renderFileTabs();
                                                    setSynced();
                                                    showStatusMessage('Pulled latest');
                                                } else {
                                                    setError();
                                                    showStatusMessage('Pull failed');
                                                }
                                            } else if (action === 'overwrite') {
                                                const r = await projectSync.overwriteSave();
                                                if (r.ok) {
                                                    setSynced();
                                                    showStatusMessage('Overwrote remote');
                                                } else {
                                                    setError();
                                                    showStatusMessage('Overwrite failed');
                                                }
                                            }
                                        });
                                    } else {
                                        setError();
                                        console.warn('Save failed:', result.error);
                                        showStatusMessage('Sync failed');
                                    }
                                };
                                syncBtn.addEventListener('click', doSync);
                                // Source Control button
        controls.insertBefore(saveBtn, themeToggle);
        controls.insertBefore(syncBtn, themeToggle);
                                // Initial sync shortly after load
                                setTimeout(doSync, 500);
                                // Preload commits silently
                                versionControl.listCommits().catch(() => {});
                                // No header branch selector when dock is used

                                // Queued save badge next to Sync button
                                const queuedBadge = document.createElement('span');
                                queuedBadge.id = 'queue-badge';
                                queuedBadge.style.marginLeft = '6px';
                                queuedBadge.style.fontSize = '11px';
                                queuedBadge.style.padding = '2px 6px';
                                queuedBadge.style.borderRadius = '10px';
                                queuedBadge.style.background = 'rgba(255,165,0,0.15)';
                                queuedBadge.style.border = '1px solid rgba(255,165,0,0.35)';
                                queuedBadge.style.display = 'none';
                                const syncBtnEl = document.getElementById('project-sync-btn');
                                if (syncBtnEl) syncBtnEl.appendChild(queuedBadge);
                                const updateBadge = (count) => {
                                  if (!queuedBadge) return;
                                  if (count > 0) {
                                    queuedBadge.textContent = `Queued: ${count}`;
                                    queuedBadge.style.display = 'inline-block';
                                  } else {
                                    queuedBadge.style.display = 'none';
                                  }
                                };
                                document.addEventListener('projectSyncQueueChanged', (ev) => {
                                  updateBadge(ev.detail?.count || 0);
                                });
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
                                    if (syncBtn) syncBtn.querySelector('span').textContent = result.conflict ? 'Resolve…' : 'Retry Sync';
                                    if (result.conflict) {
                                        showConflictDialog(result.serverContent, async (action) => {
                                            if (action === 'pull') {
                                                const r = await projectSync.pullLatest();
                                                if (r.ok) {
                                                    renderFileTabs();
                                                    syncBtn.querySelector('span').textContent = 'Synced';
                                                    lastSavedAt = Date.now();
                                                    updateSaveTooltip();
                                                }
                                            } else if (action === 'overwrite') {
                                                const r = await projectSync.overwriteSave();
                                                if (r.ok) {
                                                    syncBtn.querySelector('span').textContent = 'Synced';
                                                    lastSavedAt = Date.now();
                                                    updateSaveTooltip();
                                                }
                                            }
                                        });
                                    } else if (result.error === 'Unauthorized' || result.error === 'No project') {
                                        await handleGuestSaveFlow(projectSync);
                                    }
                                } else {
                                    if (syncBtn) {
                                        syncBtn.querySelector('span').textContent = 'Synced';
                                        if (typeof lastSavedAt !== 'undefined' && typeof updateSaveTooltip === 'function') {
                                            lastSavedAt = Date.now();
                                            updateSaveTooltip();
                                        }
                                    }
                                    // Clear dirty flag for current file
                                    const current = fileManager.getCurrentFile();
                                    if (current) {
                                        fileManager.clearDirty(current.id);
                                        renderFileTabs();
                                    }
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
        // Init VCS panel container
        initVcsPanel();
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

        // Add Build button to header (kept compact)
        try {
            const controls = document.querySelector('header .controls .view-controls');
            const themeToggle = document.getElementById('theme-toggle');
            if (controls && themeToggle) {
                const buildBtn = document.createElement('button');
                buildBtn.id = 'build-btn';
                buildBtn.className = 'deploy-btn';
                buildBtn.title = 'Build project';
                buildBtn.innerHTML = '<i class="fas fa-hammer"></i>';
                buildBtn.addEventListener('click', async () => {
                    showStatusMessage('Preparing build…');
                    try {
                        const project = window.app.projectSync.currentProject;
                        if (!project) { showStatusMessage('No project'); return; }
                        const res = await fetch(`${window.app.projectSync.websiteAPI}/projects/${project.id}/build-config`, { headers: window.app.projectSync.authHeader || {} });
                        if (res.ok) { await res.json(); }
                        const result = await window.app.projectSync.saveToWebsite();
                        showStatusMessage(result.ok ? 'Build triggered (placeholder)' : 'Build failed to start');
                    } catch (e) { console.warn('Build failed', e); showStatusMessage('Build failed'); }
                });
                controls.insertBefore(buildBtn, themeToggle);
            }
        } catch {}

        // Integrate VCS/Extensions into existing file explorer sidebar and add a persistent icon rail
        initExplorerTabs();
        initSidebarRail();
    }

    function initVcsPanel() {
        if (document.getElementById('vcs-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'vcs-panel';
        panel.style.position = 'fixed';
        panel.style.top = '64px';
        panel.style.right = '16px';
        panel.style.width = '420px';
        panel.style.maxHeight = '70vh';
        panel.style.overflow = 'auto';
        panel.style.background = 'var(--bg-secondary, #1f1f1f)';
        panel.style.border = '1px solid rgba(255,255,255,0.1)';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
        panel.style.display = 'none';
        panel.style.zIndex = '1000';
        panel.innerHTML = `
          <div style="padding:12px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.08)">
            <strong>Source Control</strong>
            <button id="vcs-close-btn" class="btn btn-secondary" style="padding:4px 8px">✕</button>
          </div>
          <div style="padding:12px;">
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
              <label style="font-size:12px; opacity:0.8;">Branch</label>
              <select id="vcs-branch" style="flex:1; padding:6px; background:transparent; color:inherit; border:1px solid rgba(255,255,255,0.1); border-radius:6px;"></select>
              <button id="vcs-new-branch" class="community-btn" title="Create branch"><i class="fas fa-plus"></i></button>
              <button id="vcs-rename-branch" class="community-btn" title="Rename branch"><i class="fas fa-i-cursor"></i></button>
              <button id="vcs-delete-branch" class="community-btn" title="Delete branch"><i class="fas fa-trash"></i></button>
            </div>
            <label style="font-size:12px; opacity:0.8;">Commit message</label>
            <input id="vcs-message" type="text" placeholder="Describe your changes" style="width:100%; margin-top:6px; margin-bottom:8px; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:inherit;" />
            <div style="display:flex; gap:8px; margin-bottom:12px;">
              <button id="vcs-commit-btn" class="deploy-btn"><i class="fas fa-check"></i> Commit</button>
              <button id="vcs-refresh-btn" class="community-btn"><i class="fas fa-sync"></i> Refresh</button>
              <button id="vcs-diff-btn" class="community-btn"><i class="fas fa-file-diff"></i> Diff vs last</button>
              <button id="vcs-amend-btn" class="community-btn" title="Amend last commit"><i class="fas fa-edit"></i> Amend</button>
            </div>
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px;">
              <label style="font-size:12px; opacity:0.8;">Compare</label>
              <select id="vcs-compare-a" class="community-btn" style="padding:6px; background:transparent; border-radius:6px; border:1px solid rgba(255,255,255,0.1);"></select>
              <span style="opacity:.6;">→</span>
              <select id="vcs-compare-b" class="community-btn" style="padding:6px; background:transparent; border-radius:6px; border:1px solid rgba(255,255,255,0.1);"></select>
              <button id="vcs-merge-btn" class="deploy-btn" title="Merge (adopt A into B)"><i class="fas fa-code-merge"></i> Merge</button>
            </div>
            <div id="vcs-status" style="font-size:12px; opacity:0.8; margin-bottom:8px;"></div>
            <div id="vcs-diff" style="font-family:monospace; font-size:12px; white-space:pre-wrap; margin-bottom:12px;"></div>
            <div>
              <div style="font-weight:600; margin-bottom:6px;">Recent commits</div>
              <div id="vcs-commits"></div>
            </div>
          </div>
        `;
        document.body.appendChild(panel);
        document.getElementById('vcs-close-btn').addEventListener('click', toggleVcsPanel);
        document.getElementById('vcs-commit-btn').addEventListener('click', onVcsCommit);
        document.getElementById('vcs-refresh-btn').addEventListener('click', renderVcsCommits);
        document.getElementById('vcs-diff-btn').addEventListener('click', renderVcsDiff);
        document.getElementById('vcs-new-branch').addEventListener('click', async () => {
          const name = prompt('New branch name');
          if (!name) return;
          const status = document.getElementById('vcs-status');
          status.textContent = 'Creating branch...';
          const branchName = name.trim();
          const res = await versionControl.createBranch(branchName);
          if (res.ok) {
            await versionControl.checkoutBranch(branchName);
            // Initial commit on the new branch
            await versionControl.createCommit('Initial commit on ' + branchName, branchName);
            // Refresh both VCS and header branch lists
            await renderVcsBranches();
            const headerSelect = document.getElementById('header-branch-select');
            if (headerSelect) {
              const branches = await versionControl.listBranches();
              const names = ['main', ...branches.map(b => b.name).filter(n => n !== 'main')];
              headerSelect.innerHTML = names.map(n => `<option value="${n}">${n}</option>`).join('');
              headerSelect.value = branchName;
            }
            await renderVcsCommits();
            status.textContent = 'Branch created';
          } else {
            status.textContent = 'Failed to create branch';
          }
        });
        document.getElementById('vcs-rename-branch').addEventListener('click', async () => {
          const current = versionControl.cache.currentBranch || 'main';
          const to = prompt(`Rename branch "${current}" to:`);
          if (!to) return;
          const res = await versionControl.renameBranch(current, to.trim());
          if (res.ok) {
            await renderVcsBranches();
            const headerSelect = document.getElementById('header-branch-select');
            if (headerSelect) {
              const branches = await versionControl.listBranches();
              const names = ['main', ...branches.map(b => b.name).filter(n => n !== 'main')];
              headerSelect.innerHTML = names.map(n => `<option value="${n}">${n}</option>`).join('');
              headerSelect.value = to.trim();
            }
            await versionControl.checkoutBranch(to.trim());
            renderVcsCommits();
            showStatusMessage('Branch renamed');
          } else {
            showStatusMessage('Rename failed');
          }
        });
        document.getElementById('vcs-delete-branch').addEventListener('click', async () => {
          const current = versionControl.cache.currentBranch || 'main';
          if (current === 'main') { showStatusMessage('Cannot delete main'); return; }
          if (!confirm(`Delete branch "${current}"?`)) return;
          const res = await versionControl.deleteBranch(current);
          if (res.ok) {
            await renderVcsBranches();
            await versionControl.checkoutBranch('main');
            renderVcsCommits();
            showStatusMessage('Branch deleted');
          } else {
            showStatusMessage('Delete failed');
          }
        });
        document.getElementById('vcs-branch').addEventListener('change', async (e) => {
          const name = e.target.value;
          versionControl.checkoutBranch(name);
          renderVcsCommits();
        });
        // Init compare selectors
        (async () => {
          const a = document.getElementById('vcs-compare-a');
          const b = document.getElementById('vcs-compare-b');
          const branches = await versionControl.listBranches();
          const names = ['main', ...branches.map(x => x.name).filter(n => n !== 'main')];
          if (a) a.innerHTML = names.map(n => `<option value="${n}">${n}</option>`).join('');
          if (b) b.innerHTML = names.map(n => `<option value="${n}">${n}</option>`).join('');
        })();
        document.getElementById('vcs-merge-btn').addEventListener('click', async () => {
          const a = document.getElementById('vcs-compare-a');
          const b = document.getElementById('vcs-compare-b');
          const source = a?.value;
          const target = b?.value;
          if (!source || !target) { showStatusMessage('Select branches'); return; }
          if (source === target) { showStatusMessage('Branches identical'); return; }
          const sourceHead = await versionControl.getLatestCommitForBranch(source);
          if (!sourceHead) { showStatusMessage('No source commit'); return; }
          // Adopt source content into current file and create merge commit on target
          const file = versionControl.fileManager.getCurrentFile();
          if (file) file.content = sourceHead.content || '';
          const switchRes = await versionControl.checkoutBranch(target);
          await projectSync.saveToWebsite();
          const msg = `Merge ${source} -> ${target}: ${sourceHead.message || ''}`.slice(0, 120);
          const r = await versionControl.createCommit(msg, target);
          showStatusMessage(r.ok ? 'Merged' : 'Merge failed');
          renderVcsCommits();
        });
        document.getElementById('vcs-amend-btn').addEventListener('click', async () => {
          const head = (versionControl.cache.commits || [])[0];
          if (!head) { showStatusMessage('No commits to amend'); return; }
          const newMsg = prompt('New commit message', head.message || '');
          if (newMsg == null) return;
          const res = await versionControl.amendLastCommit(newMsg.trim());
          showStatusMessage(res.ok ? 'Amended' : 'Amend failed');
          renderVcsCommits();
        });
        // Close on outside click
        document.addEventListener('click', (e) => {
          const p = document.getElementById('vcs-panel');
          const btn = document.getElementById('source-control-btn');
          if (!p || !btn) return;
          if (p.style.display === 'none') return;
          if (!p.contains(e.target) && e.target !== btn) p.style.display = 'none';
        });
    }

    function initExplorerTabs() {
        const sidebar = document.getElementById('file-explorer-sidebar');
        if (!sidebar) return;
        if (document.getElementById('explorer-tabs')) return;
        const header = sidebar.querySelector('.file-explorer-header');
        if (!header) return;
        const tabs = document.createElement('div');
        tabs.id = 'explorer-tabs';
        tabs.style.display = 'flex';
        tabs.style.gap = '6px';
        tabs.style.marginTop = '6px';
        tabs.innerHTML = `
          <button class="explorer-btn" data-explorer-tab="files" title="Files"><i class="fas fa-folder"></i></button>
          <button class="explorer-btn" data-explorer-tab="vcs" title="Source Control"><i class="fas fa-code-branch"></i></button>
          <button class="explorer-btn" data-explorer-tab="extensions" title="Extensions"><i class="fas fa-plug"></i></button>
        `;
        header.appendChild(tabs);
        // Create tab content containers
        const contentHost = sidebar.querySelector('.file-explorer-content');
        if (!contentHost) return;
        const vcsHost = document.createElement('div');
        vcsHost.id = 'explorer-vcs';
        vcsHost.style.display = 'none';
        vcsHost.innerHTML = `
           <div style="display:flex; gap:6px; margin-bottom:8px;">
             <button class="deploy-btn" id="explorer-commit" style="background:linear-gradient(135deg,#1e40af,#2563eb)">Commit</button>
             <button class="community-btn" id="explorer-diff" style="border:1px solid rgba(30,58,138,0.35)">Diff</button>
             <button class="community-btn" id="explorer-refresh-commits" style="border:1px solid rgba(30,58,138,0.35)">Refresh</button>
           </div>
           <div id="explorer-commits" style="font-size:12px"></div>
        `;
        contentHost.parentNode.insertBefore(vcsHost, contentHost.nextSibling);
        const extHost = document.createElement('div');
        extHost.id = 'explorer-extensions';
        extHost.style.display = 'none';
        extHost.innerHTML = `<div style="font-size:12px; opacity:.8; color:#bfdbfe">Extensions (coming soon)</div>`;
        contentHost.parentNode.insertBefore(extHost, vcsHost.nextSibling);
        // Tab switch logic
        tabs.querySelectorAll('button[data-explorer-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-explorer-tab');
                contentHost.style.display = (tab === 'files') ? 'block' : 'none';
                vcsHost.style.display = (tab === 'vcs') ? 'block' : 'none';
                extHost.style.display = (tab === 'extensions') ? 'block' : 'none';
                if (tab === 'vcs') {
                  // lazy render commits
                  renderVcsCommitsInto(vcsHost.querySelector('#explorer-commits'));
                }
            });
        });
        // Hook VCS buttons
        vcsHost.querySelector('#explorer-diff').addEventListener('click', renderVcsDiff);
        vcsHost.querySelector('#explorer-refresh-commits').addEventListener('click', () => renderVcsCommitsInto(vcsHost.querySelector('#explorer-commits')));
        vcsHost.querySelector('#explorer-commit').addEventListener('click', () => {
          const p = document.getElementById('vcs-panel');
          if (!p || p.style.display === 'none') toggleVcsPanel();
          setTimeout(() => document.getElementById('vcs-message')?.focus(), 0);
        });
    }

    async function renderVcsCommitsInto(container) {
        if (!container) return;
        container.textContent = 'Loading...';
        try {
          const commits = await window.app.versionControl.listCommits();
          if (!commits.length) { container.textContent = 'No commits yet'; return; }
          container.innerHTML = commits.map(c => `<div class="dropdown-item"><div style="display:flex; justify-content:space-between; gap:8px; align-items:center;"><div style="flex:1 1 auto; min-width:0;"><strong>${escapeHtml(c.message || '')}</strong><div style="opacity:.7; font-size:12px;">${new Date(c.created_at).toLocaleString()} • ${c.branch || 'main'}</div></div></div></div>`).join('');
        } catch {
          container.textContent = 'Failed to load commits';
        }
    }

    function initSidebarRail() {
        const container = document.querySelector('.editor-container');
        if (!container) return;
        const existing = document.getElementById('sidebar-rail');
        if (existing) {
            // Ensure it's part of the layout, not overlay
            if (existing.parentElement !== container) {
                container.insertBefore(existing, container.firstChild);
            }
            existing.style.position = '';
            existing.style.left = '';
            existing.style.top = '';
            existing.style.bottom = '';
            existing.style.width = '';
            existing.style.zIndex = '';
            existing.style.display = 'flex';
            existing.style.flexDirection = 'column';
            existing.style.alignItems = 'center';
            existing.style.gap = '10px';
            existing.style.padding = '10px 6px';
            existing.style.background = '#0b1220';
            existing.style.borderRight = '1px solid rgba(30,58,138,0.45)';
            existing.style.flex = '0 0 44px';
            existing.style.height = '100%';
            return;
        }
        const rail = document.createElement('div');
        rail.id = 'sidebar-rail';
        rail.style.display = 'flex';
        rail.style.flexDirection = 'column';
        rail.style.alignItems = 'center';
        rail.style.gap = '10px';
        rail.style.padding = '10px 6px';
        rail.style.background = '#0b1220';
        rail.style.borderRight = '1px solid rgba(30,58,138,0.45)';
        rail.style.flex = '0 0 44px';
        rail.style.height = '100%';
        rail.innerHTML = `
          <button class="community-btn" data-rail="files" title="Files" style="width:32px; height:32px;"><i class="fas fa-folder"></i></button>
          <button class="community-btn" data-rail="vcs" title="Source Control" style="width:32px; height:32px;"><i class="fas fa-code-branch"></i></button>
          <button class="community-btn" data-rail="extensions" title="Extensions" style="width:32px; height:32px;"><i class="fas fa-plug"></i></button>
        `;
        // Place rail at the start of editor-container to participate in flex layout
        container.insertBefore(rail, container.firstChild);
        rail.querySelectorAll('button[data-rail]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-rail');
                const sidebar = document.getElementById('file-explorer-sidebar');
                if (sidebar && sidebar.style.display === 'none') {
                    document.getElementById('file-explorer-toggle')?.click();
                }
                const headerTabs = document.getElementById('explorer-tabs');
                if (headerTabs) {
                    const tbtn = headerTabs.querySelector(`button[data-explorer-tab="${tab}"]`);
                    if (tbtn) tbtn.click();
                }
            });
        });
    }

    // Make left file explorer resizable by inserting a resizer between it and left-pane
    (function initLeftSidebarResizer(){
        try {
            const sidebar = document.getElementById('file-explorer-sidebar');
            const leftPane = document.querySelector('.left-pane');
            const container = document.querySelector('.editor-container');
            if (!sidebar || !leftPane || !container) return;
            if (document.getElementById('left-sidebar-resizer')) return;
            const resizer = document.createElement('div');
            resizer.id = 'left-sidebar-resizer';
            resizer.className = 'resizer';
            // Insert between sidebar and left-pane
            container.insertBefore(resizer, leftPane);
            let startX = 0, startWidth = 0, isDragging = false;
            const minW = 200, maxW = 500;
            resizer.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startWidth = sidebar.getBoundingClientRect().width;
                document.body.style.cursor = 'col-resize';
                e.preventDefault();
            });
            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                let w = Math.max(minW, Math.min(maxW, startWidth + dx));
                sidebar.style.display = 'flex';
                sidebar.style.width = `${w}px`;
                localStorage.setItem('sidebarWidthPx', String(w));
            });
            window.addEventListener('mouseup', () => {
                if (isDragging) { isDragging = false; document.body.style.cursor = ''; }
            });
            // restore width if visible
            const saved = parseInt(localStorage.getItem('sidebarWidthPx') || '0', 10);
            if (!Number.isNaN(saved) && saved > 0) sidebar.style.width = `${saved}px`;
        } catch {}
    })();

    function initControlDock() {
        if (document.getElementById('control-dock')) return;
        const dock = document.createElement('div');
        dock.id = 'control-dock';
        dock.style.position = 'fixed';
        dock.style.left = '0';
        dock.style.top = '64px';
        dock.style.bottom = '0';
        dock.style.width = '280px';
        dock.style.background = '#0b1220';
        dock.style.borderRight = '1px solid rgba(30,58,138,0.45)';
        dock.style.display = 'none';
        dock.style.zIndex = '1000';
        dock.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; border-bottom:1px solid rgba(30,58,138,0.35)">
            <strong style="color:#93c5fd">Explorer</strong>
            <button id="dock-close" class="btn btn-secondary" style="padding:4px 8px">✕</button>
          </div>
          <div style="display:flex; gap:6px; padding:8px; border-bottom:1px solid rgba(30,58,138,0.35)">
            <button class="community-btn" data-dock-tab="files"><i class="fas fa-folder"></i></button>
            <button class="community-btn" data-dock-tab="vcs"><i class="fas fa-code-branch"></i></button>
            <button class="community-btn" data-dock-tab="extensions"><i class="fas fa-plug"></i></button>
          </div>
          <div id="dock-content" style="height: calc(100% - 86px); overflow:auto;">
            <div data-tab="files" style="display:none; padding:10px;">
              <div style="font-size:12px; opacity:.8; margin-bottom:6px; color:#bfdbfe">File System</div>
              <div id="dock-file-explorer"></div>
            </div>
            <div data-tab="vcs" style="display:none; padding:10px;">
              <div style="font-size:12px; opacity:.8; margin-bottom:6px; color:#bfdbfe">Source Control</div>
              <div style="display:flex; gap:6px; margin-bottom:8px;">
                <button class="deploy-btn" id="dock-commit" style="background:linear-gradient(135deg,#1e40af,#2563eb)">Commit</button>
                <button class="community-btn" id="dock-diff" style="border:1px solid rgba(30,58,138,0.35)">Diff</button>
                <button class="community-btn" id="dock-refresh-commits" style="border:1px solid rgba(30,58,138,0.35)">Refresh</button>
              </div>
              <div id="dock-commits" style="font-size:12px"></div>
            </div>
            <div data-tab="extensions" style="display:none; padding:10px;">
              <div style="font-size:12px; opacity:.8; color:#bfdbfe">Extensions (coming soon)</div>
            </div>
            <div id="dock-empty" style="opacity:.7; font-size:12px; padding:10px; color:#94a3b8">Select a tab above.</div>
          </div>
        `;
        document.body.appendChild(dock);
        document.getElementById('dock-close').addEventListener('click', toggleControlDock);
        dock.querySelectorAll('[data-dock-tab]').forEach(btn => {
          btn.addEventListener('click', () => showDockTab(btn.getAttribute('data-dock-tab')));
        });
        const filesHost = document.getElementById('dock-file-explorer');
        if (filesHost && window.fileExplorer && window.fileExplorer.renderSidebar) {
          try { window.fileExplorer.renderSidebar(filesHost); } catch {}
        }
        document.getElementById('dock-diff').addEventListener('click', () => renderVcsDiff());
        document.getElementById('dock-refresh-commits').addEventListener('click', () => renderVcsCommits());
        document.getElementById('dock-commit').addEventListener('click', () => {
          const p = document.getElementById('vcs-panel');
          if (!p || p.style.display === 'none') toggleVcsPanel();
          setTimeout(() => document.getElementById('vcs-message')?.focus(), 0);
        });
    }

    function toggleControlDock() {
        const dock = document.getElementById('control-dock');
        if (!dock) { initControlDock(); return toggleControlDock(); }
        const show = dock.style.display === 'none';
        dock.style.display = show ? 'block' : 'none';
        if (show) showDockTab('vcs');
    }

    function showDockTab(name) {
        const content = document.getElementById('dock-content');
        if (!content) return;
        const panels = content.querySelectorAll('[data-tab]');
        panels.forEach(p => p.style.display = (p.getAttribute('data-tab') === name ? 'block' : 'none'));
        const empty = document.getElementById('dock-empty');
        if (empty) empty.style.display = 'none';
    }
    function initTerminalPanel() {
        if (document.getElementById('terminal-panel')) return;
        const leftPane = document.querySelector('.left-pane');
        if (!leftPane) return;
        const panel = document.createElement('div');
        panel.id = 'terminal-panel';
        panel.style.display = 'none';
        panel.style.flex = '0 0 240px';
        panel.style.background = '#0b1220';
        panel.style.borderTop = '1px solid rgba(30, 58, 138, 0.5)';
        panel.style.boxShadow = 'inset 0 6px 12px rgba(0,0,0,0.25)';
        panel.innerHTML = `
          <div id="terminal-resizer" style="height:6px; cursor:ns-resize; background:linear-gradient(90deg, rgba(30,58,138,.5), rgba(37,99,235,.5));"></div>
          <div style="padding:8px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(30,58,138,0.35)">
            <strong style="color:#93c5fd">Terminal</strong>
            <div style="display:flex; gap:8px; align-items:center;">
              <input id="terminal-input" placeholder="Type command..." style="width:420px; padding:6px; background:transparent; border:1px solid rgba(30,58,138,0.35); border-radius:6px; color:#cbd5e1;" />
              <button id="terminal-run" class="deploy-btn" style="background:linear-gradient(135deg,#1e40af,#2563eb);"><i class="fas fa-play"></i></button>
              <button id="terminal-expand" class="community-btn" title="Expand" style="border:1px solid rgba(30,58,138,0.35)"><i class="fas fa-up-down"></i></button>
              <button id="terminal-close" class="btn btn-secondary" style="padding:4px 8px">✕</button>
            </div>
          </div>
          <div id="terminal-output" style="padding:10px; font-family:monospace; font-size:12px; overflow:auto; height:180px; color:#dbeafe;"></div>
        `;
        // Insert after content-area within left-pane so it docks like VS Code
        const contentArea = leftPane.querySelector('.content-area');
        if (contentArea && contentArea.nextSibling) {
            leftPane.insertBefore(panel, contentArea.nextSibling);
        } else {
            leftPane.appendChild(panel);
        }
        document.getElementById('terminal-close').addEventListener('click', toggleTerminalPanel);
        document.getElementById('terminal-run').addEventListener('click', onTerminalRun);
        document.getElementById('terminal-input').addEventListener('keydown', (e) => {
          if (e.key === 'Enter') onTerminalRun();
        });
        // restore height/state
        const savedHeight = parseInt(localStorage.getItem('terminalHeightPx') || '240', 10);
        if (!Number.isNaN(savedHeight) && savedHeight > 120) {
          panel.style.flex = `0 0 ${savedHeight}px`;
          const out = document.getElementById('terminal-output');
          if (out) out.style.height = `${Math.max(60, savedHeight - 60)}px`;
        }
        // expand/contract
        const expandBtn = document.getElementById('terminal-expand');
        let expanded = false;
        expandBtn.addEventListener('click', () => {
          expanded = !expanded;
          const target = expanded ? Math.round(window.innerHeight * 0.46) : 240;
          panel.style.flex = `0 0 ${target}px`;
          const out = document.getElementById('terminal-output');
          if (out) out.style.height = `${Math.max(60, target - 60)}px`;
          localStorage.setItem('terminalHeightPx', String(target));
        });
        // resize with drag relative to left-pane bottom
        const resizer = document.getElementById('terminal-resizer');
        let isResizing = false;
        resizer.addEventListener('mousedown', (e) => { isResizing = true; e.preventDefault(); document.body.style.cursor = 'ns-resize'; });
        window.addEventListener('mousemove', (e) => {
          if (!isResizing) return;
          const paneRect = leftPane.getBoundingClientRect();
          const newHeight = Math.max(120, Math.min(Math.round(paneRect.bottom - e.clientY), Math.round(paneRect.height * 0.9)));
          panel.style.flex = `0 0 ${newHeight}px`;
          const out = document.getElementById('terminal-output');
          if (out) out.style.height = `${Math.max(60, newHeight - 60)}px`;
          localStorage.setItem('terminalHeightPx', String(newHeight));
        });
        window.addEventListener('mouseup', () => { if (isResizing) { isResizing = false; document.body.style.cursor = ''; } });
    }

    function toggleTerminalPanel() {
        let panel = document.getElementById('terminal-panel');
        if (!panel) { initTerminalPanel(); panel = document.getElementById('terminal-panel'); }
        if (!panel) return;
        const show = panel.style.display === 'none';
        panel.style.display = show ? 'block' : 'none';
        try { localStorage.setItem('terminalVisible', show ? '1' : '0'); } catch {}
        const btn = document.getElementById('terminal-toggle-btn');
        if (btn) btn.classList.toggle('active', show);
        if (show) setTimeout(() => document.getElementById('terminal-input')?.focus(), 0);
    }

    async function onTerminalRun() {
        const input = document.getElementById('terminal-input');
        const out = document.getElementById('terminal-output');
        const cmd = (input.value || '').trim();
        if (!cmd) return;
        // Echo command
        const line = document.createElement('div');
        line.innerHTML = `<span style="color:#7aa2f7;">$</span> ${escapeHtml(cmd)}`;
        out.appendChild(line);
        out.scrollTop = out.scrollHeight;
        input.value = '';
        // Execute via WebContainer; stream output
        const append = (text) => {
          const span = document.createElement('span');
          span.textContent = text;
          out.appendChild(span);
          out.scrollTop = out.scrollHeight;
        };
        const result = await window.app.terminalManager.runCommand(cmd, { onData: append });
        if (!result.ok) {
          const err = document.createElement('div');
          err.style.color = '#f66';
          err.textContent = `! ${result.error || 'Execution failed'}`;
          out.appendChild(err);
        } else {
          const code = document.createElement('div');
          code.style.opacity = '0.7';
          code.textContent = `Exited with code ${result.code}`;
          out.appendChild(code);
        }
    }

    function toggleVcsPanel() {
        const panel = document.getElementById('vcs-panel');
        if (!panel) return;
        const show = panel.style.display === 'none';
        panel.style.display = show ? 'block' : 'none';
        if (show) {
            renderVcsBranches().then(renderVcsCommits);
            document.getElementById('vcs-message').focus();
        }
    }

    async function renderVcsBranches() {
        const select = document.getElementById('vcs-branch');
        if (!select) return;
        select.innerHTML = '<option>Loading...</option>';
        const branches = await versionControl.listBranches();
        const names = ['main', ...branches.map(b => b.name).filter(n => n !== 'main')];
        select.innerHTML = names.map(n => `<option value="${n}">${n}</option>`).join('');
        // Preselect current branch
        select.value = versionControl.cache.currentBranch || 'main';
    }

    async function onVcsCommit() {
        const status = document.getElementById('vcs-status');
        const input = document.getElementById('vcs-message');
        const message = (input.value || '').trim();
        if (!message) { status.textContent = 'Enter a commit message.'; return; }
        status.textContent = 'Committing...';
        const result = await versionControl.createCommit(message);
        if (result.ok) {
            status.textContent = 'Commit created';
            input.value = '';
            renderVcsCommits();
        } else if (result.error && String(result.error).includes('401')) {
            status.textContent = 'Login required to commit';
        } else if (result.conflict) {
            status.textContent = 'Resolve…';
            try {
                const currentBranch = versionControl.cache.currentBranch || 'main';
                const latest = await versionControl.getLatestCommitForBranch(currentBranch);
                const full = latest && latest.id ? await versionControl.getCommit(latest.id) : null;
                const serverContent = (full && typeof full.content === 'string') ? full.content : '';
                showConflictDialog(serverContent, async (action) => {
                    if (action === 'pull') {
                        const file = versionControl.fileManager.getCurrentFile();
                        if (file) file.content = serverContent;
                        if (typeof versionControl.fileManager.clearAllDirty === 'function') versionControl.fileManager.clearAllDirty();
                        renderVcsDiff();
                        status.textContent = 'Pulled latest';
                    } else if (action === 'overwrite') {
                        // Refresh head so expectedHeadId will match, then retry commit on top
                        await versionControl.listCommits();
                        const retry = await versionControl.createCommit(message);
                        if (retry.ok) {
                            status.textContent = 'Commit created';
                            input.value = '';
                            renderVcsCommits();
                        } else {
                            status.textContent = 'Commit failed';
                        }
                    }
                });
            } catch (e) {
                console.warn('Conflict resolution failed', e);
                status.textContent = 'Commit conflict';
            }
        } else {
            status.textContent = 'Commit failed';
        }
    }

    async function renderVcsCommits() {
        const container = document.getElementById('vcs-commits');
        if (!container) return;
        container.innerHTML = 'Loading...';
        try {
            const commits = await versionControl.listCommits();
            if (!commits.length) { container.innerHTML = '<div style="opacity:.7">No commits yet</div>'; return; }
            container.innerHTML = commits.map(c => `<div class="dropdown-item" data-commit-id="${c.id}">
              <div style="display:flex; justify-content:space-between; gap:8px; align-items:center;">
                <div style="flex:1 1 auto; min-width:0;"><strong>${escapeHtml(c.message || '')}</strong><div style="opacity:.7; font-size:12px;">${new Date(c.created_at).toLocaleString()} • ${c.branch || 'main'}</div></div>
                <div style="flex:0 0 auto; display:flex; gap:6px;">
                  <button class="community-btn" data-action="view" data-id="${c.id}" title="View diff"><i class="fas fa-eye"></i></button>
                  <button class="deploy-btn" data-action="restore" data-id="${c.id}" title="Restore to this commit"><i class="fas fa-undo"></i></button>
                </div>
              </div>
            </div>`).join('');
            container.querySelectorAll('button[data-action="view"]').forEach(btn => {
              btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const commit = await versionControl.getCommit(id);
                if (!commit) return;
                const current = versionControl.fileManager.getCurrentFile()?.content || '';
                const diff = versionControl.computeLineDiff(commit.content || '', current);
                renderDiff(diff);
              });
            });
            container.querySelectorAll('button[data-action="restore"]').forEach(btn => {
              btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (!confirm('Restore to this commit? This will overwrite the current content.')) return;
                const status = document.getElementById('vcs-status');
                status.textContent = 'Restoring...';
                const res = await versionControl.restoreToCommit(id, { autoSync: true, createCommit: true });
                status.textContent = res.ok ? 'Restored and saved' : 'Restore failed';
                if (res.ok) {
                  renderVcsDiff();
                }
              });
            });
        } catch (e) {
            container.innerHTML = '<div style="color:#f66">Failed to load commits</div>';
        }
    }

    async function renderVcsDiff() {
        const commits = await versionControl.listCommits();
        if (!commits.length) { renderDiff([]); return; }
        const latest = await versionControl.getCommit(commits[0].id);
        const current = versionControl.fileManager.getCurrentFile()?.content || '';
        const diff = versionControl.computeLineDiff(latest?.content || '', current);
        renderDiff(diff);
    }

    function renderDiff(diff) {
        const el = document.getElementById('vcs-diff');
        if (!el) return;
        if (!diff || !diff.length) { el.textContent = 'No changes.'; return; }
        const lines = diff.map(d => {
          if (d.type === 'added') return `<div style="background:rgba(46,160,67,.2); padding:2px 6px;">+ ${escapeHtml(d.text)}</div>`;
          if (d.type === 'removed') return `<div style="background:rgba(248,81,73,.2); padding:2px 6px;">- ${escapeHtml(d.text)}</div>`;
          return `<div style="opacity:.7; padding:2px 6px;">  ${escapeHtml(d.text)}</div>`;
        });
        el.innerHTML = lines.join('');
    }

    function escapeHtml(s) {
        return (s || '').replace(/[&<>"']/g, function(c) {
          const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
          return map[c] || c;
        });
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
        // Ctrl+Enter - Commit when VCS panel is open
        if (e.ctrlKey && e.key === 'Enter') {
            const panel = document.getElementById('vcs-panel');
            if (panel && panel.style.display !== 'none') {
                e.preventDefault();
                const btn = document.getElementById('vcs-commit-btn');
                if (btn) btn.click();
            }
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
            const isDirty = typeof fileManager.isDirty === 'function' && fileManager.isDirty(file.id);
            tab.innerHTML = `
                <span class="tab-name">${file.name}${isDirty ? ' •' : ''}</span>
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

    // Simple conflict dialog
    function showConflictDialog(serverContent, callback) {
        // Create modal
        const existing = document.getElementById('conflict-modal');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.id = 'conflict-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal">
            <h3>Sync Conflict</h3>
            <p>The project was updated elsewhere. Choose an action:</p>
            <div class="modal-actions">
              <button id="conflict-pull" class="btn">Pull Latest</button>
              <button id="conflict-overwrite" class="btn btn-danger">Overwrite Remote</button>
              <button id="conflict-cancel" class="btn btn-secondary">Cancel</button>
            </div>
          </div>`;
        document.body.appendChild(modal);
        document.getElementById('conflict-pull').onclick = () => { modal.remove(); callback('pull'); };
        document.getElementById('conflict-overwrite').onclick = () => { modal.remove(); callback('overwrite'); };
        document.getElementById('conflict-cancel').onclick = () => { modal.remove(); };
    }

    // Error dropdown for recent sync errors
    (function initErrorDropdown(){
        const headerControls = document.querySelector('header .controls .view-controls');
        if (!headerControls) return;
        const btn = document.createElement('button');
        btn.id = 'sync-errors-btn';
        btn.className = 'community-btn';
        btn.title = 'Recent Sync Errors';
        btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        const panel = document.createElement('div');
        panel.id = 'sync-errors-panel';
        panel.className = 'dropdown-panel';
        panel.style.display = 'none';
        document.body.appendChild(panel);
        btn.addEventListener('click', () => {
            const log = window.app?.projectSync?.errorLog || [];
            panel.innerHTML = `<div class="dropdown-content">${log.length ? log.map(e => `<div class="dropdown-item">${new Date(e.ts).toLocaleTimeString()} - ${e.message}</div>`).join('') : '<div class="dropdown-item">No recent errors</div>'}</div>`;
            const rect = btn.getBoundingClientRect();
            panel.style.position = 'fixed';
            panel.style.top = `${rect.bottom + 8}px`;
            panel.style.left = `${rect.left - 120}px`;
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        headerControls.insertBefore(btn, headerControls.firstChild);
        document.addEventListener('projectSyncError', () => {
            btn.classList.add('has-error');
            setTimeout(() => btn.classList.remove('has-error'), 1500);
        });
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== btn) {
                panel.style.display = 'none';
            }
        });
    })();

    // Warn before unload when dirty
    window.addEventListener('beforeunload', (e) => {
        const open = fileManager.getOpenTabFiles();
        const hasDirty = open.some(f => fileManager.isDirty && fileManager.isDirty(f.id));
        if (hasDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    
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

    async function handleGuestSaveFlow(projectSync) {
        try {
            // If no websiteAPI is set, try to infer from referrer or fallback
            if (!projectSync.websiteAPI) {
                const origin = document.referrer ? new URL(document.referrer).origin : 'https://ailiveeditor.netlify.app'
                projectSync.websiteAPI = origin.replace(/\/$/, '') + '/api'
            }
            // Create project on website, then redirect to website /editor route with token handled by site
            const res = await fetch(`${projectSync.websiteAPI}/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Untitled Project', content: projectSync.exportProjectContent(), language: 'HTML' }) })
            if (!res.ok) {
                showStatusMessage('Login required to save')
                // Open website login
                const site = projectSync.websiteAPI.replace(/\/api$/, '')
                window.location.href = `${site}/auth/login`
                return
            }
            const data = await res.json()
            const site = projectSync.websiteAPI.replace(/\/api$/, '')
            // Redirect to website editor bridge which will attach token and route back to hosted editor with params
            window.location.href = `${site}/editor?project=${encodeURIComponent(data.id)}&site=${encodeURIComponent(site)}`
        } catch (e) {
            showStatusMessage('Login required to save')
            const site = projectSync.websiteAPI ? projectSync.websiteAPI.replace(/\/api$/, '') : 'https://ailiveeditor.netlify.app'
            window.location.href = `${site}/auth/login`
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
