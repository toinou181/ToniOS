// ===============================================
// SYSTÈME DE CHAT DISCORD-LIKE POUR ToniOS
// ===============================================

class DiscordLikeChat {
    constructor() {
        this.currentUser = null;
        this.currentChannel = 'général';
        this.channels = new Map();
        this.voiceChannels = new Map();
        this.users = new Map();
        this.messages = new Map();
        this.typingUsers = new Set();
        this.voiceConnection = null;
        this.mediaRecorder = null;
        this.isRecording = false;
        this.isInVoiceChannel = false;
        
        this.initializeDefaultChannels();
        this.setupVoiceSystem();
    }

    initializeDefaultChannels() {
        // Canaux textuels par défaut
        this.channels.set('général', {
            name: 'général',
            type: 'text',
            description: 'Canal général pour tous les utilisateurs',
            created: new Date(),
            permissions: ['everyone']
        });
        
        this.channels.set('aide', {
            name: 'aide',
            type: 'text',
            description: 'Canal d\'aide et support',
            created: new Date(),
            permissions: ['everyone']
        });
        
        this.channels.set('admin', {
            name: 'admin',
            type: 'text',
            description: 'Canal réservé aux administrateurs',
            created: new Date(),
            permissions: ['admin', 'moderator']
        });
        
        // Canaux vocaux par défaut
        this.voiceChannels.set('salon-vocal-1', {
            name: 'Salon Vocal 1',
            type: 'voice',
            users: new Set(),
            maxUsers: 10
        });
        
        this.voiceChannels.set('salon-vocal-2', {
            name: 'Salon Vocal 2',
            type: 'voice',
            users: new Set(),
            maxUsers: 10
        });
        
        // Initialiser les messages pour chaque canal
        this.channels.forEach((channel, channelId) => {
            this.messages.set(channelId, []);
        });
    }

