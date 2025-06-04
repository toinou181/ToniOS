// ===============================================
// SYSTÈME DE CHAT ET CANAUX
// ===============================================

// Variables pour le système de canaux
let currentChannel = 'general';
let currentChannelType = 'text';
let channels = {
    text: {
        general: {
            name: 'général',
            description: 'Canal principal de discussion',
            messages: []
        },
        tech: {
            name: 'tech',
            description: 'Discussions techniques',
            messages: []
        },
        random: {
            name: 'random',
            description: 'Discussions libres',
            messages: []
        }
    },
    voice: {
        salon1: {
            name: 'Salon général',
            description: 'Salon vocal principal',
            users: []
        },
        salon2: {
            name: 'Salle de réunion',
            description: 'Pour les réunions',
            users: []
        }
    }
};

// Variables pour le chat vocal
let isRecording = false;
let isMicrophoneEnabled = true;
let isSpeakerEnabled = true;
let mediaRecorder;
let audioChunks = [];
let currentVoiceChannel = null;
let speechRecognition;
let speechSynthesis = window.speechSynthesis;

// Messages du chat
let chatMessages = [];

// Gestion des canaux texte
function switchChannel(channelId, channelType = 'text') {
    if (channelType === 'text') {
        // Désactiver le canal actuel
        document.querySelectorAll('.tonios-chat-channel').forEach(ch => {
            ch.classList.remove('active');
        });

        // Activer le nouveau canal
        const channelElement = document.querySelector(`[data-channel="${channelId}"]`);
        if (channelElement) {
            channelElement.classList.add('active');
        }

        // Mettre à jour les informations du canal
        currentChannel = channelId;
        currentChannelType = channelType;
        
        const channelInfo = channels.text[channelId];
        if (channelInfo) {
            document.getElementById('currentChannelIcon').textContent = '#';
            document.getElementById('currentChannelName').textContent = channelInfo.name;
            document.getElementById('channelDescription').textContent = channelInfo.description;
            document.getElementById('chatInput').placeholder = `Tapez votre message dans #${channelInfo.name}...`;

            // Charger les messages du canal
            loadChannelMessages(channelId);

            // Message système de changement de canal
            addSystemMessage(`Vous avez rejoint le canal #${channelInfo.name}`);
            
            showNotification(`Canal changé vers #${channelInfo.name}`);
        }
    }
}

function createNewChannel() {
    if (!currentSession || !currentSession.hasPermission('createChannel')) {
        showNotification('Permission refusée - Vous ne pouvez pas créer de canaux', 'error');
        return;
    }

    const channelName = prompt('Nom du nouveau canal (sans espaces ni caractères spéciaux) :');
    if (channelName && channelName.trim()) {
        const cleanName = channelName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanName && !channels.text[cleanName]) {
            // Créer le nouveau canal
            channels.text[cleanName] = {
                name: cleanName,
                description: `Canal ${cleanName} créé par ${getCurrentUser()}`,
                messages: [],
                createdBy: getCurrentUser(),
                createdAt: new Date().toISOString(),
                moderatedBy: currentSession.role === 'admin' ? [getCurrentUser()] : []
            };

            // Ajouter à l'interface
            const channelsList = document.getElementById('textChannelsList');
            const newChannelElement = document.createElement('div');
            newChannelElement.className = 'tonios-chat-channel';
            newChannelElement.setAttribute('data-channel', cleanName);
            newChannelElement.onclick = () => switchChannel(cleanName, 'text');
            newChannelElement.innerHTML = `
                <span class="tonios-chat-channel-icon">#</span>
                ${cleanName}
                ${currentSession.hasPermission('deleteChannel') ? `<button onclick="deleteChannel('${cleanName}')" style="margin-left: auto; background: none; border: none; color: #e74c3c; cursor: pointer; opacity: 0.7;">×</button>` : ''}
            `;
            channelsList.appendChild(newChannelElement);

            // Message système dans tous les canaux
            Object.keys(channels.text).forEach(channelId => {
                channels.text[channelId].messages.push({
                    type: 'system',
                    message: `📢 Le canal #${cleanName} a été créé par ${getCurrentUser()}`,
                    timestamp: new Date().toISOString(),
                    moderator: getCurrentUser()
                });
            });

            // Statistiques utilisateur
            currentSession.chatStats.channelsCreated++;
            currentSession.addAchievement('Créateur de communauté');

            showNotification(`Canal #${cleanName} créé avec succès ! ✨`);
            
            // Sauvegarder
            saveChannelsData();
            saveUserData();
            
            // Basculer vers le nouveau canal
            switchChannel(cleanName, 'text');
        } else {
            showNotification('Ce nom de canal existe déjà ou est invalide', 'error');
        }
    }
}

