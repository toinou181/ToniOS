// ===============================================
// SYSTÈME DE GESTION DES FENÊTRES
// ===============================================

let openWindows = [];
let nextZIndex = 100;
let dragWindow = null;
let dragOffset = { x: 0, y: 0 };

// Ouverture d'applications
function openApplication(appType, fileName = '') {
    // Vérifier si une fenêtre de ce type est déjà ouverte
    const existingWindow = openWindows.find(w => w.appType === appType);
    if (existingWindow && ['calculator', 'properties'].includes(appType)) {
        // Ramener la fenêtre au premier plan
        bringToFront(existingWindow.id);
        return;
    }

    const windowId = 'window_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    let windowHTML = '';
    let windowTitle = '';
    let windowSize = { width: 600, height: 400 };

    switch (appType) {
        case 'calculator':
            windowTitle = 'Calculatrice ToniOS';
            windowSize = { width: 320, height: 480 };
            windowHTML = createCalculatorWindow();
            break;
            
        case 'notepad':
            windowTitle = fileName ? `Bloc-notes - ${fileName}` : 'Nouveau document';
            windowSize = { width: 700, height: 500 };
            windowHTML = createNotepadWindow(fileName);
            break;
            
        case 'chat':
            windowTitle = 'ToniOS Chat & Vocal';
            windowSize = { width: 800, height: 600 };
            windowHTML = createChatWindow();
            break;
            
        case 'discord-chat':
            windowTitle = 'ToniOS Discord Chat';
            windowSize = { width: 1000, height: 700 };
            windowHTML = createDiscordChatWindow();
            break;
            
        case 'filemanager':
            windowTitle = 'Gestionnaire de fichiers';
            windowSize = { width: 900, height: 600 };
            windowHTML = createFileManagerWindow();
            break;
            
        case 'advanced-files':
            windowTitle = 'Gestionnaire de fichiers avancé';
            windowSize = { width: 1200, height: 800 };
            windowHTML = createAdvancedFileManagerWindow();
            break;
            
        case 'session-manager':
            windowTitle = 'Gestionnaire de Sessions';
            windowSize = { width: 1400, height: 900 };
            windowHTML = createSessionManagerWindow();
            break;
            
        case 'properties':
        case 'systemprops':
            windowTitle = 'Propriétés du système';
            windowSize = { width: 600, height: 500 };
            windowHTML = createPropertiesWindow();
            break;
            
        case 'wallpaper':
            windowTitle = 'Personnalisation du bureau';
            windowSize = { width: 500, height: 400 };
            windowHTML = createWallpaperWindow();
            break;
            
        default:
            showNotification('Application non reconnue', 'error');
            return;
    }

    // Créer la fenêtre
    const windowElement = document.createElement('div');
    windowElement.className = 'tonios-window';
    windowElement.id = windowId;
    windowElement.style.width = windowSize.width + 'px';
    windowElement.style.height = windowSize.height + 'px';
    windowElement.style.zIndex = nextZIndex++;
    
    // Position aléatoire mais visible
    const maxX = window.innerWidth - windowSize.width - 50;
    const maxY = window.innerHeight - windowSize.height - 100;
    const x = Math.max(50, Math.floor(Math.random() * maxX));
    const y = Math.max(50, Math.floor(Math.random() * maxY));
    
    windowElement.style.left = x + 'px';
    windowElement.style.top = y + 'px';

    windowElement.innerHTML = `
        <div class="tonios-window-header" onmousedown="startDrag(event, '${windowId}')">
            <div class="tonios-window-title">
                <span class="tonios-window-icon">${getAppIcon(appType)}</span>
                ${windowTitle}
            </div>
            <div class="tonios-window-controls">
                <button onclick="minimizeWindow('${windowId}')" class="tonios-minimize">➖</button>
                <button onclick="maximizeWindow('${windowId}')" class="tonios-maximize">⬜</button>
                <button onclick="closeWindow('${windowId}')" class="tonios-close">❌</button>
            </div>
        </div>
        <div class="tonios-window-content">
            ${windowHTML}
        </div>
    `;

    document.getElementById('toniosDesktop').appendChild(windowElement);

    // Ajouter à la liste des fenêtres ouvertes
    openWindows.push({
        id: windowId,
        appType: appType,
        title: windowTitle,
        fileName: fileName,
        isMinimized: false,
        isMaximized: false,
        originalSize: windowSize,
        originalPosition: { x, y }
    });

    // Mettre à jour la barre des tâches
    updateTaskbar();

    // Focus sur la nouvelle fenêtre
    bringToFront(windowId);

    // Initialize specific applications after window is created
    setTimeout(() => {
        if (appType === 'discord-chat') {
            initializeDiscordChat();
        } else if (appType === 'advanced-files') {
            initializeAdvancedFileManager();
        } else if (appType === 'session-manager') {
            initializeSessionManager();
        }
    }, 100);

    showNotification(`${windowTitle} ouvert`, 'info');
}