    createChatWindow() {
        return `
            <div class="discord-chat-container">
                <!-- Sidebar avec les canaux -->
                <div class="chat-sidebar">
                    <div class="server-header">
                        <h3>🖥️ ToniOS Chat</h3>
                        <div class="server-actions">
                            <button class="icon-btn" onclick="discordChat.createChannel()" title="Créer un canal">➕</button>
                            <button class="icon-btn" onclick="discordChat.showSettings()" title="Paramètres">⚙️</button>
                        </div>
                    </div>
                    
                    <!-- Canaux textuels -->
                    <div class="channel-category">
                        <div class="category-header">
                            <span class="category-icon">📝</span>
                            <span class="category-name">CANAUX TEXTUELS</span>
                            <button class="category-add" onclick="discordChat.createTextChannel()">+</button>
                        </div>
                        <div class="channel-list" id="textChannelList">
                            <!-- Les canaux textuels seront affichés ici -->
                        </div>
                    </div>
                    
                    <!-- Canaux vocaux -->
                    <div class="channel-category">
                        <div class="category-header">
                            <span class="category-icon">🔊</span>
                            <span class="category-name">CANAUX VOCAUX</span>
                            <button class="category-add" onclick="discordChat.createVoiceChannel()">+</button>
                        </div>
                        <div class="channel-list" id="voiceChannelList">
                            <!-- Les canaux vocaux seront affichés ici -->
                        </div>
                    </div>
                    
                    <!-- Utilisateurs en ligne -->
                    <div class="online-users">
                        <div class="users-header">
                            <span>👥 Utilisateurs en ligne</span>
                            <span class="user-count" id="userCount">0</span>
                        </div>
                        <div class="users-list" id="onlineUsersList">
                            <!-- Les utilisateurs en ligne seront affichés ici -->
                        </div>
                    </div>
                </div>
                
                <!-- Zone de chat principale -->
                <div class="chat-main">
                    <!-- En-tête du canal -->
                    <div class="chat-header">
                        <div class="channel-info">
                            <span class="channel-icon">#</span>
                            <span class="channel-name" id="currentChannelName">général</span>
                            <span class="channel-description" id="currentChannelDescription">Canal général pour tous les utilisateurs</span>
                        </div>
                        <div class="chat-actions">
                            <button class="icon-btn" onclick="discordChat.toggleNotifications()" title="Notifications">🔔</button>
                            <button class="icon-btn" onclick="discordChat.showChannelSettings()" title="Paramètres du canal">⚙️</button>
                            <button class="icon-btn" onclick="discordChat.showMemberList()" title="Liste des membres">👥</button>
                        </div>
                    </div>
                    
                    <!-- Zone des messages -->
                    <div class="chat-messages" id="chatMessages">
                        <!-- Les messages seront affichés ici -->
                    </div>
                    
                    <!-- Indicateur de saisie -->
                    <div class="typing-indicator" id="typingIndicator" style="display: none;">
                        <span class="typing-text"></span>
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                    
                    <!-- Zone de saisie -->
                    <div class="chat-input-area">
                        <div class="input-container">
                            <button class="input-btn" onclick="discordChat.attachFile()" title="Joindre un fichier">📎</button>
                            <div class="input-wrapper">
                                <input type="text" 
                                       class="message-input" 
                                       id="messageInput"
                                       placeholder="Tapez votre message dans #général..."
                                       onkeydown="discordChat.handleKeyDown(event)"
                                       oninput="discordChat.handleTyping()">
                                <div class="input-actions">
                                    <button class="input-btn" onclick="discordChat.openEmojiPicker()" title="Émojis">😀</button>
                                    <button class="input-btn" onclick="discordChat.toggleVoiceRecording()" title="Message vocal" id="voiceRecordBtn">🎤</button>
                                </div>
                            </div>
                            <button class="send-btn" onclick="discordChat.sendMessage()" title="Envoyer">
                                <span class="send-icon">➤</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Panel des utilisateurs (optionnel) -->
                <div class="members-panel" id="membersPanel" style="display: none;">
                    <div class="members-header">
                        <h4>Membres du canal</h4>
                        <button onclick="discordChat.hideMemberList()">✕</button>
                    </div>
                    <div class="members-list" id="membersList">
                        <!-- Liste des membres -->
                    </div>
                </div>
                
                <!-- Contrôles vocaux -->
                <div class="voice-controls" id="voiceControls" style="display: none;">
                    <div class="voice-info">
                        <span class="voice-channel-name" id="voiceChannelName"></span>
                        <span class="voice-users-count" id="voiceUsersCount"></span>
                    </div>
                    <div class="voice-buttons">
                        <button class="voice-btn" id="muteBtn" onclick="discordChat.toggleMute()" title="Couper/Activer le micro">
                            <span id="muteIcon">🎤</span>
                        </button>
                        <button class="voice-btn" id="deafenBtn" onclick="discordChat.toggleDeafen()" title="Couper/Activer le son">
                            <span id="deafenIcon">🔊</span>
                        </button>
                        <button class="voice-btn disconnect" onclick="discordChat.leaveVoiceChannel()" title="Quitter le canal vocal">
                            📞
                        </button>
                    </div>
                </div>
                
                <!-- Picker d'émojis -->
                <div class="emoji-picker" id="emojiPicker" style="display: none;">
                    <div class="emoji-categories">
                        <button class="emoji-category active" data-category="smileys">😀</button>
                        <button class="emoji-category" data-category="people">👤</button>
                        <button class="emoji-category" data-category="nature">🌿</button>
                        <button class="emoji-category" data-category="food">🍕</button>
                        <button class="emoji-category" data-category="activities">⚽</button>
                        <button class="emoji-category" data-category="travel">🚗</button>
                        <button class="emoji-category" data-category="objects">💡</button>
                        <button class="emoji-category" data-category="symbols">❤️</button>
                    </div>
                    <div class="emoji-grid" id="emojiGrid">
                        <!-- Les émojis seront affichés ici -->
                    </div>
                </div>
            </div>
        `;
    }

    initialize(username) {
        this.currentUser = username;
        this.updateChannelsList();
        this.updateOnlineUsers();
        this.loadChannelMessages(this.currentChannel);
        this.setupEventListeners();
        
        // Ajouter l'utilisateur à la liste des utilisateurs en ligne
        this.users.set(username, {
            username: username,
            status: 'online',
            avatar: this.generateAvatar(username),
            joinedAt: new Date()
        });
        
        // Message de bienvenue
        this.addSystemMessage(`${username} a rejoint le chat!`, this.currentChannel);
    }

