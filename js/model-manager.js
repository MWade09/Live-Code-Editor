document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing model manager...');
    
    // Model Management
    const chatManageModelsBtn = document.getElementById('chat-manage-models-btn');
    
    // Create model manager modal if it doesn't exist
    let modelManagerModal = document.getElementById('chatModelManagerModal');
    
    if (!modelManagerModal) {
        modelManagerModal = document.createElement('div');
        modelManagerModal.className = 'file-modal';
        modelManagerModal.id = 'chatModelManagerModal';
        modelManagerModal.innerHTML = `
            <div class="modal-content">
                <h3>Manage AI Models</h3>
                <p>Add or remove custom OpenRouter models.</p>
                
                <div id="chat-custom-models-list" class="custom-models-list">
                    <!-- Custom models will be listed here dynamically -->
                </div>
                
                <div class="form-group">
                    <label for="chat-new-model-id">Model ID:</label>
                    <input type="text" id="chat-new-model-id" placeholder="e.g., anthropic/claude-3-opus">
                </div>
                
                <div class="form-group">
                    <label for="chat-new-model-name">Display Name:</label>
                    <input type="text" id="chat-new-model-name" placeholder="e.g., Claude 3 Opus">
                </div>
                
                <div class="modal-buttons">
                    <button id="chat-add-model-btn">Add Model</button>
                    <button id="chat-close-model-manager-btn">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modelManagerModal);
        console.log('Model manager modal created');
    }

    // After a short delay, to ensure the DOM elements are present
    setTimeout(() => {
        setupModelManagerEvents();
    }, 100);
    
    function setupModelManagerEvents() {
        const chatCustomModelsList = document.getElementById('chat-custom-models-list');
        const chatNewModelId = document.getElementById('chat-new-model-id');
        const chatNewModelName = document.getElementById('chat-new-model-name');
        const chatAddModelBtn = document.getElementById('chat-add-model-btn');
        const chatCloseModelManagerBtn = document.getElementById('chat-close-model-manager-btn');
        
        console.log('Model manager elements found:', {
            chatCustomModelsList: !!chatCustomModelsList,
            chatNewModelId: !!chatNewModelId,
            chatNewModelName: !!chatNewModelName,
            chatAddModelBtn: !!chatAddModelBtn,
            chatCloseModelManagerBtn: !!chatCloseModelManagerBtn
        });
        
        // Initialize the custom models list
        updateCustomModelsList();
        
        // Show model manager
        if (chatManageModelsBtn) {
            // Remove any existing listeners first
            chatManageModelsBtn.removeEventListener('click', showModalHandler);
            chatManageModelsBtn.addEventListener('click', showModalHandler);
        } else {
            console.error('Model manager button not found');
        }
        
        // Close model manager
        if (chatCloseModelManagerBtn) {
            // Remove any existing listeners first
            chatCloseModelManagerBtn.removeEventListener('click', hideModalHandler);
            chatCloseModelManagerBtn.addEventListener('click', hideModalHandler);
        } else {
            console.error('Close model manager button not found');
        }
        
        // Add new model
        if (chatAddModelBtn) {
            // Remove any existing listeners first
            chatAddModelBtn.removeEventListener('click', addModelHandler);
            chatAddModelBtn.addEventListener('click', addModelHandler);
        } else {
            console.error('Add model button not found');
        }
        
        function showModalHandler() {
            console.log('Opening model manager modal');
            updateCustomModelsList();
            showModal(modelManagerModal);
        }
        
        function hideModalHandler() {
            console.log('Closing model manager modal');
            hideModal(modelManagerModal);
        }
        
        function addModelHandler() {
            console.log('Add model button clicked');
            if (!chatNewModelId || !chatNewModelName) {
                console.error('Model ID or name input elements not found');
                return;
            }
            
            const modelId = chatNewModelId.value.trim();
            const modelName = chatNewModelName.value.trim();
            
            if (!modelId || !modelName) {
                alert('Please enter both model ID and display name.');
                return;
            }
            
            // Get existing custom models
            const customModels = JSON.parse(localStorage.getItem('custom_models') || '[]');
            
            // Check if model already exists
            if (customModels.some(m => m.id === modelId)) {
                alert('A model with this ID already exists.');
                return;
            }
            
            // Add new model
            customModels.push({ id: modelId, name: modelName });
            
            // Save to localStorage
            localStorage.setItem('custom_models', JSON.stringify(customModels));
            console.log('Added new model:', modelId, modelName);
            
            // Update UI
            updateCustomModelsList();
            
            // Update model dropdown
            if (window.chatPanel && window.chatPanel.loadCustomModels) {
                window.chatPanel.loadCustomModels();
            } else {
                console.error('chatPanel.loadCustomModels is not available');
            }
            
            // Clear inputs
            chatNewModelId.value = '';
            chatNewModelName.value = '';
        }
        
        // Update the list of custom models
        function updateCustomModelsList() {
            if (!chatCustomModelsList) {
                console.error('Custom models list element not found');
                return;
            }
            
            chatCustomModelsList.innerHTML = '';
            
            const customModels = JSON.parse(localStorage.getItem('custom_models') || '[]');
            console.log('Current custom models:', customModels);
            
            if (customModels.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.className = 'empty-list-message';
                emptyMessage.textContent = 'No custom models added yet.';
                chatCustomModelsList.appendChild(emptyMessage);
                return;
            }
            
            customModels.forEach(model => {
                const modelItem = document.createElement('div');
                modelItem.className = 'model-item';
                
                const modelInfo = document.createElement('div');
                modelInfo.className = 'model-info';
                
                const modelNameEl = document.createElement('div');
                modelNameEl.className = 'model-name';
                modelNameEl.textContent = model.name;
                
                const modelIdEl = document.createElement('div');
                modelIdEl.className = 'model-id';
                modelIdEl.textContent = model.id;
                
                modelInfo.appendChild(modelNameEl);
                modelInfo.appendChild(modelIdEl);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'model-delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.dataset.modelId = model.id;
                deleteBtn.addEventListener('click', function() {
                    deleteCustomModel(model.id);
                });
                
                modelItem.appendChild(modelInfo);
                modelItem.appendChild(deleteBtn);
                
                chatCustomModelsList.appendChild(modelItem);
            });
        }
        
        // Delete a custom model
        function deleteCustomModel(modelId) {
            if (confirm('Are you sure you want to delete this model?')) {
                // Get existing custom models
                let customModels = JSON.parse(localStorage.getItem('custom_models') || '[]');
                
                // Remove the model
                customModels = customModels.filter(m => m.id !== modelId);
                
                // Save to localStorage
                localStorage.setItem('custom_models', JSON.stringify(customModels));
                console.log('Deleted model:', modelId);
                
                // Update UI
                updateCustomModelsList();
                
                // Update model dropdown
                if (window.chatPanel && window.chatPanel.loadCustomModels) {
                    window.chatPanel.loadCustomModels();
                } else {
                    console.error('chatPanel.loadCustomModels is not available');
                }
            }
        }
    }
    
    // Helper modal functions
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
    
    // Add CSS for model manager
    const style = document.createElement('style');
    style.textContent = `
        #chatModelManagerModal {
            z-index: 1100;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        #chatModelManagerModal.show {
            opacity: 1;
        }
        
        #chatModelManagerModal .modal-content {
            width: 500px;
            max-width: 90%;
            background: #1a1a1a;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        body.light-theme #chatModelManagerModal .modal-content {
            background: #f5f5f5;
        }
        
        #chatModelManagerModal h3 {
            margin-top: 0;
            color: #e0e0e0;
        }
        
        body.light-theme #chatModelManagerModal h3 {
            color: #333;
        }
        
        #chatModelManagerModal p {
            color: #aaa;
            margin-bottom: 15px;
        }
        
        body.light-theme #chatModelManagerModal p {
            color: #666;
        }
        
        .custom-models-list {
            max-height: 200px;
            overflow-y: auto;
            margin-bottom: 15px;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 8px;
        }
        
        body.light-theme .custom-models-list {
            border-color: #ddd;
        }
        
        .empty-list-message {
            color: #888;
            text-align: center;
            padding: 10px;
        }
        
        body.light-theme .empty-list-message {
            color: #666;
        }
        
        .model-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #444;
        }
        
        body.light-theme .model-item {
            border-bottom-color: #ddd;
        }
        
        .model-item:last-child {
            border-bottom: none;
        }
        
        .model-info {
            flex: 1;
        }
        
        .model-name {
            font-weight: 500;
            color: #e0e0e0;
        }
        
        body.light-theme .model-name {
            color: #333;
        }
        
        .model-id {
            font-size: 12px;
            color: #999;
        }
        
        body.light-theme .model-id {
            color: #777;
        }
        
        .model-delete-btn {
            background: transparent;
            border: none;
            color: #ff5555;
            cursor: pointer;
            padding: 5px;
        }
        
        .model-delete-btn:hover {
            color: #ff8080;
        }
        
        #chatModelManagerModal .form-group {
            margin-bottom: 15px;
        }
        
        #chatModelManagerModal label {
            display: block;
            margin-bottom: 5px;
            color: #e0e0e0;
        }
        
        body.light-theme #chatModelManagerModal label {
            color: #333;
        }
        
        #chatModelManagerModal input {
            width: 100%;
            padding: 8px 10px;
            border-radius: 4px;
            border: 1px solid #444;
            background: #2a2a2a;
            color: #e0e0e0;
        }
        
        body.light-theme #chatModelManagerModal input {
            border-color: #ddd;
            background: #fff;
            color: #333;
        }
        
        #chatModelManagerModal .modal-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }
        
        #chatModelManagerModal button {
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-weight: 500;
        }
        
        #chat-add-model-btn {
            background: #007bff;
            color: white;
        }
        
        #chat-add-model-btn:hover {
            background: #0069d9;
        }
        
        #chat-close-model-manager-btn {
            background: #555;
            color: #e0e0e0;
        }
        
        body.light-theme #chat-close-model-manager-btn {
            background: #e0e0e0;
            color: #333;
        }
        
        #chat-close-model-manager-btn:hover {
            background: #666;
        }
        
        body.light-theme #chat-close-model-manager-btn:hover {
            background: #d0d0d0;
        }
    `;
    
    document.head.appendChild(style);
});