function getAppIcon(appType) {
    const icons = {
        calculator: '🧮',
        notepad: '📝',
        chat: '💬',
        'discord-chat': '💬',
        filemanager: '📁',
        'advanced-files': '📁',
        'session-manager': '👥',
        properties: '⚙️',
        wallpaper: '🎨'
    };
    return icons[appType] || '📱';
}

function closeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    if (windowElement) {
        // Animation de fermeture
        windowElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        windowElement.style.transform = 'scale(0.8)';
        windowElement.style.opacity = '0';
        
        setTimeout(() => {
            windowElement.remove();
        }, 300);

        // Retirer de la liste
        openWindows = openWindows.filter(w => w.id !== windowId);
        updateTaskbar();
        
        showNotification('Fenêtre fermée', 'info');
    }
}

function minimizeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    const windowData = openWindows.find(w => w.id === windowId);
    
    if (windowElement && windowData) {
        if (windowData.isMinimized) {
            // Restaurer
            windowElement.style.display = 'block';
            windowElement.style.transform = 'scale(1)';
            windowData.isMinimized = false;
            bringToFront(windowId);
        } else {
            // Minimiser
            windowElement.style.transform = 'scale(0.1)';
            windowElement.style.opacity = '0';
            setTimeout(() => {
                windowElement.style.display = 'none';
                windowElement.style.transform = 'scale(1)';
                windowElement.style.opacity = '1';
            }, 300);
            windowData.isMinimized = true;
        }
        updateTaskbar();
    }
}

function maximizeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    const windowData = openWindows.find(w => w.id === windowId);
    
    if (windowElement && windowData) {
        if (windowData.isMaximized) {
            // Restaurer
            windowElement.style.width = windowData.originalSize.width + 'px';
            windowElement.style.height = windowData.originalSize.height + 'px';
            windowElement.style.left = windowData.originalPosition.x + 'px';
            windowElement.style.top = windowData.originalPosition.y + 'px';
            windowData.isMaximized = false;
        } else {
            // Maximiser
            windowElement.style.width = (window.innerWidth - 20) + 'px';
            windowElement.style.height = (window.innerHeight - 80) + 'px';
            windowElement.style.left = '10px';
            windowElement.style.top = '10px';
            windowData.isMaximized = true;
        }
        updateTaskbar();
    }
}

function bringToFront(windowId) {
    const windowElement = document.getElementById(windowId);
    if (windowElement) {
        windowElement.style.zIndex = nextZIndex++;
        
        // Mettre à jour l'état actif dans la barre des tâches
        document.querySelectorAll('.tonios-taskbar-item').forEach(item => {
            item.classList.remove('active');
        });
        const taskbarItem = document.querySelector(`[data-window-id="${windowId}"]`);
        if (taskbarItem) {
            taskbarItem.classList.add('active');
        }
    }
}