    updateChannelsList() {
        const textChannelList = document.getElementById('textChannelList');
        const voiceChannelList = document.getElementById('voiceChannelList');
        
        if (textChannelList) {
            textChannelList.innerHTML = '';
            this.channels.forEach((channel, channelId) => {
                if (channel.type === 'text') {
                    const channelElement = this.createChannelElement(channelId, channel);
                    textChannelList.appendChild(channelElement);
                }
            });
        }
        
        if (voiceChannelList) {
            voiceChannelList.innerHTML = '';
            this.voiceChannels.forEach((channel, channelId) => {
                const channelElement = this.createVoiceChannelElement(channelId, channel);
                voiceChannelList.appendChild(channelElement);
            });
        }
    }

    createChannelElement(channelId, channel) {
        const div = document.createElement('div');
        div.className = `channel-item ${channelId === this.currentChannel ? 'active' : ''}`;
        div.innerHTML = `
            <span class="channel-icon">#</span>
            <span class="channel-name">${channel.name}</span>
            <div class="channel-actions">
                <button class="channel-action" onclick="discordChat.editChannel('${channelId}')" title="Modifier">⚙️</button>
                <button class="channel-action" onclick="discordChat.deleteChannel('${channelId}')" title="Supprimer">🗑️</button>
            </div>
        `;
        div.onclick = () => this.switchChannel(channelId);
        return div;
    }

    createVoiceChannelElement(channelId, channel) {
        const div = document.createElement('div');
        div.className = 'voice-channel-item';
        div.innerHTML = `
            <div class="voice-channel-header" onclick="discordChat.joinVoiceChannel('${channelId}')">
                <span class="voice-icon">🔊</span>
                <span class="voice-name">${channel.name}</span>
                <span class="voice-count">${channel.users.size}</span>
            </div>
            <div class="voice-users">
                ${Array.from(channel.users).map(user => `
                    <div class="voice-user">
                        <span class="voice-user-avatar">${this.generateAvatar(user)}</span>
                        <span class="voice-user-name">${user}</span>
                    </div>
                `).join('')}
            </div>
        `;
        return div;
    }

    switchChannel(channelId) {
        this.currentChannel = channelId;
        const channel = this.channels.get(channelId);
        
        // Mettre à jour l'interface
        document.getElementById('currentChannelName').textContent = channel.name;
        document.getElementById('currentChannelDescription').textContent = channel.description;
        document.getElementById('messageInput').placeholder = `Tapez votre message dans #${channel.name}...`;
        
        // Mettre à jour la liste des canaux
        this.updateChannelsList();
        
        // Charger les messages du canal
        this.loadChannelMessages(channelId);
    }