function deleteChannel(channelId) {
    if (!currentSession || !currentSession.hasPermission('deleteChannel')) {
        showNotification('Permission refusée', 'error');
        return;
    }

    if (['general', 'tech', 'random'].includes(channelId)) {
        showNotification('Impossible de supprimer les canaux par défaut', 'error');
        return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le canal #${channelId} ?`)) {
        // Supprimer le canal
        delete channels.text[channelId];
        
        // Supprimer de l'interface
        const channelElement = document.querySelector(`[data-channel="${channelId}"]`);
        if (channelElement) {
            channelElement.remove();
        }

        // Message système
        Object.keys(channels.text).forEach(chId => {
            channels.text[chId].messages.push({
                type: 'system',
                message: `🗑️ Le canal #${channelId} a été supprimé par ${getCurrentUser()}`,
                timestamp: new Date().toISOString(),
                moderator: getCurrentUser()
            });
        });

        // Retourner au canal général si on était dans le canal supprimé
        if (currentChannel === channelId) {
            switchChannel('general', 'text');
        }

        logModerationAction('deleteChannel', 'N/A', `Canal #${channelId} supprimé`);
        showNotification(`Canal #${channelId} supprimé`, 'info');
        saveChannelsData();
    }
}

// Gestion des messages de chat
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!currentSession) {
        showNotification('Vous devez être connecté pour envoyer des messages', 'error');
        return;
    }

    // Vérifier si le message est une commande
    if (message.startsWith('/')) {
        handleChatCommand(message);
        input.value = '';
        return;
    }

    // Ajouter le message au canal actuel
    const chatMessage = {
        id: Date.now() + Math.random(),
        user: getCurrentUser(),
        message: message,
        timestamp: new Date().toISOString(),
        channel: currentChannel,
        isOwn: true,
        type: 'text'
    };

    // Ajouter au canal actuel
    if (channels.text[currentChannel]) {
        channels.text[currentChannel].messages.push(chatMessage);
    }
    
    // Ajouter à la liste globale
    chatMessages.push(chatMessage);
    
    // Afficher le message
    addChatMessage(chatMessage.user, chatMessage.message, chatMessage.isOwn);
    
    // Statistiques
    if (currentSession) {
        currentSession.chatStats.messagesCount++;
        
        // Succès pour les messages
        if (currentSession.chatStats.messagesCount === 10) {
            currentSession.addAchievement('Premier bavard');
        } else if (currentSession.chatStats.messagesCount === 100) {
            currentSession.addAchievement('Grand bavard');
        }
    }
    
    // Vider l'input
    input.value = '';
    
    // Sauvegarder
    saveChannelsData();
    saveUserData();
    
    // Notification pour les autres utilisateurs (simulation)
    if (Math.random() > 0.7) {
        setTimeout(() => {
            simulateUserResponse();
        }, 1000 + Math.random() * 3000);
    }
}

function addChatMessage(user, message, isOwn = false) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = `tonios-chat-message ${isOwn ? 'own' : ''}`;
    
    const time = new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageEl.innerHTML = `
        <div class="tonios-chat-message-header">
            <span class="tonios-chat-user">${user}</span>
            <span class="tonios-chat-time">${time}</span>
        </div>
        <div class="tonios-chat-message-content">${escapeHtml(message)}</div>
    `;
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Animation d'apparition
    messageEl.style.opacity = '0';
    messageEl.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
        messageEl.style.transition = 'all 0.3s ease';
        messageEl.style.opacity = '1';
        messageEl.style.transform = 'translateY(0)';
    });
}

function addSystemMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
        const messageEl = document.createElement('div');
        messageEl.className = 'tonios-chat-message system';
        messageEl.textContent = message;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Animation d'apparition
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateY(10px)';
        requestAnimationFrame(() => {
            messageEl.style.transition = 'all 0.3s ease';
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateY(0)';
        });
    }
}