// Système de drag & drop des fenêtres
function startDrag(event, windowId) {
    event.preventDefault();
    dragWindow = windowId;
    const windowElement = document.getElementById(windowId);
    
    if (windowElement) {
        const rect = windowElement.getBoundingClientRect();
        dragOffset.x = event.clientX - rect.left;
        dragOffset.y = event.clientY - rect.top;
        
        bringToFront(windowId);
    }
}

function handleMouseMove(event) {
    if (dragWindow) {
        const windowElement = document.getElementById(dragWindow);
        if (windowElement) {
            const x = event.clientX - dragOffset.x;
            const y = event.clientY - dragOffset.y;
            
            // Limites de l'écran
            const maxX = window.innerWidth - windowElement.offsetWidth;
            const maxY = window.innerHeight - windowElement.offsetHeight;
            
            windowElement.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            windowElement.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        }
    }
}

function handleMouseUp() {
    if (dragWindow) {
        const windowData = openWindows.find(w => w.id === dragWindow);
        if (windowData && !windowData.isMaximized) {
            const windowElement = document.getElementById(dragWindow);
            windowData.originalPosition.x = parseInt(windowElement.style.left);
            windowData.originalPosition.y = parseInt(windowElement.style.top);
        }
        dragWindow = null;
    }
}

function updateTaskbar() {
    const taskbar = document.getElementById('taskbar');
    if (!taskbar) return;

    const taskbarItems = taskbar.querySelector('.tonios-taskbar-items') || document.createElement('div');
    taskbarItems.className = 'tonios-taskbar-items';
    taskbarItems.innerHTML = '';

    openWindows.forEach(window => {
        const item = document.createElement('div');
        item.className = `tonios-taskbar-item ${window.isMinimized ? 'minimized' : ''}`;
        item.setAttribute('data-window-id', window.id);
        item.onclick = () => {
            if (window.isMinimized) {
                minimizeWindow(window.id);
            } else {
                bringToFront(window.id);
            }
        };
        
        item.innerHTML = `
            <span class="tonios-taskbar-icon">${getAppIcon(window.appType)}</span>
            <span class="tonios-taskbar-title">${window.title}</span>
        `;
        
        taskbarItems.appendChild(item);
    });

    if (!taskbar.querySelector('.tonios-taskbar-items')) {
        taskbar.appendChild(taskbarItems);
    }
}

// Création des fenêtres d'applications
function createCalculatorWindow() {
    return `
        <div class="tonios-calculator">
            <div class="tonios-calc-display">
                <input type="text" id="calcDisplay" readonly value="0">
            </div>
            <div class="tonios-calc-buttons">
                <button onclick="clearCalculator()" class="tonios-calc-btn clear">C</button>
                <button onclick="appendToCalculator('/')" class="tonios-calc-btn operator">÷</button>
                <button onclick="appendToCalculator('*')" class="tonios-calc-btn operator">×</button>
                <button onclick="deleteLast()" class="tonios-calc-btn">⌫</button>
                
                <button onclick="appendToCalculator('7')" class="tonios-calc-btn">7</button>
                <button onclick="appendToCalculator('8')" class="tonios-calc-btn">8</button>
                <button onclick="appendToCalculator('9')" class="tonios-calc-btn">9</button>
                <button onclick="appendToCalculator('-')" class="tonios-calc-btn operator">-</button>
                
                <button onclick="appendToCalculator('4')" class="tonios-calc-btn">4</button>
                <button onclick="appendToCalculator('5')" class="tonios-calc-btn">5</button>
                <button onclick="appendToCalculator('6')" class="tonios-calc-btn">6</button>
                <button onclick="appendToCalculator('+')" class="tonios-calc-btn operator">+</button>
                
                <button onclick="appendToCalculator('1')" class="tonios-calc-btn">1</button>
                <button onclick="appendToCalculator('2')" class="tonios-calc-btn">2</button>
                <button onclick="appendToCalculator('3')" class="tonios-calc-btn">3</button>
                <button onclick="calculateResult()" class="tonios-calc-btn equals" rowspan="2">=</button>
                
                <button onclick="appendToCalculator('0')" class="tonios-calc-btn zero">0</button>
                <button onclick="appendToCalculator('.')" class="tonios-calc-btn">.</button>
            </div>
        </div>
    `;
}

