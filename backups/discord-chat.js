// SYSTÈME DE CHAT DISCORD-LIKE POUR TONIOS
// ========================================

class ToniOSDiscordChat {
    constructor() {
        this.currentUser = null;
        this.currentChannel = 'general';
        this.channels = {
            'general': { name: 'Général', type: 'text', messages: [] },
            'random': { name: 'Aléatoire', type: 'text', messages: [] },
            'voice-1': { name: 'Salon Vocal 1', type: 'voice', users: [] },
            'voice-2': { name: 'Salon Vocal 2', type: 'voice', users: [] }
        };
        this.onlineUsers = new Map();
        this.voiceConnection = null;
        this.mediaStream = null;
        this.peerConnections = new Map();
        this.isVoiceConnected = false;
        
        // Simuler des utilisateurs en ligne
        this.simulateOnlineUsers();
        
        // Initialiser WebRTC
        this.initializeWebRTC();
    }

    simulateOnlineUsers() {
        const userList = [
            { id: 'user1', name: 'Alice', status: 'online', avatar: '👩' },
            { id: 'user2', name: 'Bob', status: 'away', avatar: '👨' },
            { id: 'user3', name: 'Charlie', status: 'dnd', avatar: '🧑' },
            { id: 'user4', name: 'Diana', status: 'online', avatar: '👩‍💼' }
        ];
        
        userList.forEach(user => {
            this.onlineUsers.set(user.id, user);
        });
    }

    initializeWebRTC() {
        // Configuration STUN/TURN pour WebRTC
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
    }