function loadChannelMessages(channelId) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages && channels.text[channelId]) {
        const messages = channels.text[channelId].messages;
        chatMessages.innerHTML = '';

        if (messages.length === 0) {
            // Messages de bienvenue par défaut
            addSystemMessage(`Bienvenue dans le canal #${channels.text[channelId].name} ! 🎉`);
        } else {
            // Charger les messages sauvegardés
            messages.forEach(msg => {
                if (msg.type === 'system') {
                    addSystemMessage(msg.message);
                } else {
                    addChatMessage(msg.user, msg.message, msg.isOwn);
                }
            });
        }
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

// Commandes de chat
function handleChatCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
        case '/help':
            addSystemMessage(`
📋 Commandes disponibles :
/help - Afficher cette aide
/clear - Effacer les messages du canal
/me <action> - Action (ex: /me danse)
/time - Afficher l'heure
/users - Lister les utilisateurs connectés
/channel <nom> - Changer de canal
${currentSession?.hasPermission('warn') ? '/warn <utilisateur> <raison> - Avertir un utilisateur' : ''}
${currentSession?.hasPermission('kick') ? '/kick <utilisateur> <raison> - Exclure un utilisateur' : ''}
            `);
            break;
            
        case '/clear':
            if (channels.text[currentChannel]) {
                channels.text[currentChannel].messages = [];
                document.getElementById('chatMessages').innerHTML = '';
                addSystemMessage('Messages effacés');
                saveChannelsData();
            }
            break;
            
        case '/me':
            if (args.length > 0) {
                const action = args.join(' ');
                addSystemMessage(`* ${getCurrentUser()} ${action}`);
            }
            break;
            
        case '/time':
            const now = new Date();
            addSystemMessage(`🕐 Heure actuelle : ${now.toLocaleString('fr-FR')}`);
            break;
            
        case '/users':
            const usersList = Object.keys(allUsers).join(', ') || 'Aucun utilisateur connecté';
            addSystemMessage(`👥 Utilisateurs : ${usersList}`);
            break;
            
        case '/channel':
            if (args.length > 0) {
                const channelName = args[0].toLowerCase();
                if (channels.text[channelName]) {
                    switchChannel(channelName);
                } else {
                    addSystemMessage(`❌ Canal #${channelName} introuvable`);
                }
            }
            break;
            
        case '/warn':
            if (currentSession?.hasPermission('warn') && args.length >= 2) {
                const targetUser = args[0];
                const reason = args.slice(1).join(' ');
                warnUser(targetUser, reason);
            } else {
                addSystemMessage('❌ Permission refusée ou syntaxe incorrecte');
            }
            break;
            
        case '/kick':
            if (currentSession?.hasPermission('kick') && args.length >= 2) {
                const targetUser = args[0];
                const reason = args.slice(1).join(' ');
                kickUser(targetUser, reason);
            } else {
                addSystemMessage('❌ Permission refusée ou syntaxe incorrecte');
            }
            break;
            
        default:
            addSystemMessage(`❌ Commande inconnue : ${cmd}. Tapez /help pour l'aide`);
    }
}

// Simulation de réponses automatiques
function simulateUserResponse() {
    if (!channels.text[currentChannel]) return;
    
    const responses = [
        'Intéressant ! 🤔',
        'Je suis d\'accord 👍',
        'Bonne idée !',
        'Et vous, qu\'en pensez-vous ?',
        'C\'est vrai ça !',
        'Merci pour le partage 😊',
        'Super !',
        'Exactement !',
        '👏👏👏',
        'Très bon point !'
    ];
    
    const botUsers = ['Assistant', 'Bot_ToniOS', 'Système', 'IA_Helper'];
    const randomUser = botUsers[Math.floor(Math.random() * botUsers.length)];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const simulatedMessage = {
        id: Date.now() + Math.random(),
        user: randomUser,
        message: randomResponse,
        timestamp: new Date().toISOString(),
        channel: currentChannel,
        isOwn: false,
        type: 'text'
    };
    
    channels.text[currentChannel].messages.push(simulatedMessage);
    chatMessages.push(simulatedMessage);
    
    addChatMessage(simulatedMessage.user, simulatedMessage.message, false);
    saveChannelsData();
    
    // Notification sonore douce
    if (currentSession && currentSession.preferences.soundEnabled) {
        playNotificationSound('info');
    }
}

// Gestion des canaux vocaux
function createNewVoiceChannel() {
    const channelName = prompt('Nom du nouveau salon vocal :');
    if (channelName && channelName.trim()) {
        const cleanName = channelName.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
        const channelId = cleanName.replace(/ /g, '_');
        
        if (cleanName && !channels.voice[channelId]) {
            // Créer le nouveau salon vocal
            channels.voice[channelId] = {
                name: cleanName,
                description: `Salon vocal ${cleanName} créé par ${getCurrentUser()}`,
                users: []
            };

            // Ajouter à l'interface
            const voiceChannelsList = document.getElementById('voiceChannelsList');
            const newChannelElement = document.createElement('div');
            newChannelElement.className = 'tonios-chat-channel';
            newChannelElement.setAttribute('data-channel', channelId);
            newChannelElement.onclick = () => joinVoiceChannel(channelId);
            newChannelElement.innerHTML = `
                <span class="tonios-chat-channel-icon">🔊</span>
                ${cleanName}
            `;
            voiceChannelsList.appendChild(newChannelElement);

            showNotification(`Salon vocal "${cleanName}" créé avec succès ! 🎤`);
            saveChannelsData();
        } else {
            showNotification('Ce nom de salon existe déjà ou est invalide', 'error');
        }
    }
}