function createNotepadWindow(fileName = '') {
    const file = fileName ? userFiles.find(f => f.name === fileName) : null;
    const content = file ? file.content : '';
    
    return `
        <div class="tonios-notepad">
            <div class="tonios-notepad-toolbar">
                <button onclick="saveNotepadFile('${fileName}')" class="tonios-btn">💾 Enregistrer</button>
                <button onclick="saveAsNotepadFile()" class="tonios-btn">💾 Enregistrer sous...</button>
                <button onclick="clearNotepad()" class="tonios-btn">🗑️ Nouveau</button>
                <span class="tonios-notepad-info">
                    ${fileName ? `Fichier: ${fileName}` : 'Nouveau document'}
                </span>
            </div>
            <textarea id="notepadContent" class="tonios-notepad-textarea" 
                      placeholder="Tapez votre texte ici...">${content}</textarea>
        </div>
    `;
}

function createFileManagerWindow() {
    return `
        <div class="tonios-filemanager">
            <div class="tonios-filemanager-toolbar">
                <button onclick="createNewFile('text')" class="tonios-btn">📝 Nouveau fichier</button>
                <button onclick="refreshFileList()" class="tonios-btn">🔄 Actualiser</button>
                <button onclick="importUserData()" class="tonios-btn">📥 Importer</button>
                <button onclick="exportUserData()" class="tonios-btn">📤 Exporter</button>
                <div class="tonios-file-stats">
                    <span id="fileCount">${userFiles.length} fichier(s)</span>
                </div>
            </div>
            <div class="tonios-filemanager-content">
                <div id="filesList" class="tonios-files-list">
                    <!-- Les fichiers seront chargés ici -->
                </div>
            </div>
        </div>
    `;
}

