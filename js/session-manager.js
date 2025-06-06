// ===============================================
// GESTIONNAIRE DE SESSIONS UTILISATEURS
// ===============================================

class SessionManager {
    constructor() {
        this.activeSessions = new Map();
        this.currentUser = null;
        this.websocket = null;
        this.sessionViewers = new Map();
        this.init();
    }

    init() {
        this.currentUser = getCurrentUser();
        this.setupWebSocket();
        this.startSessionBroadcast();
        this.loadActiveSessions();
    }

    setupWebSocket() {
        // Simuler WebSocket pour les sessions en temps réel
        // En production, ceci se connecterait à un serveur WebSocket réel
        this.websocket = {
            send: (data) => {
                console.log('Sending session data:', data);
                this.broadcastSession(JSON.parse(data));
            },
            onmessage: null,
            connected: true
        };
    }

    startSessionBroadcast() {
        // Diffuser les informations de session toutes les 5 secondes
        setInterval(() => {
            this.broadcastCurrentSession();
        }, 5000);
    }

    broadcastCurrentSession() {
        const sessionData = this.getCurrentSessionData();
        if (this.websocket && this.websocket.connected) {
            this.websocket.send(JSON.stringify({
                type: 'session_update',
                user: this.currentUser,
                data: sessionData
            }));
        }
    }