    createDiscordChatWindow() {
        return `
            <div class="discord-chat-container">
                <!-- Sidebar avec serveurs et canaux -->
                <div class="discord-sidebar">
                    <div class="discord-server-info">
                        <h3>🖥️ ToniOS Server</h3>
                        <div class="server-members-count">${this.onlineUsers.size} membres en ligne</div>
                    </div>
                    
                    <!-- Liste des canaux -->
                    <div class="discord-channels">
                        <div class="channel-category">
                            <div class="category-header">📝 CANAUX TEXTUELS</div>
                            ${Object.entries(this.channels)
                                .filter(([id, channel]) => channel.type === 'text')
                                .map(([id, channel]) => `
                                    <div class="channel-item ${id === this.currentChannel ? 'active' : ''}" 
                                         onclick="discordChat.switchChannel('${id}')" data-channel="${id}">
                                        <span class="channel-hash">#</span>
                                        <span class="channel-name">${channel.name.toLowerCase()}</span>
                                    </div>
                                `).join('')}
                        </div>
                        
                        <div class="channel-category">
                            <div class="category-header">🔊 CANAUX VOCAUX</div>
                            ${Object.entries(this.channels)
                                .filter(([id, channel]) => channel.type === 'voice')
                                .map(([id, channel]) => `
                                    <div class="voice-channel-item" onclick="discordChat.toggleVoiceChannel('${id}')" data-channel="${id}">
                                        <span class="voice-icon">🔊</span>
                                        <span class="channel-name">${channel.name}</span>
                                        <div class="voice-users-count">${channel.users.length} utilisateurs</div>
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                    
                    <!-- Contrôles utilisateur -->
                    <div class="discord-user-controls">
                        <div class="user-info">
                            <div class="user-avatar">👤</div>
                            <div class="user-details">
                                <div class="username">${this.getCurrentUsername()}</div>
                                <div class="user-status">En ligne</div>
                            </div>
                        </div>
                        <div class="voice-controls">
                            <button class="voice-btn" id="muteBtn" onclick="discordChat.toggleMute()" title="Muet">🎤</button>
                            <button class="voice-btn" id="deafenBtn" onclick="discordChat.toggleDeafen()" title="Sourd">🔊</button>
                            <button class="voice-btn" onclick="discordChat.openSettings()" title="Paramètres">⚙️</button>
                        </div>
                    </div>
                </div>
                
                <!-- Zone de chat principal -->
                <div class="discord-main-chat">
                    <!-- En-tête du canal -->
                    <div class="discord-chat-header">
                        <div class="channel-info">
                            <span class="channel-symbol">${this.channels[this.currentChannel].type === 'text' ? '#' : '🔊'}</span>
                            <span class="channel-title">${this.channels[this.currentChannel].name}</span>
                        </div>
                        <div class="chat-controls">
                            <button onclick="discordChat.startScreenShare()" title="Partage d'écran">📺</button>
                            <button onclick="discordChat.openUsersList()" title="Liste des membres">👥</button>
                        </div>
                    </div>
                    
                    <!-- Zone des messages -->
                    <div class="discord-messages" id="discordMessages">
                        ${this.renderMessages()}
                    </div>
                    
                    <!-- Zone de saisie -->
                    <div class="discord-input-area">
                        <div class="message-input-container">
                            <input type="text" 
                                   id="messageInput" 
                                   placeholder="Écrivez votre message dans #${this.channels[this.currentChannel].name.toLowerCase()}..."
                                   onkeypress="discordChat.handleMessageInput(event)"
                                   autocomplete="off">
                            <div class="input-controls">
                                <button onclick="discordChat.attachFile()" title="Joindre un fichier">📎</button>
                                <button onclick="discordChat.addEmoji()" title="Émojis">😀</button>
                                <button onclick="discordChat.sendMessage()" title="Envoyer">➤</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Liste des utilisateurs en ligne -->
                <div class="discord-users-list">
                    <div class="users-header">Membres — ${this.onlineUsers.size}</div>
                    <div class="users-content">
                        ${this.renderOnlineUsers()}
                    </div>
                </div>
            </div>
            
            <!-- Modal pour les paramètres vocaux -->
            <div id="voiceSettingsModal" class="voice-settings-modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Paramètres Vocaux</h3>
                        <button onclick="discordChat.closeSettings()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="setting-group">
                            <label>Microphone</label>
                            <select id="microphoneSelect"></select>
                        </div>
                        <div class="setting-group">
                            <label>Haut-parleurs</label>
                            <select id="speakerSelect"></select>
                        </div>
                        <div class="setting-group">
                            <label>Volume du microphone</label>
                            <input type="range" id="micVolume" min="0" max="100" value="100">
                        </div>
                        <div class="setting-group">
                            <label>Volume de sortie</label>
                            <input type="range" id="outputVolume" min="0" max="100" value="100">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderMessages() {
        const channel = this.channels[this.currentChannel];
        if (channel.type === 'voice') {
            return `
                <div class="voice-channel-info">
                    <div class="voice-icon-large">🔊</div>
                    <h3>Aucune conversation récente</h3>
                    <p>Lorsque quelqu'un commence à parler dans ce salon vocal, nous afficherons son message ici.</p>
                </div>
            `;
        }
        
        if (channel.messages.length === 0) {
            return `
                <div class="no-messages">
                    <div class="channel-icon">#</div>
                    <h3>Bienvenue dans #${channel.name.toLowerCase()} !</h3>
                    <p>Voici le début du salon #${channel.name.toLowerCase()}.</p>
                </div>
            `;
        }
        
        return channel.messages.map(msg => `
            <div class="message-item">
                <div class="message-avatar">${msg.avatar}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${msg.author}</span>
                        <span class="message-timestamp">${msg.timestamp}</span>
                    </div>
                    <div class="message-text">${msg.content}</div>
                </div>
            </div>
        `).join('');
    }

    renderOnlineUsers() {
        const usersByStatus = {
            online: [],
            away: [],
            dnd: [],
            offline: []
        };

        this.onlineUsers.forEach(user => {
            usersByStatus[user.status].push(user);
        });

        let html = '';
        
        // Utilisateurs en ligne
        if (usersByStatus.online.length > 0) {
            html += `<div class="status-group">
                <div class="status-header">En ligne — ${usersByStatus.online.length}</div>
                ${usersByStatus.online.map(user => `
                    <div class="user-item" onclick="discordChat.openUserProfile('${user.id}')">
                        <div class="user-avatar-small">${user.avatar}</div>
                        <div class="user-name">${user.name}</div>
                        <div class="user-status-indicator online"></div>
                    </div>
                `).join('')}
            </div>`;
        }

        // Utilisateurs absents
        if (usersByStatus.away.length > 0) {
            html += `<div class="status-group">
                <div class="status-header">Absent — ${usersByStatus.away.length}</div>
                ${usersByStatus.away.map(user => `
                    <div class="user-item" onclick="discordChat.openUserProfile('${user.id}')">
                        <div class="user-avatar-small">${user.avatar}</div>
                        <div class="user-name">${user.name}</div>
                        <div class="user-status-indicator away"></div>
                    </div>
                `).join('')}
            </div>`;
        }

        // Utilisateurs ne pas déranger
        if (usersByStatus.dnd.length > 0) {
            html += `<div class="status-group">
                <div class="status-header">Ne pas déranger — ${usersByStatus.dnd.length}</div>
                ${usersByStatus.dnd.map(user => `
                    <div class="user-item" onclick="discordChat.openUserProfile('${user.id}')">
                        <div class="user-avatar-small">${user.avatar}</div>
                        <div class="user-name">${user.name}</div>
                        <div class="user-status-indicator dnd"></div>
                    </div>
                `).join('')}
            </div>`;
        }

        return html;
    }

    getCurrentUsername() {
        // Récupérer le nom d'utilisateur depuis le système d'authentification
        return sessionStorage.getItem('currentUser') || 'Utilisateur';
    }

    switchChannel(channelId) {
        if (this.channels[channelId]) {
            this.currentChannel = channelId;
            this.updateChatInterface();
        }
    }

    updateChatInterface() {
        const messagesContainer = document.getElementById('discordMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = this.renderMessages();
        }

        // Mettre à jour l'en-tête
        const channelTitle = document.querySelector('.channel-title');
        const channelSymbol = document.querySelector('.channel-symbol');
        if (channelTitle && channelSymbol) {
            channelTitle.textContent = this.channels[this.currentChannel].name;
            channelSymbol.textContent = this.channels[this.currentChannel].type === 'text' ? '#' : '🔊';
        }

        // Mettre à jour le placeholder de l'input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.placeholder = `Écrivez votre message dans ${this.channels[this.currentChannel].type === 'text' ? '#' : '🔊'}${this.channels[this.currentChannel].name.toLowerCase()}...`;
        }

        // Mettre à jour les classes actives
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeChannel = document.querySelector(`[data-channel="${this.currentChannel}"]`);
        if (activeChannel) {
            activeChannel.classList.add('active');
        }
    }