function createChatWindow() {
    return `
        <div class="tonios-chat-container">
            <div class="tonios-chat-sidebar">
                <div class="tonios-chat-user-info">
                    <div class="tonios-chat-avatar" style="background-color: ${currentSession?.avatar.color || '#3498db'}">
                        ${currentSession?.avatar.letter || 'U'}
                    </div>
                    <div class="tonios-chat-user-details">
                        <div class="tonios-chat-username">${getCurrentUser()}</div>
                        <div class="tonios-chat-role">${getCurrentUserRole()}</div>
                    </div>
                </div>
                
                <div class="tonios-chat-channels">
                    <div class="tonios-chat-section">
                        <h4>📝 Canaux texte</h4>
                        <div id="textChannelsList">
                            <!-- Canaux texte -->
                        </div>
                        ${currentSession?.hasPermission('createChannel') ? '<button onclick="createNewChannel()" class="tonios-btn-small">+ Créer canal</button>' : ''}
                    </div>
                    
                    <div class="tonios-chat-section">
                        <h4>🔊 Canaux vocaux</h4>
                        <div id="voiceChannelsList">
                            <!-- Canaux vocaux -->
                        </div>
                        <button onclick="createNewVoiceChannel()" class="tonios-btn-small">+ Créer salon</button>
                    </div>
                </div>
            </div>
            
            <div class="tonios-chat-main">
                <div class="tonios-chat-header">
                    <span id="currentChannelIcon">#</span>
                    <span id="currentChannelName">général</span>
                    <span id="channelDescription" class="tonios-chat-description">Canal principal de discussion</span>
                </div>
                
                <div id="chatMessages" class="tonios-chat-messages">
                    <!-- Messages du chat -->
                </div>
                
                <div class="tonios-chat-input-container">
                    <div class="tonios-chat-voice-controls">
                        <button id="micButton" onclick="toggleMicrophone()" class="tonios-voice-btn">🎤 Micro</button>
                        <button id="speakerButton" onclick="toggleSpeaker()" class="tonios-voice-btn">🔊 Audio</button>
                        <button onclick="startVoiceRecording()" class="tonios-voice-btn record">🎙️ Parler</button>
                    </div>
                    <div class="tonios-chat-input-area">
                        <input type="text" id="chatInput" placeholder="Tapez votre message dans #général..." 
                               onkeypress="handleChatKeyPress(event)">
                        <button onclick="sendChatMessage()" class="tonios-btn-send">📤</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createDiscordChatWindow() {
    return `
        <div id="discordChatContainer">
            <!-- Discord chat will be initialized here -->
            <div style="padding: 20px; text-align: center;">
                <div class="loading-spinner"></div>
                <p>Chargement du chat Discord...</p>
            </div>
        </div>
    `;
}

function createAdvancedFileManagerWindow() {
    return `
        <div id="advancedFileManagerContainer">
            <!-- Advanced file manager will be initialized here -->
            <div style="padding: 20px; text-align: center;">
                <div class="loading-spinner"></div>
                <p>Chargement du gestionnaire de fichiers avancé...</p>
            </div>
        </div>
    `;
}

function createPropertiesWindow() {
    const stats = getSystemStats();
    return `
        <div class="tonios-properties">
            <div class="tonios-properties-header">
                <h2>🖥️ ToniOS - Propriétés du système</h2>
            </div>
            
            <div class="tonios-properties-content">
                <div class="tonios-property-section">
                    <h3>👤 Utilisateur actuel</h3>
                    <div class="tonios-property-item">
                        <span>Nom d'utilisateur:</span>
                        <span>${getCurrentUser()}</span>
                    </div>
                    <div class="tonios-property-item">
                        <span>Rôle:</span>
                        <span>${getCurrentUserRole()}</span>
                    </div>
                    <div class="tonios-property-item">
                        <span>Temps de session:</span>
                        <span>${Math.floor(stats.uptime / 1000 / 60)} minutes</span>
                    </div>
                </div>
                
                <div class="tonios-property-section">
                    <h3>📊 Statistiques</h3>
                    <div class="tonios-property-item">
                        <span>Fichiers utilisateur:</span>
                        <span>${stats.userFiles}</span>
                    </div>
                    <div class="tonios-property-item">
                        <span>Fenêtres ouvertes:</span>
                        <span>${stats.openWindows}</span>
                    </div>
                    <div class="tonios-property-item">
                        <span>Messages chat:</span>
                        <span>${stats.chatMessages}</span>
                    </div>
                    <div class="tonios-property-item">
                        <span>Utilisation mémoire:</span>
                        <span>${stats.memory}</span>
                    </div>
                </div>
                
                <div class="tonios-property-section">
                    <h3>💻 Système</h3>
                    <div class="tonios-property-item">
                        <span>Résolution écran:</span>
                        <span>${stats.performance.screenResolution}</span>
                    </div>
                    <div class="tonios-property-item">
                        <span>Profondeur couleur:</span>
                        <span>${stats.performance.colorDepth}</span>
                    </div>
                    <div class="tonios-property-item">
                        <span>Langue:</span>
                        <span>${stats.performance.language}</span>
                    </div>
                </div>
                
                <div class="tonios-property-actions">
                    <button onclick="exportUserData()" class="tonios-btn">💾 Exporter données</button>
                    <button onclick="logout()" class="tonios-btn">🚪 Déconnexion</button>
                    <button onclick="deleteAccount()" class="tonios-btn danger">🗑️ Supprimer compte</button>
                </div>
            </div>
        </div>
    `;
}

function createWallpaperWindow() {
    return `
        <div class="tonios-wallpaper-selector">
            <div class="tonios-wallpaper-header">
                <h3>🎨 Personnalisation du bureau</h3>
                <p>Choisissez un fond d'écran pour votre bureau</p>
            </div>
            
            <div class="tonios-wallpaper-grid">
                <div class="tonios-wallpaper-option" onclick="setWallpaper('gradient1')">
                    <div style="background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); width: 80px; height: 60px; border-radius: 8px; margin-bottom: 5px;"></div>
                    <span>Dégradé Bleu</span>
                </div>
                <div class="tonios-wallpaper-option" onclick="setWallpaper('gradient2')">
                    <div style="background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%); width: 80px; height: 60px; border-radius: 8px; margin-bottom: 5px;"></div>
                    <span>Dégradé Rose</span>
                </div>
                <div class="tonios-wallpaper-option" onclick="setWallpaper('gradient3')">
                    <div style="background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%); width: 80px; height: 60px; border-radius: 8px; margin-bottom: 5px;"></div>
                    <span>Dégradé Cyan</span>
                </div>
                <div class="tonios-wallpaper-option" onclick="setWallpaper('gradient4')">
                    <div style="background: linear-gradient(45deg, #43e97b 0%, #38f9d7 100%); width: 80px; height: 60px; border-radius: 8px; margin-bottom: 5px;"></div>
                    <span>Dégradé Vert</span>
                </div>
                <div class="tonios-wallpaper-option" onclick="setWallpaper('default')">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); width: 80px; height: 60px; border-radius: 8px; margin-bottom: 5px;"></div>
                    <span>Défaut ToniOS</span>
                </div>
            </div>
            
            <div class="tonios-wallpaper-actions">
                <button onclick="resetWallpaper()" class="tonios-btn">🔄 Réinitialiser</button>
                <button onclick="applyRandomWallpaper()" class="tonios-btn">🎲 Aléatoire</button>
            </div>
        </div>
    `;
}

// Initialization functions for new applications
function initializeDiscordChat() {
    const container = document.getElementById('discordChatContainer');
    if (container && typeof window.DiscordChatAdvanced !== 'undefined') {
        // Initialize Discord chat in the container
        container.innerHTML = '';
        const chatInstance = new window.DiscordChatAdvanced();
        chatInstance.init(container);
        console.log('Discord chat initialized successfully');
    } else {
        console.warn('Discord chat container or class not found');
        // Fallback to basic chat interface
        if (container) {
            container.innerHTML = `
                <div class="discord-chat-container">
                    <div class="discord-sidebar">
                        <div class="discord-server-info">
                            <div class="discord-server-name">ToniOS Server</div>
                            <div class="discord-server-members">Utilisateurs connectés</div>
                        </div>
                        <div class="discord-channels">
                            <div class="discord-channel-category">CANAUX TEXTE</div>
                            <div class="discord-channel active">
                                <span class="discord-channel-icon">#</span>
                                <span class="discord-channel-name">général</span>
                            </div>
                            <div class="discord-channel">
                                <span class="discord-channel-icon">#</span>
                                <span class="discord-channel-name">développement</span>
                            </div>
                        </div>
                    </div>
                    <div class="discord-main-content">
                        <div class="discord-chat-header">
                            <div class="discord-chat-title">
                                <span>#</span> général
                                <span class="discord-chat-description">Canal principal de discussion</span>
                            </div>
                        </div>
                        <div class="discord-messages-container" id="discordMessages">
                            <div class="discord-message">
                                <div class="discord-message-avatar">T</div>
                                <div class="discord-message-content">
                                    <div class="discord-message-header">
                                        <span class="discord-message-author">ToniOS</span>
                                        <span class="discord-message-timestamp">Maintenant</span>
                                    </div>
                                    <div class="discord-message-text">Bienvenue dans le chat Discord de ToniOS ! 🎉</div>
                                </div>
                            </div>
                        </div>
                        <div class="discord-input-container">
                            <div class="discord-voice-controls">
                                <button class="discord-voice-btn">🎤 Micro</button>
                                <button class="discord-voice-btn">🔊 Audio</button>
                                <button class="discord-voice-btn">🎙️ Enregistrer</button>
                            </div>
                            <div class="discord-input-area">
                                <input type="text" class="discord-message-input" placeholder="Tapez votre message dans #général..." onkeypress="handleDiscordMessage(event)">
                                <button class="discord-send-btn" onclick="sendDiscordMessage()">📤</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

