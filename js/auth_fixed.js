// ===============================================
// SYSTÈME DE SESSIONS ET AUTHENTIFICATION - VERSION CORRIGÉE
// ===============================================

let currentSession = null;
let allUsers = {};
let sessionStartTime = null;
let userPermissions = {
    moderator: ['kick', 'warn', 'deleteMessage', 'createChannel', 'deleteChannel'],
    admin: ['kick', 'warn', 'deleteMessage', 'createChannel', 'deleteChannel', 'promoteUser', 'ban'],
    user: ['createChannel']
};

// Clés pour le stockage local
const USERS_STORAGE_KEY = 'tonios_users';
const SESSION_STORAGE_KEY = 'tonios_current_session';
const REMEMBER_SESSION_KEY = 'tonios_remember_session';

// Structure d'un utilisateur
class UserSession {
    constructor(username, password = '', role = 'user') {
        this.username = username;
        this.password = this.hashPassword(password);
        this.role = role;
        this.avatar = this.generateAvatar();
        this.createdAt = new Date().toISOString();
        this.lastLogin = new Date().toISOString();
        this.loginCount = 1;
        this.preferences = {
            wallpaper: '',
            theme: 'default',
            notifications: true,
            soundEnabled: true,
            rememberSession: false
        };
        this.desktop = {
            icons: [
                { id: 'calculator', x: 20, y: 20, visible: true },
                { id: 'notepad', x: 20, y: 120, visible: true },
                { id: 'filemanager', x: 20, y: 220, visible: true },
                { id: 'wallpaper', x: 20, y: 320, visible: true },
                { id: 'chat', x: 20, y: 420, visible: true },
                { id: 'systemprops', x: 20, y: 520, visible: true }
            ],
            wallpaper: ''
        };
        this.chatStats = {
            messagesCount: 0,
            channelsCreated: 0,
            voiceMinutes: 0
        };
        this.files = [];
        this.achievements = [];
        this.sessionToken = this.generateSessionToken();
    }

    hashPassword(password) {
        if (!password) return '';
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    generateSessionToken() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateAvatar() {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        const color = colors[this.username.length % colors.length];
        return {
            color: color,
            letter: this.username.charAt(0).toUpperCase()
        };
    }

    hasPermission(action) {
        return userPermissions[this.role]?.includes(action) || false;
    }

    addAchievement(achievement) {
        if (!this.achievements.includes(achievement)) {
            this.achievements.push(achievement);
            showNotification(`🏆 Succès débloqué : ${achievement}`, 'success');
        }
    }
}

// Fonctions d'authentification principales
function loginUser(username, password, rememberSession = false) {
    if (!username) {
        showNotification('Veuillez entrer un nom d\'utilisateur', 'error');
        return { success: false };
    }

    // VÉRIFICATION D'ACCÈS ADMIN ULTRA-SÉCURISÉ
    if (window.adminSecurity && typeof window.checkAdminAccess === 'function') {
        const adminCheck = window.checkAdminAccess(password, username);
        if (adminCheck.success) {
            // Accès admin accordé via code spécial
            showNotification('🛡️ Accès administrateur détecté - Ouverture du dashboard sécurisé', 'success');
            
            // Continuer avec la connexion normale
            const existingUser = loadUser(username);
            if (existingUser) {
                currentSession = existingUser;
                currentSession.lastLogin = new Date().toISOString();
                currentSession.loginCount++;
                currentSession.role = 'admin'; // Promouvoir temporairement
                showNotification(`Admin connecté : ${username}`, 'success');
            } else {
                // Créer un compte admin temporaire
                currentSession = new UserSession(username, '', 'admin');
                showNotification(`Session admin temporaire créée pour ${username}`, 'info');
            }
            
            // Ouvrir le dashboard admin dans une nouvelle fenêtre après la connexion
            setTimeout(() => {
                if (window.openAdminDashboard()) {
                    showNotification('Dashboard admin ouvert dans une nouvelle fenêtre', 'info');
                } else {
                    showNotification('Erreur lors de l\'ouverture du dashboard admin', 'error');
                }
            }, 1000);
            
            // Sauvegarder et démarrer la session
            saveUser(currentSession);
            saveUsersToStorage();
            if (rememberSession) {
                localStorage.setItem(REMEMBER_SESSION_KEY, currentSession.username);
            }
            startSession();
            return { success: true, adminAccess: true };
        }
    }

    // Vérifier si l'utilisateur existe
    const existingUser = loadUser(username);
    
    if (existingUser) {
        // Connexion utilisateur existant
        const hashedPassword = new UserSession('', password).hashPassword(password);
        if (existingUser.password && existingUser.password !== '' && existingUser.password !== hashedPassword) {
            showNotification('Mot de passe incorrect', 'error');
            return { success: false };
        }
        
        currentSession = existingUser;
        currentSession.lastLogin = new Date().toISOString();
        currentSession.loginCount++;
        currentSession.preferences.rememberSession = rememberSession;
        showNotification(`Bon retour ${username} ! (${currentSession.loginCount}e connexion)`, 'success');
    } else {
        // Création d'un nouvel utilisateur
        currentSession = new UserSession(username, password);
        currentSession.preferences.rememberSession = rememberSession;
        showNotification(`Bienvenue ${username} ! Votre session a été créée.`, 'success');
        
        // Donner les privilèges admin au premier utilisateur
        loadUsersFromStorage();
        if (Object.keys(allUsers).length === 0) {
            currentSession.role = 'admin';
            showNotification('Vous êtes le premier utilisateur - privilèges administrateur accordés !', 'info');
        }
    }

    // Sauvegarder l'utilisateur
    saveUser(currentSession);
    saveUsersToStorage();
    
    // Gérer la session persistante
    if (rememberSession) {
        localStorage.setItem(REMEMBER_SESSION_KEY, currentSession.username);
    } else {
        localStorage.removeItem(REMEMBER_SESSION_KEY);
    }
    
    return { success: true };
}

function registerUser(username, password, rememberSession = false) {
    if (!username || !password) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return { success: false };
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = loadUser(username);
    if (existingUser) {
        showNotification('Ce nom d\'utilisateur existe déjà', 'error');
        return { success: false };
    }

    // Créer le nouvel utilisateur
    currentSession = new UserSession(username, password);
    currentSession.preferences.rememberSession = rememberSession;
    
    // Donner les privilèges admin au premier utilisateur
    loadUsersFromStorage();
    if (Object.keys(allUsers).length === 0) {
        currentSession.role = 'admin';
        showNotification('Vous êtes le premier utilisateur - privilèges administrateur accordés !', 'info');
    }

    // Sauvegarder l'utilisateur
    saveUser(currentSession);
    saveUsersToStorage();
    
    // Gérer la session persistante
    if (rememberSession) {
        localStorage.setItem(REMEMBER_SESSION_KEY, currentSession.username);
    }
    
    showNotification(`Inscription réussie ! Bienvenue ${username} !`, 'success');
    return { success: true };
}

// Gestionnaires d'événements des formulaires
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const rememberSession = document.getElementById('rememberSession').checked;