    handleMessageInput(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (message && this.channels[this.currentChannel].type === 'text') {
            const newMessage = {
                id: Date.now(),
                author: this.getCurrentUsername(),
                avatar: '👤',
                content: message,
                timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            };
            
            this.channels[this.currentChannel].messages.push(newMessage);
            input.value = '';
            this.updateChatInterface();
            
            // Scroller vers le bas
            const messagesContainer = document.getElementById('discordMessages');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Simuler une réponse automatique après quelques secondes
            setTimeout(() => {
                this.simulateResponse(message);
            }, Math.random() * 3000 + 1000);
        }
    }

    simulateResponse(originalMessage) {
        const responses = [
            "Intéressant ! 🤔",
            "Je suis d'accord avec toi !",
            "C'est une bonne idée 💡",
            "Pourrais-tu en dire plus ?",
            "Excellent point de vue !",
            "J'ai eu la même expérience 👍"
        ];
        
        const randomUser = Array.from(this.onlineUsers.values())[Math.floor(Math.random() * this.onlineUsers.size)];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const responseMessage = {
            id: Date.now(),
            author: randomUser.name,
            avatar: randomUser.avatar,
            content: randomResponse,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        
        this.channels[this.currentChannel].messages.push(responseMessage);
        this.updateChatInterface();
        
        const messagesContainer = document.getElementById('discordMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async toggleVoiceChannel(channelId) {
        if (this.isVoiceConnected) {
            this.disconnectVoice();
        } else {
            await this.connectToVoice(channelId);
        }
    }

    async connectToVoice(channelId) {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: false 
            });
            
            this.isVoiceConnected = true;
            this.voiceChannel = channelId;
            
            // Ajouter l'utilisateur au canal vocal
            this.channels[channelId].users.push({
                id: 'current-user',
                name: this.getCurrentUsername(),
                muted: false,
                deafened: false
            });
            
            this.showVoiceNotification(`Connecté au salon vocal ${this.channels[channelId].name}`);
            this.updateVoiceUI();
            
        } catch (error) {
            console.error('Erreur lors de la connexion vocale:', error);
            this.showVoiceNotification('Impossible d\'accéder au microphone', 'error');
        }
    }

    disconnectVoice() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        if (this.voiceChannel) {
            this.channels[this.voiceChannel].users = this.channels[this.voiceChannel].users.filter(
                user => user.id !== 'current-user'
            );
        }
        
        this.isVoiceConnected = false;
        this.voiceChannel = null;
        this.showVoiceNotification('Déconnecté du salon vocal');
        this.updateVoiceUI();
    }

    toggleMute() {
        if (this.mediaStream) {
            const audioTracks = this.mediaStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            
            const muteBtn = document.getElementById('muteBtn');
            muteBtn.textContent = audioTracks[0].enabled ? '🎤' : '🎤❌';
            muteBtn.title = audioTracks[0].enabled ? 'Muet' : 'Activer le micro';
        }
    }

    toggleDeafen() {
        // Simuler la fonction sourd
        const deafenBtn = document.getElementById('deafenBtn');
        const isDeafened = deafenBtn.textContent === '🔊❌';
        
        deafenBtn.textContent = isDeafened ? '🔊' : '🔊❌';
        deafenBtn.title = isDeafened ? 'Sourd' : 'Activer l\'audio';
    }

    updateVoiceUI() {
        // Mettre à jour l'interface pour refléter l'état vocal
        document.querySelectorAll('.voice-channel-item').forEach(item => {
            item.classList.remove('connected');
        });
        
        if (this.isVoiceConnected && this.voiceChannel) {
            const connectedChannel = document.querySelector(`[data-channel="${this.voiceChannel}"]`);
            if (connectedChannel) {
                connectedChannel.classList.add('connected');
            }
        }
    }

    showVoiceNotification(message, type = 'info') {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = `voice-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    openSettings() {
        const modal = document.getElementById('voiceSettingsModal');
        modal.classList.remove('hidden');
        this.loadAudioDevices();
    }

    closeSettings() {
        const modal = document.getElementById('voiceSettingsModal');
        modal.classList.add('hidden');
    }

    async loadAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const micSelect = document.getElementById('microphoneSelect');
            const speakerSelect = document.getElementById('speakerSelect');
            
            micSelect.innerHTML = '';
            speakerSelect.innerHTML = '';
            
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `${device.kind} ${device.deviceId.substr(0, 8)}`;
                
                if (device.kind === 'audioinput') {
                    micSelect.appendChild(option);
                } else if (device.kind === 'audiooutput') {
                    speakerSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Erreur lors du chargement des périphériques audio:', error);
        }
    }

    attachFile() {
        // Simuler l'attachement de fichier
        this.showVoiceNotification('Fonction d\'attachement de fichier en développement');
    }

    addEmoji() {
        const input = document.getElementById('messageInput');
        const emojis = ['😀', '😃', '😄', '😊', '😍', '🤔', '👍', '❤️', '🎉', '🔥'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        input.value += randomEmoji;
        input.focus();
    }

    startScreenShare() {
        this.showVoiceNotification('Partage d\'écran en développement');
    }

    openUsersList() {
        this.showVoiceNotification('Liste des membres affichée');
    }

    openUserProfile(userId) {
        const user = this.onlineUsers.get(userId);
        if (user) {
            this.showVoiceNotification(`Profil de ${user.name} - ${user.status}`);
        }
    }
}

// Instance globale du chat Discord
let discordChat = null;

// Fonction pour initialiser le chat Discord
function initializeDiscordChat() {
    discordChat = new ToniOSDiscordChat();
}

// Exposer les fonctions nécessaires
window.initializeDiscordChat = initializeDiscordChat;
window.discordChat = discordChat;