function initializeAdvancedFileManager() {
    const container = document.getElementById('advancedFileManagerContainer');
    if (container && typeof window.AdvancedFileManager !== 'undefined') {
        // Initialize advanced file manager in the container
        container.innerHTML = '';
        const fileManagerInstance = new window.AdvancedFileManager();
        fileManagerInstance.init(container);
        console.log('Advanced file manager initialized successfully');
    } else {
        console.warn('Advanced file manager container or class not found');
        // Fallback to basic file manager interface
        if (container) {
            container.innerHTML = `
                <div class="advanced-file-manager">
                    <div class="file-manager-toolbar">
                        <div class="file-manager-nav">
                            <button class="nav-btn">◀️ Retour</button>
                            <button class="nav-btn">▶️ Avant</button>
                            <button class="nav-btn">⬆️ Parent</button>
                        </div>
                        <div class="file-manager-path">
                            <span class="path-segment">🏠 Accueil</span>
                            <span>/</span>
                            <span class="path-segment">📁 Documents</span>
                        </div>
                        <div class="file-manager-actions">
                            <button class="view-mode-btn active">⊞ Grille</button>
                            <button class="view-mode-btn">☰ Liste</button>
                            <button class="view-mode-btn">📋 Détails</button>
                            <div class="file-manager-search">
                                <input type="text" class="search-input" placeholder="Rechercher...">
                                <span class="search-icon">🔍</span>
                            </div>
                        </div>
                    </div>
                    <div class="file-manager-content">
                        <div class="file-manager-sidebar">
                            <div class="sidebar-section">
                                <div class="sidebar-title">Raccourcis</div>
                                <div class="sidebar-item active">🏠 Accueil</div>
                                <div class="sidebar-item">📁 Documents</div>
                                <div class="sidebar-item">🖼️ Images</div>
                                <div class="sidebar-item">🎵 Musique</div>
                                <div class="sidebar-item">🗑️ Corbeille</div>
                            </div>
                        </div>
                        <div class="file-manager-main">
                            <div class="file-list-container">
                                <div class="file-list grid-view">
                                    <div class="file-item grid-item">
                                        <div class="file-icon">📁</div>
                                        <div class="file-name">Nouveau dossier</div>
                                        <div class="file-details">Dossier</div>
                                    </div>
                                    <div class="file-item grid-item">
                                        <div class="file-icon">📄</div>
                                        <div class="file-name">Document.txt</div>
                                        <div class="file-details">1.2 KB</div>
                                    </div>
                                    <div class="file-item grid-item">
                                        <div class="file-icon">🖼️</div>
                                        <div class="file-name">Image.png</div>
                                        <div class="file-details">245 KB</div>
                                    </div>
                                </div>
                            </div>
                            <div class="file-manager-status">
                                <span>3 éléments</span>
                                <span>Prêt</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

// Discord chat helper functions
function handleDiscordMessage(event) {
    if (event.key === 'Enter') {
        sendDiscordMessage();
    }
}

function sendDiscordMessage() {
    const input = document.querySelector('.discord-message-input');
    if (!input || !input.value.trim()) return;
    
    const messagesContainer = document.getElementById('discordMessages');
    if (!messagesContainer) return;
    
    const message = input.value.trim();
    const currentUser = getCurrentUser() || 'Utilisateur';
    
    const messageElement = document.createElement('div');
    messageElement.className = 'discord-message';
    messageElement.innerHTML = `
        <div class="discord-message-avatar">${currentUser[0].toUpperCase()}</div>
        <div class="discord-message-content">
            <div class="discord-message-header">
                <span class="discord-message-author">${currentUser}</span>
                <span class="discord-message-timestamp">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="discord-message-text">${message}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    input.value = '';
}

// Exposer les fonctions globalement pour qu'elles soient accessibles depuis d'autres scripts
window.openApplication = openApplication;
window.closeWindow = closeWindow;
window.minimizeWindow = minimizeWindow;
window.maximizeWindow = maximizeWindow;
window.bringToFront = bringToFront;