    getCurrentSessionData() {
        return {
            user: this.currentUser,
            timestamp: Date.now(),
            openWindows: openWindows.map(w => ({
                id: w.id,
                appType: w.appType,
                title: w.title,
                isMinimized: w.isMinimized
            })),
            currentActivity: this.detectCurrentActivity(),
            systemStats: this.getSystemStats(),
            screenInfo: {
                resolution: `${window.screen.width}x${window.screen.height}`,
                availableResolution: `${window.screen.availWidth}x${window.screen.availHeight}`,
                colorDepth: window.screen.colorDepth
            },
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform
            }
        };
    }

    detectCurrentActivity() {
        const activeWindow = openWindows.find(w => !w.isMinimized);
        if (activeWindow) {
            return {
                type: 'application',
                app: activeWindow.appType,
                title: activeWindow.title
            };
        }
        return {
            type: 'desktop',
            app: null,
            title: 'Bureau ToniOS'
        };
    }

    getSystemStats() {
        return {
            openWindowsCount: openWindows.length,
            sessionDuration: Date.now() - (window.sessionStartTime || Date.now()),
            lastActivity: Date.now()
        };
    }

    broadcastSession(sessionData) {
        // Simuler la réception de données de session d'autres utilisateurs
        if (sessionData.user !== this.currentUser) {
            this.activeSessions.set(sessionData.user, sessionData.data);
            this.updateSessionViewer();
        }
    }

    loadActiveSessions() {
        // Charger les sessions simulées pour la démonstration
        const demoSessions = [
            {
                user: 'Alice',
                timestamp: Date.now() - 300000,
                openWindows: [
                    { appType: 'filemanager', title: 'Gestionnaire de fichiers' },
                    { appType: 'discord-chat', title: 'ToniOS Discord Chat' }
                ],
                currentActivity: { type: 'application', app: 'filemanager', title: 'Gestionnaire de fichiers' },
                systemStats: { openWindowsCount: 2, sessionDuration: 1800000 }
            },
            {
                user: 'Bob',
                timestamp: Date.now() - 150000,
                openWindows: [
                    { appType: 'calculator', title: 'Calculatrice' },
                    { appType: 'notepad', title: 'Bloc-notes' }
                ],
                currentActivity: { type: 'application', app: 'calculator', title: 'Calculatrice' },
                systemStats: { openWindowsCount: 2, sessionDuration: 900000 }
            }
        ];

        demoSessions.forEach(session => {
            this.activeSessions.set(session.user, session);
        });
    }

    createSessionManagerWindow() {
        return `
            <div class="session-manager">
                <div class="session-manager-header">
                    <h2>👥 Gestionnaire de Sessions</h2>
                    <div class="session-controls">
                        <button onclick="sessionManager.refreshSessions()" class="session-btn">🔄 Actualiser</button>
                        <button onclick="sessionManager.toggleBroadcast()" class="session-btn" id="broadcastToggle">📡 Diffusion ON</button>
                    </div>
                </div>

                <div class="session-content">
                    <div class="session-sidebar">
                        <div class="session-section">
                            <h3>Sessions Actives</h3>
                            <div id="activeSessionsList" class="sessions-list">
                                <!-- Sessions actives -->
                            </div>
                        </div>
                        
                        <div class="session-section">
                            <h3>Ma Session</h3>
                            <div class="my-session-info">
                                <div class="session-stat">
                                    <span>Utilisateur:</span>
                                    <span>${this.currentUser}</span>
                                </div>
                                <div class="session-stat">
                                    <span>Fenêtres ouvertes:</span>
                                    <span id="myWindowCount">${openWindows.length}</span>
                                </div>
                                <div class="session-stat">
                                    <span>Durée de session:</span>
                                    <span id="mySessionDuration">--</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="session-main">
                        <div class="session-viewer-header">
                            <h3 id="viewerTitle">Sélectionnez une session</h3>
                            <div class="viewer-controls">
                                <button onclick="sessionManager.requestControl()" class="session-btn" id="requestControlBtn" disabled>🎮 Demander contrôle</button>
                                <button onclick="sessionManager.sendMessage()" class="session-btn" id="sendMessageBtn" disabled>💬 Envoyer message</button>
                                <button onclick="sessionManager.viewFullScreen()" class="session-btn" id="fullScreenBtn" disabled>🖥️ Plein écran</button>
                            </div>
                        </div>

                        <div class="session-viewer" id="sessionViewer">
                            <div class="no-session-selected">
                                <div class="no-session-icon">👥</div>
                                <h3>Aucune session sélectionnée</h3>
                                <p>Sélectionnez une session active pour la visualiser et interagir avec elle.</p>
                            </div>
                        </div>

                        <div class="session-interaction">
                            <div class="interaction-tabs">
                                <button class="tab-btn active" onclick="sessionManager.showTab('info')">📊 Informations</button>
                                <button class="tab-btn" onclick="sessionManager.showTab('windows')">🪟 Fenêtres</button>
                                <button class="tab-btn" onclick="sessionManager.showTab('activity')">📈 Activité</button>
                                <button class="tab-btn" onclick="sessionManager.showTab('chat')">💬 Chat</button>
                            </div>
                            
                            <div class="tab-content">
                                <div id="infoTab" class="tab-pane active">
                                    <div id="sessionInfo">Sélectionnez une session pour voir les informations</div>
                                </div>
                                <div id="windowsTab" class="tab-pane">
                                    <div id="sessionWindows">Aucune fenêtre</div>
                                </div>
                                <div id="activityTab" class="tab-pane">
                                    <div id="sessionActivity">Aucune activité</div>
                                </div>
                                <div id="chatTab" class="tab-pane">
                                    <div class="session-chat">
                                        <div id="sessionChatMessages" class="chat-messages"></div>
                                        <div class="chat-input-area">
                                            <input type="text" id="sessionChatInput" placeholder="Tapez un message..." onkeypress="sessionManager.handleChatKeyPress(event)">
                                            <button onclick="sessionManager.sendChatMessage()" class="session-btn">📤</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateSessionViewer() {
        const sessionsList = document.getElementById('activeSessionsList');
        if (!sessionsList) return;

        sessionsList.innerHTML = '';
        
        this.activeSessions.forEach((sessionData, username) => {
            const sessionElement = document.createElement('div');
            sessionElement.className = 'session-item';
            sessionElement.onclick = () => this.selectSession(username);
            
            const isOnline = (Date.now() - sessionData.timestamp) < 30000;
            const statusClass = isOnline ? 'online' : 'offline';
            
            sessionElement.innerHTML = `
                <div class="session-avatar">
                    <div class="avatar-img">${username[0].toUpperCase()}</div>
                    <div class="status-indicator ${statusClass}"></div>
                </div>
                <div class="session-details">
                    <div class="session-username">${username}</div>
                    <div class="session-activity">${sessionData.currentActivity?.title || 'Inactif'}</div>
                    <div class="session-time">${this.formatTime(sessionData.timestamp)}</div>
                </div>
                <div class="session-stats">
                    <span class="window-count">${sessionData.openWindows?.length || 0} fenêtres</span>
                </div>
            `;
            
            sessionsList.appendChild(sessionElement);
        });
    }

    selectSession(username) {
        const sessionData = this.activeSessions.get(username);
        if (!sessionData) return;

        // Mettre à jour l'interface
        document.getElementById('viewerTitle').textContent = `Session de ${username}`;
        document.getElementById('requestControlBtn').disabled = false;
        document.getElementById('sendMessageBtn').disabled = false;
        document.getElementById('fullScreenBtn').disabled = false;

        // Marquer comme sélectionné
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('selected');
        });
        event.target.closest('.session-item').classList.add('selected');

        this.currentSelectedSession = username;
        this.updateSessionDetails(sessionData);
    }

    updateSessionDetails(sessionData) {
        // Informations générales
        document.getElementById('sessionInfo').innerHTML = `
            <div class="session-detail-item">
                <span>Utilisateur:</span>
                <span>${sessionData.user}</span>
            </div>
            <div class="session-detail-item">
                <span>Dernière activité:</span>
                <span>${this.formatTime(sessionData.timestamp)}</span>
            </div>
            <div class="session-detail-item">
                <span>Durée de session:</span>
                <span>${this.formatDuration(sessionData.systemStats?.sessionDuration || 0)}</span>
            </div>
            <div class="session-detail-item">
                <span>Résolution:</span>
                <span>${sessionData.screenInfo?.resolution || 'Inconnue'}</span>
            </div>
            <div class="session-detail-item">
                <span>Plateforme:</span>
                <span>${sessionData.browserInfo?.platform || 'Inconnue'}</span>
            </div>
        `;

        // Fenêtres ouvertes
        const windowsHtml = sessionData.openWindows?.map(window => `
            <div class="window-item">
                <span class="window-icon">${this.getAppIcon(window.appType)}</span>
                <span class="window-title">${window.title}</span>
                <span class="window-status">${window.isMinimized ? 'Réduite' : 'Active'}</span>
            </div>
        `).join('') || '<p>Aucune fenêtre ouverte</p>';
        
        document.getElementById('sessionWindows').innerHTML = windowsHtml;

        // Activité actuelle
        document.getElementById('sessionActivity').innerHTML = `
            <div class="activity-current">
                <h4>Activité actuelle:</h4>
                <div class="activity-item">
                    <span class="activity-icon">${this.getActivityIcon(sessionData.currentActivity?.type)}</span>
                    <span class="activity-text">${sessionData.currentActivity?.title || 'Bureau'}</span>
                </div>
            </div>
        `;
    }

    getAppIcon(appType) {
        const icons = {
            calculator: '🧮',
            notepad: '📝',
            chat: '💬',
            'discord-chat': '💬',
            filemanager: '📁',
            'advanced-files': '📁',
            properties: '⚙️',
            wallpaper: '🎨'
        };
        return icons[appType] || '📱';
    }

    getActivityIcon(activityType) {
        const icons = {
            application: '🖥️',
            desktop: '🖱️',
            idle: '😴'
        };
        return icons[activityType] || '❓';
    }

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'Maintenant';
        if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
        if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
        return new Date(timestamp).toLocaleDateString();
    }

    formatDuration(duration) {
        const hours = Math.floor(duration / 3600000);
        const minutes = Math.floor((duration % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    }

    showTab(tabName) {
        // Cacher tous les onglets
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Afficher l'onglet sélectionné
        document.getElementById(tabName + 'Tab').classList.add('active');
        event.target.classList.add('active');
    }

    requestControl() {
        if (!this.currentSelectedSession) return;
        
        showNotification(`Demande de contrôle envoyée à ${this.currentSelectedSession}`, 'info');
        
        // Simuler une réponse
        setTimeout(() => {
            const responses = [
                'Demande acceptée ! Vous pouvez maintenant contrôler la session.',
                'Demande refusée par l\'utilisateur.',
                'L\'utilisateur n\'a pas répondu à la demande.'
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            showNotification(response, response.includes('acceptée') ? 'success' : 'warning');
        }, 2000);
    }

    sendMessage() {
        if (!this.currentSelectedSession) return;
        
        const message = prompt(`Envoyer un message à ${this.currentSelectedSession}:`);
        if (message && message.trim()) {
            showNotification(`Message envoyé à ${this.currentSelectedSession}`, 'success');
            
            // Ajouter le message au chat
            this.addChatMessage('Vous', message, 'sent');
        }
    }

    sendChatMessage() {
        const input = document.getElementById('sessionChatInput');
        if (!input || !input.value.trim() || !this.currentSelectedSession) return;
        
        const message = input.value.trim();
        this.addChatMessage('Vous', message, 'sent');
        input.value = '';
        
        // Simuler une réponse
        setTimeout(() => {
            const responses = [
                'Merci pour votre message !',
                'Je suis occupé en ce moment.',
                'Intéressant, dites-moi en plus.',
                'Je vous réponds dans quelques minutes.'
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            this.addChatMessage(this.currentSelectedSession, response, 'received');
        }, 1000 + Math.random() * 3000);
    }

    addChatMessage(sender, message, type) {
        const chatMessages = document.getElementById('sessionChatMessages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        messageElement.innerHTML = `
            <div class="message-sender">${sender}</div>
            <div class="message-text">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    handleChatKeyPress(event) {
        if (event.key === 'Enter') {
            this.sendChatMessage();
        }
    }

    viewFullScreen() {
        if (!this.currentSelectedSession) return;
        
        showNotification('Mode plein écran de la session (simulation)', 'info');
        // En production, ceci ouvrirait une vue plein écran de la session distante
    }

    refreshSessions() {
        showNotification('Actualisation des sessions...', 'info');
        this.loadActiveSessions();
        this.updateSessionViewer();
    }

    toggleBroadcast() {
        const button = document.getElementById('broadcastToggle');
        const isOn = button.textContent.includes('ON');
        
        if (isOn) {
            button.textContent = '📡 Diffusion OFF';
            button.classList.add('disabled');
            showNotification('Diffusion de session désactivée', 'warning');
        } else {
            button.textContent = '📡 Diffusion ON';
            button.classList.remove('disabled');
            showNotification('Diffusion de session activée', 'success');
        }
    }
}

// Initialiser le gestionnaire de sessions
let sessionManager = null;

// Fonction pour créer la fenêtre du gestionnaire de sessions
function createSessionManagerWindow() {
    if (!sessionManager) {
        sessionManager = new SessionManager();
    }
    return sessionManager.createSessionManagerWindow();
}

// Fonction d'initialisation pour la fenêtre
function initializeSessionManager() {
    if (sessionManager) {
        sessionManager.updateSessionViewer();
        
        // Mettre à jour les statistiques de ma session
        setInterval(() => {
            const myWindowCount = document.getElementById('myWindowCount');
            const mySessionDuration = document.getElementById('mySessionDuration');
            
            if (myWindowCount) {
                myWindowCount.textContent = openWindows.length;
            }
            
            if (mySessionDuration && window.sessionStartTime) {
                const duration = Date.now() - window.sessionStartTime;
                mySessionDuration.textContent = sessionManager.formatDuration(duration);
            }
        }, 1000);
    }
}
