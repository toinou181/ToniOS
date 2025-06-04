// ===============================================
// SYSTÈME DE NOTIFICATIONS
// ===============================================

let notificationQueue = [];
let isShowingNotification = false;

function showNotification(message, type = 'info', duration = 3000) {
    // Vérifier les préférences utilisateur
    if (currentSession && !currentSession.preferences.notifications) {
        return;
    }

    const notification = {
        id: Date.now() + Math.random(),
        message: message,
        type: type,
        duration: duration,
        timestamp: new Date().toISOString()
    };

    notificationQueue.push(notification);
    
    if (!isShowingNotification) {
        processNotificationQueue();
    }
}

function processNotificationQueue() {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }

    isShowingNotification = true;
    const notification = notificationQueue.shift();
    displayNotification(notification);
}

function displayNotification(notification) {
    // Créer l'élément de notification
    const notificationEl = document.createElement('div');
    notificationEl.className = `tonios-notification tonios-notification-${notification.type}`;
    notificationEl.id = 'notification_' + notification.id;
    
    // Icône selon le type
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    
    const icon = icons[notification.type] || icons.info;
    
    notificationEl.innerHTML = `
        <div class="tonios-notification-content">
            <span class="tonios-notification-icon">${icon}</span>
            <span class="tonios-notification-message">${notification.message}</span>
            <button onclick="closeNotification('${notification.id}')" class="tonios-notification-close">×</button>
        </div>
        <div class="tonios-notification-progress"></div>
    `;

    // Positionner la notification
    notificationEl.style.position = 'fixed';
    notificationEl.style.top = '20px';
    notificationEl.style.right = '-400px'; // Commencer hors écran
    notificationEl.style.zIndex = '10000';
    notificationEl.style.transition = 'right 0.3s ease';

    document.body.appendChild(notificationEl);

    // Animation d'entrée
    setTimeout(() => {
        notificationEl.style.right = '20px';
    }, 100);

    // Barre de progression
    const progressBar = notificationEl.querySelector('.tonios-notification-progress');
    if (progressBar && notification.duration > 0) {
        progressBar.style.transition = `width ${notification.duration}ms linear`;
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 100);
    }

    // Son de notification si activé
    if (currentSession && currentSession.preferences.soundEnabled) {
        playNotificationSound(notification.type);
    }

    // Auto-fermeture
    if (notification.duration > 0) {
        setTimeout(() => {
            closeNotification(notification.id);
        }, notification.duration);
    }
}

function closeNotification(notificationId) {
    const notificationEl = document.getElementById('notification_' + notificationId);
    if (notificationEl) {
        // Animation de sortie
        notificationEl.style.right = '-400px';
        notificationEl.style.opacity = '0';
        
        setTimeout(() => {
            notificationEl.remove();
            // Traiter la notification suivante
            setTimeout(processNotificationQueue, 100);
        }, 300);
    }
}

function playNotificationSound(type) {
    try {
        // Créer un contexte audio simple
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Fréquences selon le type
        const frequencies = {
            info: [800, 600],
            success: [600, 800, 1000],
            warning: [400, 600, 400],
            error: [200, 150]
        };
        
        const freq = frequencies[type] || frequencies.info;
        
        // Jouer la séquence de notes
        let time = audioContext.currentTime;
        freq.forEach((frequency, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(frequency, time);
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            
            osc.start(time);
            osc.stop(time + 0.1);
            
            time += 0.12;
        });
        
    } catch (error) {
        // Fallback silencieux si l'audio n'est pas supporté
        console.log('Son de notification non disponible');
    }
}

// Notifications système spéciales
function showWelcomeNotification() {
    if (!currentSession) return;
    
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = 'Bonjour';
    else if (hour < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';
    
    showNotification(`${greeting} ${currentSession.username} ! 🌟 Bienvenue sur ToniOS`, 'success', 4000);
    
    // Notification des nouvelles fonctionnalités si première connexion
    if (currentSession.loginCount === 1) {
        setTimeout(() => {
            showNotification('💡 Conseil : Utilisez Ctrl+Shift+C pour ouvrir la calculatrice !', 'info', 5000);
        }, 2000);
        
        setTimeout(() => {
            showNotification('🎮 Explorez les raccourcis clavier avec F1 !', 'info', 5000);
        }, 4000);
    }
}

function showAchievementNotification(achievement) {
    showNotification(`🏆 Succès débloqué : ${achievement}`, 'success', 4000);
}

function showSystemNotification(message, type = 'info') {
    showNotification(`⚙️ Système : ${message}`, type);
}

function showChatNotification(user, message, channel = '') {
    if (currentSession && currentSession.preferences.notifications) {
        const channelText = channel ? ` (#${channel})` : '';
        showNotification(`💬 ${user}${channelText}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`, 'info', 2000);
    }
}

// Gestion des permissions de notification
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showNotification('Notifications du navigateur activées ! 🔔', 'success');
                } else {
                    showNotification('Notifications du navigateur refusées', 'warning');
                }
            });
        }
    }
}

function showBrowserNotification(title, message, icon = null) {
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            const notification = new Notification(title, {
                body: message,
                icon: icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🖥️</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💻</text></svg>',
                tag: 'tonios-notification',
                requireInteraction: false
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            setTimeout(() => {
                notification.close();
            }, 5000);
            
        } catch (error) {
            console.log('Notification navigateur échouée:', error);
        }
    }
}

// Initialisation des notifications
function initializeNotifications() {
    // Vérifier les permissions au démarrage
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            if (confirm('ToniOS souhaite vous envoyer des notifications. Autoriser ?')) {
                requestNotificationPermission();
            }
        }, 3000);
    }
    
    // Créer le conteneur de notifications s'il n'existe pas
    if (!document.querySelector('.tonios-notifications-container')) {
        const container = document.createElement('div');
        container.className = 'tonios-notifications-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
}

// Types de notifications prédéfinies
const NotificationTypes = {
    FILE_SAVED: (filename) => showNotification(`💾 Fichier "${filename}" sauvegardé`, 'success'),
    FILE_DELETED: (filename) => showNotification(`🗑️ Fichier "${filename}" supprimé`, 'info'),
    USER_JOINED: (username) => showNotification(`👋 ${username} a rejoint le chat`, 'info'),
    USER_LEFT: (username) => showNotification(`👋 ${username} a quitté le chat`, 'info'),
    CALCULATION_ERROR: () => showNotification('❌ Erreur de calcul', 'error'),
    SHORTCUT_USED: (shortcut) => showNotification(`⌨️ Raccourci utilisé : ${shortcut}`, 'info', 1000),
    CONNECTION_ERROR: () => showNotification('🌐 Problème de connexion', 'error'),
    PERMISSION_DENIED: (action) => showNotification(`🚫 Permission refusée : ${action}`, 'warning'),
    FEATURE_UNLOCKED: (feature) => showNotification(`✨ Nouvelle fonctionnalité : ${feature}`, 'success'),
    BACKUP_CREATED: () => showNotification('💾 Sauvegarde créée avec succès', 'success'),
    BACKUP_RESTORED: () => showNotification('📥 Sauvegarde restaurée avec succès', 'success')
};