    loadChannelMessages(channelId) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messages = this.messages.get(channelId) || [];
        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            chatMessages.appendChild(messageElement);
        });
        
        // Faire défiler vers le bas
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.type || 'user'}`;
        
        if (message.type === 'system') {
            div.innerHTML = `
                <div class="system-message">
                    <span class="system-text">${message.content}</span>
                    <span class="message-time">${this.formatTime(message.timestamp)}</span>
                </div>
            `;
        } else {
            div.innerHTML = `
                <div class="message-avatar">${this.generateAvatar(message.username)}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-username">${message.username}</span>
                        <span class="message-time">${this.formatTime(message.timestamp)}</span>
                    </div>
                    <div class="message-text">${this.formatMessageContent(message.content)}</div>
                    ${message.attachments ? this.formatAttachments(message.attachments) : ''}
                    ${message.voiceMessage ? this.formatVoiceMessage(message.voiceMessage) : ''}
                </div>
                <div class="message-actions">
                    <button class="message-action" onclick="discordChat.reactToMessage('${message.id}', '👍')" title="Réagir">👍</button>
                    <button class="message-action" onclick="discordChat.replyToMessage('${message.id}')" title="Répondre">↩️</button>
                    ${message.username === this.currentUser ? 
                        `<button class="message-action" onclick="discordChat.deleteMessage('${message.id}')" title="Supprimer">🗑️</button>` : ''}
                </div>
            `;
        }
        
        return div;
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        
        if (!content) return;
        
        const message = {
            id: this.generateMessageId(),
            username: this.currentUser,
            content: content,
            timestamp: new Date(),
            channel: this.currentChannel,
            reactions: new Map(),
            attachments: null
        };
        
        // Ajouter le message à la liste
        const channelMessages = this.messages.get(this.currentChannel) || [];
        channelMessages.push(message);
        this.messages.set(this.currentChannel, channelMessages);
        
        // Afficher le message
        const messageElement = this.createMessageElement(message);
        document.getElementById('chatMessages').appendChild(messageElement);
        
        // Vider l'input
        input.value = '';
        
        // Faire défiler vers le bas
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Sauvegarder dans localStorage
        this.saveMessages();
        
        // Simulation d'envoi aux autres utilisateurs
        this.simulateMessageBroadcast(message);
    }

    addSystemMessage(content, channelId = this.currentChannel) {
        const message = {
            id: this.generateMessageId(),
            type: 'system',
            content: content,
            timestamp: new Date(),
            channel: channelId
        };
        
        const channelMessages = this.messages.get(channelId) || [];
        channelMessages.push(message);
        this.messages.set(channelId, channelMessages);
        
        if (channelId === this.currentChannel) {
            const messageElement = this.createMessageElement(message);
            document.getElementById('chatMessages').appendChild(messageElement);
            
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        this.saveMessages();
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    handleTyping() {
        // Simulation de l'indicateur de saisie
        this.showTypingIndicator();
        
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.hideTypingIndicator();
        }, 2000);
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        const text = indicator.querySelector('.typing-text');
        text.textContent = `${this.currentUser} est en train de taper...`;
        indicator.style.display = 'block';
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'none';
    }

    // Système vocal
    setupVoiceSystem() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            this.voiceSupported = true;
        } else {
            this.voiceSupported = false;
            console.warn('Voice chat not supported in this browser');
        }
    }

    async joinVoiceChannel(channelId) {
        if (!this.voiceSupported) {
            this.showNotification('Le chat vocal n\'est pas supporté par votre navigateur', 'error');
            return;
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.voiceConnection = stream;
            this.isInVoiceChannel = true;
            
            // Ajouter l'utilisateur au canal vocal
            const channel = this.voiceChannels.get(channelId);
            channel.users.add(this.currentUser);
            
            // Afficher les contrôles vocaux
            this.showVoiceControls(channelId);
            
            // Mettre à jour l'affichage
            this.updateChannelsList();
            
            this.showNotification(`Connecté au ${channel.name}`, 'success');
        } catch (error) {
            this.showNotification('Impossible d\'accéder au microphone', 'error');
        }
    }

    leaveVoiceChannel() {
        if (this.voiceConnection) {
            this.voiceConnection.getTracks().forEach(track => track.stop());
            this.voiceConnection = null;
        }
        
        this.isInVoiceChannel = false;
        
        // Retirer l'utilisateur de tous les canaux vocaux
        this.voiceChannels.forEach(channel => {
            channel.users.delete(this.currentUser);
        });
        
        // Cacher les contrôles vocaux
        this.hideVoiceControls();
        
        // Mettre à jour l'affichage
        this.updateChannelsList();
        
        this.showNotification('Déconnecté du canal vocal', 'info');
    }

    showVoiceControls(channelId) {
        const controls = document.getElementById('voiceControls');
        const channelName = document.getElementById('voiceChannelName');
        const usersCount = document.getElementById('voiceUsersCount');
        
        const channel = this.voiceChannels.get(channelId);
        channelName.textContent = channel.name;
        usersCount.textContent = `${channel.users.size} utilisateur(s)`;
        
        controls.style.display = 'flex';
    }

    hideVoiceControls() {
        document.getElementById('voiceControls').style.display = 'none';
    }

    toggleMute() {
        if (!this.voiceConnection) return;
        
        const audioTracks = this.voiceConnection.getAudioTracks();
        const isMuted = !audioTracks[0].enabled;
        
        audioTracks.forEach(track => {
            track.enabled = isMuted;
        });
        
        const muteIcon = document.getElementById('muteIcon');
        muteIcon.textContent = isMuted ? '🎤' : '🔇';
        
        this.showNotification(isMuted ? 'Micro activé' : 'Micro coupé', 'info');
    }

    toggleDeafen() {
        // Simulation du deafen
        this.isDeafened = !this.isDeafened;
        const deafenIcon = document.getElementById('deafenIcon');
        deafenIcon.textContent = this.isDeafened ? '🔇' : '🔊';
        
        this.showNotification(this.isDeafened ? 'Son coupé' : 'Son activé', 'info');
    }

    // Enregistrement vocal
    toggleVoiceRecording() {
        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.sendVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            const recordBtn = document.getElementById('voiceRecordBtn');
            recordBtn.textContent = '⏹️';
            recordBtn.style.background = '#ff4444';
            
            this.showNotification('Enregistrement en cours...', 'info');
        } catch (error) {
            this.showNotification('Impossible d\'enregistrer l\'audio', 'error');
        }
    }

    stopVoiceRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            const recordBtn = document.getElementById('voiceRecordBtn');
            recordBtn.textContent = '🎤';
            recordBtn.style.background = '';
        }
    }

    sendVoiceMessage(audioBlob) {
        const message = {
            id: this.generateMessageId(),
            username: this.currentUser,
            content: '[Message vocal]',
            timestamp: new Date(),
            channel: this.currentChannel,
            voiceMessage: {
                blob: audioBlob,
                duration: '00:05' // Simulation
            }
        };
        
        const channelMessages = this.messages.get(this.currentChannel) || [];
        channelMessages.push(message);
        this.messages.set(this.currentChannel, channelMessages);
        
        const messageElement = this.createMessageElement(message);
        document.getElementById('chatMessages').appendChild(messageElement);
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        this.showNotification('Message vocal envoyé', 'success');
    }

    // Gestion des canaux
    createTextChannel() {
        const name = prompt('Nom du nouveau canal textuel:');
        if (!name) return;
        
        const channelId = name.toLowerCase().replace(/\s+/g, '-');
        if (this.channels.has(channelId)) {
            this.showNotification('Un canal avec ce nom existe déjà', 'error');
            return;
        }
        
        this.channels.set(channelId, {
            name: name,
            type: 'text',
            description: `Canal ${name}`,
            created: new Date(),
            permissions: ['everyone']
        });
        
        this.messages.set(channelId, []);
        this.updateChannelsList();
        this.addSystemMessage(`Canal #${name} créé!`, 'général');
        
        this.showNotification(`Canal #${name} créé`, 'success');
    }

    createVoiceChannel() {
        const name = prompt('Nom du nouveau canal vocal:');
        if (!name) return;
        
        const channelId = name.toLowerCase().replace(/\s+/g, '-');
        if (this.voiceChannels.has(channelId)) {
            this.showNotification('Un canal vocal avec ce nom existe déjà', 'error');
            return;
        }
        
        this.voiceChannels.set(channelId, {
            name: name,
            type: 'voice',
            users: new Set(),
            maxUsers: 10
        });
        
        this.updateChannelsList();
        this.addSystemMessage(`Canal vocal "${name}" créé!`, 'général');
        
        this.showNotification(`Canal vocal "${name}" créé`, 'success');
    }

    deleteChannel(channelId) {
        if (!confirm(`Supprimer le canal #${this.channels.get(channelId).name}?`)) return;
        
        this.channels.delete(channelId);
        this.messages.delete(channelId);
        
        if (this.currentChannel === channelId) {
            this.switchChannel('général');
        }
        
        this.updateChannelsList();
        this.showNotification('Canal supprimé', 'success');
    }

    // Utilitaires
    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateAvatar(username) {
        const colors = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪'];
        const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatMessageContent(content) {
        // Formatter les mentions, liens, etc.
        return content
            .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/:([\w\+\-]+):/g, (match, emoji) => {
                const emojiMap = {
                    smile: '😄', wink: '😉', heart: '❤️', thumbs_up: '👍'
                };
                return emojiMap[emoji] || match;
            });
    }

    formatAttachments(attachments) {
        return attachments.map(attachment => `
            <div class="message-attachment">
                <span class="attachment-icon">📎</span>
                <span class="attachment-name">${attachment.name}</span>
            </div>
        `).join('');
    }

    formatVoiceMessage(voiceMessage) {
        return `
            <div class="voice-message">
                <button class="voice-play" onclick="this.querySelector('audio').play()">
                    ▶️ Message vocal (${voiceMessage.duration})
                </button>
                <audio controls style="display: none;">
                    <source src="${URL.createObjectURL(voiceMessage.blob)}" type="audio/wav">
                </audio>
            </div>
        `;
    }

    updateOnlineUsers() {
        const usersList = document.getElementById('onlineUsersList');
        const userCount = document.getElementById('userCount');
        
        if (usersList) {
            usersList.innerHTML = Array.from(this.users.values()).map(user => `
                <div class="online-user">
                    <span class="user-avatar">${this.generateAvatar(user.username)}</span>
                    <span class="user-name">${user.username}</span>
                    <span class="user-status-indicator ${user.status}"></span>
                </div>
            `).join('');
        }
        
        if (userCount) {
            userCount.textContent = this.users.size;
        }
    }

    setupEventListeners() {
        // Fermer les menus quand on clique ailleurs
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.emoji-picker')) {
                document.getElementById('emojiPicker').style.display = 'none';
            }
        });
    }

    openEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
        
        if (picker.style.display === 'block') {
            this.loadEmojis('smileys');
        }
    }

    loadEmojis(category) {
        const emojiGrid = document.getElementById('emojiGrid');
        const emojis = {
            smileys: ['😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇', '😈', '😉', '😊', '😋'],
            people: ['👤', '👥', '👦', '👧', '👨', '👩', '👪', '👫', '👬', '👭', '👮', '👯'],
            nature: ['🌿', '🌱', '🌲', '🌳', '🌴', '🌵', '🌶', '🌷', '🌸', '🌹', '🌺', '🌻'],
            food: ['🍕', '🍔', '🍟', '🍗', '🍖', '🍝', '🍜', '🍛', '🍚', '🍙', '🍘', '🍗'],
            activities: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒'],
            travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚'],
            objects: ['💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙'],
            symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕']
        };
        
        emojiGrid.innerHTML = (emojis[category] || []).map(emoji => 
            `<button class="emoji-btn" onclick="discordChat.insertEmoji('${emoji}')">${emoji}</button>`
        ).join('');
    }

    insertEmoji(emoji) {
        const input = document.getElementById('messageInput');
        input.value += emoji;
        input.focus();
        document.getElementById('emojiPicker').style.display = 'none';
    }

    saveMessages() {
        const messagesData = {};
        this.messages.forEach((messages, channelId) => {
            messagesData[channelId] = messages;
        });
        localStorage.setItem('tonios_chat_messages', JSON.stringify(messagesData));
    }

    loadMessages() {
        const saved = localStorage.getItem('tonios_chat_messages');
        if (saved) {
            const messagesData = JSON.parse(saved);
            Object.entries(messagesData).forEach(([channelId, messages]) => {
                this.messages.set(channelId, messages);
            });
        }
    }

    simulateMessageBroadcast(message) {
        // Simulation de la réception de messages d'autres utilisateurs
        setTimeout(() => {
            if (Math.random() > 0.7) { // 30% de chance de réponse automatique
                const botResponses = [
                    'Intéressant! 🤔',
                    'Je suis d\'accord 👍',
                    'Bonne idée!',
                    'Hmm, que veux-tu dire par là?',
                    'Cool! 😎'
                ];
                
                const botMessage = {
                    id: this.generateMessageId(),
                    username: 'ToniBot',
                    content: botResponses[Math.floor(Math.random() * botResponses.length)],
                    timestamp: new Date(),
                    channel: this.currentChannel,
                    reactions: new Map()
                };
                
                const channelMessages = this.messages.get(this.currentChannel) || [];
                channelMessages.push(botMessage);
                this.messages.set(this.currentChannel, channelMessages);
                
                if (this.currentChannel === message.channel) {
                    const messageElement = this.createMessageElement(botMessage);
                    document.getElementById('chatMessages').appendChild(messageElement);
                    
                    const chatMessages = document.getElementById('chatMessages');
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
        }, 1000 + Math.random() * 3000);
    }

    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        }
    }
}

// Instance globale du chat Discord
window.discordChat = new DiscordLikeChat();