    const result = loginUser(username, password, rememberSession);
    if (result.success) {
        startSession();
    }
}

function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsernameInput').value.trim();
    const password = document.getElementById('regPasswordInput').value;
    const confirmPassword = document.getElementById('regConfirmPasswordInput').value;
    const rememberSession = document.getElementById('regRememberSession').checked;
    
    if (!username || !password) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    const result = registerUser(username, password, rememberSession);
    if (result.success) {
        startSession();
    }
}

// Connexion rapide
function quickLogin(type) {
    let username, role;
    
    switch(type) {
        case 'demo':
            username = 'Démo_' + Math.floor(Math.random() * 1000);
            role = 'user';
            break;
        case 'guest':
            username = 'Invité_' + Math.floor(Math.random() * 1000);
            role = 'user';
            break;
        case 'moderator':
            username = 'Modérateur_' + Math.floor(Math.random() * 100);
            role = 'moderator';
            break;
        case 'admin':
            username = 'Admin_' + Math.floor(Math.random() * 100);
            role = 'admin';
            break;
        default:
            return;
    }
    
    currentSession = new UserSession(username, '', role);
    saveUser(currentSession);
    saveUsersToStorage();
    startSession();
    showNotification(`Connexion rapide en tant que ${role}: ${username}`, 'info');
}

// Démarrage de session
function startSession() {
    sessionStartTime = Date.now();
    window.toniosStartTime = sessionStartTime;
    
    // Masquer l'écran de connexion
    document.getElementById('loginScreen').style.display = 'none';
    document.querySelector('.tonios-desktop').style.display = 'flex';
    
    // Charger les données utilisateur
    loadUserData();
    
    // Initialiser le bureau
    updateDesktopInfo();
    setupEventListeners();
    setupKeyboardShortcuts();
    initializeChannels();
    
    // Réinitialiser les événements des icônes du bureau
    reinitializeDesktopEvents();
    
    // Initialiser ToniOS si la fonction existe
    if (typeof initializeToniOS === 'function') {
        initializeToniOS();
    }
    
    // Démarrer l'horloge
    if (typeof startClock === 'function') {
        startClock();
    }
    
    // Message de bienvenue personnalisé
    setTimeout(() => {
        const hour = new Date().getHours();
        let greeting;
        if (hour < 12) greeting = 'Bonjour';
        else if (hour < 18) greeting = 'Bon après-midi';
        else greeting = 'Bonsoir';
        
        showNotification(`${greeting} ${currentSession.username} ! 🌟 Bienvenue sur ToniOS`, 'info');
    }, 1000);
}