function joinVoiceChannel(channelId) {
    if (currentVoiceChannel === channelId) {
        // Quitter le salon vocal
        leaveVoiceChannel();
        return;
    }

    const voiceChannel = channels.voice[channelId];
    if (voiceChannel) {
        // Quitter l'ancien salon si connecté
        if (currentVoiceChannel) {
            leaveVoiceChannel();
        }

        currentVoiceChannel = channelId;
        
        // Ajouter l'utilisateur au salon
        if (!voiceChannel.users.includes(getCurrentUser())) {
            voiceChannel.users.push(getCurrentUser());
        }

        // Mettre à jour l'interface
        document.querySelectorAll('[data-channel]').forEach(ch => {
            ch.classList.remove('active');
        });
        const channelElement = document.querySelector(`[data-channel="${channelId}"]`);
        if (channelElement && channelElement.querySelector('.tonios-chat-channel-icon').textContent === '🔊') {
            channelElement.classList.add('active');
        }

        // Mettre à jour les informations du canal
        document.getElementById('currentChannelIcon').textContent = '🔊';
        document.getElementById('currentChannelName').textContent = voiceChannel.name;
        document.getElementById('channelDescription').textContent = voiceChannel.description;

        // Message système
        addSystemMessage(`Vous avez rejoint le salon vocal "${voiceChannel.name}"`);
        addSystemMessage(`Utilisateurs connectés : ${voiceChannel.users.join(', ')}`);

        showNotification(`Connecté au salon vocal "${voiceChannel.name}" 🎤`);

        // Initialiser l'audio si possible
        initializeAudio();
        saveChannelsData();
    }
}

function leaveVoiceChannel() {
    if (currentVoiceChannel) {
        const voiceChannel = channels.voice[currentVoiceChannel];
        if (voiceChannel) {
            // Retirer l'utilisateur du salon
            voiceChannel.users = voiceChannel.users.filter(user => user !== getCurrentUser());

            // Message système
            addSystemMessage(`Vous avez quitté le salon vocal "${voiceChannel.name}"`);
            showNotification(`Déconnecté du salon vocal 🔇`);
        }

        // Arrêter l'enregistrement si en cours
        if (isRecording) {
            stopVoiceRecording();
        }

        // Réinitialiser
        currentVoiceChannel = null;
        
        // Retour au canal texte
        switchChannel('general', 'text');
        saveChannelsData();
    }
}

// Initialisation des canaux
function initializeChannels() {
    // Charger les canaux sauvegardés
    loadChannelsData();
    
    // Créer l'interface des canaux texte
    const textChannelsList = document.getElementById('textChannelsList');
    if (textChannelsList) {
        textChannelsList.innerHTML = '';
        Object.keys(channels.text).forEach(channelId => {
            const channel = channels.text[channelId];
            const channelElement = document.createElement('div');
            channelElement.className = 'tonios-chat-channel';
            channelElement.setAttribute('data-channel', channelId);
            channelElement.onclick = () => switchChannel(channelId, 'text');
            channelElement.innerHTML = `
                <span class="tonios-chat-channel-icon">#</span>
                ${channel.name}
            `;
            textChannelsList.appendChild(channelElement);
        });
    }
    
    // Créer l'interface des canaux vocaux
    const voiceChannelsList = document.getElementById('voiceChannelsList');
    if (voiceChannelsList) {
        voiceChannelsList.innerHTML = '';
        Object.keys(channels.voice).forEach(channelId => {
            const channel = channels.voice[channelId];
            const channelElement = document.createElement('div');
            channelElement.className = 'tonios-chat-channel';
            channelElement.setAttribute('data-channel', channelId);
            channelElement.onclick = () => joinVoiceChannel(channelId);
            channelElement.innerHTML = `
                <span class="tonios-chat-channel-icon">🔊</span>
                ${channel.name}
            `;
            voiceChannelsList.appendChild(channelElement);
        });
    }
    
    // Activer le canal général par défaut
    switchChannel('general', 'text');
}

// Sauvegarde et chargement des données de canaux
function saveChannelsData() {
    localStorage.setItem('tonios_channels', JSON.stringify(channels));
    localStorage.setItem('tonios_chat_messages', JSON.stringify(chatMessages));
}

function loadChannelsData() {
    const savedChannels = localStorage.getItem('tonios_channels');
    const savedMessages = localStorage.getItem('tonios_chat_messages');
    
    if (savedChannels) {
        channels = JSON.parse(savedChannels);
    }
    
    if (savedMessages) {
        chatMessages = JSON.parse(savedMessages);
    }
}

// Utilitaires
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