// Déconnexion
function logout() {
    if (currentSession) {
        // Sauvegarder les données avant de se déconnecter
        if (typeof saveUserData === 'function') {
            saveUserData();
        }
        
        // Fermer toutes les fenêtres
        if (typeof openWindows !== 'undefined') {
            openWindows = [];
        }
        document.querySelectorAll('.tonios-window').forEach(win => win.remove());
        
        // Réinitialiser les variables
        currentSession = null;
        sessionStartTime = null;
        
        // Effacer la session persistante
        localStorage.removeItem(REMEMBER_SESSION_KEY);
        
        // Afficher l'écran de connexion
        document.querySelector('.tonios-desktop').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        
        // Effacer les champs
        document.getElementById('usernameInput').value = '';
        document.getElementById('passwordInput').value = '';
        if (document.getElementById('regUsernameInput')) {
            document.getElementById('regUsernameInput').value = '';
            document.getElementById('regPasswordInput').value = '';
            document.getElementById('regConfirmPasswordInput').value = '';
        }
        
        showNotification('Déconnexion réussie ! À bientôt ! 👋', 'info');
    }
}

// Fonctions utilitaires
function getCurrentUser() {
    return currentSession ? currentSession.username : 'Invité';
}

function getCurrentUserRole() {
    return currentSession ? currentSession.role : 'guest';
}

function saveUser(user) {
    allUsers[user.username] = user;
    localStorage.setItem(`tonios_user_${user.username}`, JSON.stringify(user));
}

function loadUser(username) {
    const userData = localStorage.getItem(`tonios_user_${username}`);
    if (userData) {
        try {
            const user = JSON.parse(userData);
            // Recréer l'objet UserSession avec les méthodes
            const userSession = new UserSession(user.username, '', user.role);
            // Copier toutes les propriétés existantes (y compris le mot de passe hashé)
            Object.assign(userSession, user);
            allUsers[username] = userSession;
            return userSession;
        } catch (error) {
            console.error('Erreur chargement utilisateur:', error);
            return null;
        }
    }
    return null;
}

function updateDesktopInfo() {
    if (!currentSession) return;
    
    const sessionUsername = document.getElementById('sessionUsername');
    const sessionAvatar = document.getElementById('sessionAvatar');
    
    if (sessionUsername) sessionUsername.textContent = currentSession.username;
    if (sessionAvatar) {
        sessionAvatar.style.backgroundColor = currentSession.avatar.color;
        sessionAvatar.textContent = currentSession.avatar.letter;
    }
}

// Fonction pour réinitialiser les événements des icônes du bureau
function reinitializeDesktopEvents() {
    // Réattacher les événements aux icônes du bureau
    const desktopIcons = document.querySelectorAll('.tonios-desktop-icon');
    desktopIcons.forEach(icon => {
        const onclickAttr = icon.getAttribute('onclick');
        if (onclickAttr) {
            // Supprimer l'ancien gestionnaire d'événements
            icon.removeAttribute('onclick');
            
            // Ajouter un nouveau gestionnaire d'événements
            icon.addEventListener('click', function() {
                try {
                    eval(onclickAttr);
                } catch (error) {
                    console.error('Erreur lors de l\'exécution de l\'événement:', error);
                }
            });
        }
    });
    
    // Réattacher les événements au menu démarrer
    const startMenuApps = document.querySelectorAll('.tonios-start-menu-app');
    startMenuApps.forEach(app => {
        const onclickAttr = app.getAttribute('onclick');
        if (onclickAttr) {
            app.addEventListener('click', function() {
                try {
                    eval(onclickAttr);
                } catch (error) {
                    console.error('Erreur lors de l\'exécution de l\'événement:', error);
                }
            });
        }
    });
    
    console.log('✅ Événements des icônes réinitialisés');
}

// Fonctions de persistance des données
function saveUsersToStorage() {
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
    } catch (error) {
        console.error('Erreur sauvegarde utilisateurs:', error);
    }
}

function loadUsersFromStorage() {
    try {
        const stored = localStorage.getItem(USERS_STORAGE_KEY);
        if (stored) {
            const userData = JSON.parse(stored);
            allUsers = {};
            Object.keys(userData).forEach(username => {
                const user = userData[username];
                const userSession = new UserSession(user.username, '', user.role);
                Object.assign(userSession, user);
                allUsers[username] = userSession;
            });
        }
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
        allUsers = {};
    }
}

// Fonction pour vérifier si une session persistante existe
function checkAutoLogin() {
    const rememberedUser = localStorage.getItem(REMEMBER_SESSION_KEY);
    if (rememberedUser) {
        const user = loadUser(rememberedUser);
        if (user) {
            currentSession = user;
            startSession();
            showNotification(`Session restaurée pour ${user.username}`, 'info');
            return true;
        } else {
            // Nettoyer si l'utilisateur n'existe plus
            localStorage.removeItem(REMEMBER_SESSION_KEY);
        }
    }
    return false;
}

// Fonctions d'affichage des formulaires
function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleToRegister = document.getElementById('toggleToRegister');
    const toggleToLogin = document.getElementById('toggleToLogin');
    const subtitle = document.getElementById('loginSubtitle');
    
    if (loginForm && registerForm && toggleToRegister && toggleToLogin && subtitle) {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        toggleToRegister.classList.remove('hidden');
        toggleToLogin.classList.add('hidden');
        subtitle.textContent = 'Système d\'exploitation virtuel - Connexion';
    }
}

function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleToRegister = document.getElementById('toggleToRegister');
    const toggleToLogin = document.getElementById('toggleToLogin');
    const subtitle = document.getElementById('loginSubtitle');
    
    if (loginForm && registerForm && toggleToRegister && toggleToLogin && subtitle) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        toggleToRegister.classList.add('hidden');
        toggleToLogin.classList.remove('hidden');
        subtitle.textContent = 'Système d\'exploitation virtuel - Inscription';
    }
}

// Exposer les fonctions globalement pour l'utilisation dans le HTML
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.logout = logout;
window.quickLogin = quickLogin;

// Fonctions pour basculer entre les formulaires
function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('showRegisterLink').classList.add('hidden');
    document.getElementById('showLoginLink').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('showLoginLink').classList.add('hidden');
    document.getElementById('showRegisterLink').classList.remove('hidden');
}

// Afficher la liste des utilisateurs existants
function showUserList() {
    loadUsersFromStorage();
    const userList = Object.keys(allUsers);
    
    if (userList.length === 0) {
        showNotification('Aucun utilisateur enregistré', 'info');
        return;
    }
    
    const userListText = userList.join(', ');
    showNotification(`Utilisateurs existants : ${userListText}`, 'info');
}

// Fonctions de modération (placeholders)
function openModerationPanel() {
    if (!currentSession || !currentSession.hasPermission('kick')) {
        showNotification('Accès refusé - Permissions insuffisantes', 'error');
        return;
    }
    
    const panel = document.getElementById('moderationPanel');
    if (panel) {
        updateModerationUsersList();
        panel.style.display = 'block';
    }
}

function closeModerationPanel() {
    const panel = document.getElementById('moderationPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

function updateModerationUsersList() {
    const usersList = document.getElementById('moderationUsersList');
    if (!usersList) return;
    
    loadUsersFromStorage();
    const users = Object.values(allUsers);
    
    usersList.innerHTML = users.map(user => `
        <div class="tonios-moderation-user">
            <span class="tonios-moderation-user-avatar" style="background-color: ${user.avatar.color}">${user.avatar.letter}</span>
            <div class="tonios-moderation-user-info">
                <strong>${user.username}</strong>
                <span class="tonios-moderation-user-role">${user.role}</span>
                <small>Connecté ${user.loginCount} fois</small>
            </div>
            <div class="tonios-moderation-user-actions">
                ${user.username !== currentSession?.username ? `
                    <button onclick="moderateUser('${user.username}', 'warn')" class="tonios-btn-warn">⚠️</button>
                    <button onclick="moderateUser('${user.username}', 'kick')" class="tonios-btn-kick">👢</button>
                    ${currentSession?.hasPermission('ban') ? `<button onclick="moderateUser('${user.username}', 'ban')" class="tonios-btn-ban">🚫</button>` : ''}
                ` : '<span style="opacity: 0.5;">Vous</span>'}
            </div>
        </div>
    `).join('');
}

function moderateUser(username, action) {
    if (!currentSession || !currentSession.hasPermission(action)) {
        showNotification('Permissions insuffisantes', 'error');
        return;
    }
    
    const user = allUsers[username];
    if (!user) {
        showNotification('Utilisateur introuvable', 'error');
        return;
    }
    
    switch(action) {
        case 'warn':
            showNotification(`Avertissement envoyé à ${username}`, 'warning');
            break;
        case 'kick':
            showNotification(`${username} a été expulsé`, 'info');
            break;
        case 'ban':
            delete allUsers[username];
            localStorage.removeItem(`tonios_user_${username}`);
            saveUsersToStorage();
            showNotification(`${username} a été banni`, 'error');
            updateModerationUsersList();
            break;
    }
}

function hasPermission(action) {
    return currentSession ? currentSession.hasPermission(action) : false;
}
