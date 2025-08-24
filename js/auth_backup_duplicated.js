// ===============================================
// SYSTÈME DE SESSIONS ET AUTHENTIFICATION
// ===============================================

let currentSession = null;
let allUsers = {};
let sessionStartTime = null;
let userPermissions = {
    moderator: ['kick', 'warn', 'deleteMessage', 'createChannel', 'deleteChannel'],
    admin: ['kick', 'warn', 'deleteMessage', 'createChannel', 'deleteChannel', 'promoteUser', 'ban'],
    user: ['createChannel']
};

// Clé pour le stockage local
const USERS_STORAGE_KEY = 'tonios_users';
const SESSION_STORAGE_KEY = 'tonios_current_session';
const REMEMBER_SESSION_KEY = 'tonios_remember_session';

// Structure d'un utilisateur
class UserSession {
    constructor(username, password = '', role = 'user') {
        this.username = username;
        this.password = this.hashPassword(password); // Toujours hasher
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
        // Simple hash pour démo - utiliser bcrypt en production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir en 32-bit
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

    // Vérifier si l'utilisateur existe
    const existingUser = loadUser(username);
    
    if (existingUser) {
        // Connexion utilisateur existant
        const hashedPassword = existingUser.hashPassword ? existingUser.hashPassword(password) : new UserSession('', password).hashPassword(password);
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
    
    // Démarrer la session
    startSession();
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
    
    // Démarrer la session
    startSession();
    return { success: true };
}

// Gestion de la connexion (fonction existante)
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const rememberSession = document.getElementById('rememberSession').checked;

    const result = loginUser(username, password, rememberSession);
    if (result.success) {
        // La fonction startSession() est déjà appelée dans loginUser
    }
}

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
    startSession();
    showNotification(`Connexion rapide en tant que ${role}: ${username}`, 'info');
}

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

function logout() {
    if (currentSession) {
        // Sauvegarder les données avant de se déconnecter
        saveUserData();
        
        // Fermer toutes les fenêtres
        openWindows = [];
        document.querySelectorAll('.tonios-window').forEach(win => win.remove());
        
        // Réinitialiser les variables
        currentSession = null;
        sessionStartTime = null;
        
        // Afficher l'écran de connexion
        document.querySelector('.tonios-desktop').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        
        // Effacer les champs
        document.getElementById('usernameInput').value = '';
        document.getElementById('passwordInput').value = '';
        
        showNotification('Déconnexion réussie ! À bientôt ! 👋', 'info');
    }
}

function deleteAccount() {
    if (!currentSession) return;
    
    const confirmation = prompt(`ATTENTION: Voulez-vous vraiment supprimer votre compte "${currentSession.username}" ?\nToutes vos données seront perdues définitivement.\nTapez "SUPPRIMER" pour confirmer:`);
    
    if (confirmation === 'SUPPRIMER') {
        // Supprimer les données utilisateur
        localStorage.removeItem(`tonios_data_${currentSession.username}`);
        localStorage.removeItem(`tonios_user_${currentSession.username}`);
        
        // Log de sécurité
        console.warn(`Compte supprimé: ${currentSession.username} à ${new Date().toISOString()}`);
        
        showNotification('Compte supprimé avec succès', 'info');
        logout();
    } else {
        showNotification('Suppression annulée', 'info');
    }
}

// Fonctions utilitaires d'authentification
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
    
    const userInfo = document.getElementById('currentUser');
    const roleInfo = document.getElementById('userRole');
    const avatarInfo = document.getElementById('userAvatar');
    
    if (userInfo) userInfo.textContent = currentSession.username;
    if (roleInfo) roleInfo.textContent = currentSession.role;
    if (avatarInfo) {
        avatarInfo.style.backgroundColor = currentSession.avatar.color;
        avatarInfo.textContent = currentSession.avatar.letter;
    }
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
            allUsers = JSON.parse(stored);
            // Recréer les instances UserSession
            Object.keys(allUsers).forEach(username => {
                const userData = allUsers[username];
                const user = new UserSession(userData.username, '', userData.role);
                Object.assign(user, userData);
                allUsers[username] = user;
            });
        }
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
        allUsers = {};
    }
}

function saveCurrentSession(rememberSession = false) {
    if (!currentSession) return;
    
    try {
        const sessionData = {
            username: currentSession.username,
            token: currentSession.sessionToken,
            timestamp: Date.now()
        };
        
        if (rememberSession) {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        }
    } catch (error) {
        console.error('Erreur sauvegarde session:', error);
    }
}

function loadSavedSession() {
    try {
        // Vérifier session persistante
        let sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!sessionData) {
            // Vérifier session temporaire
            sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
        }
        
        if (sessionData) {
            const session = JSON.parse(sessionData);
            const user = allUsers[session.username];
            
            if (user && user.sessionToken === session.token) {
                // Session valide, reconnecter automatiquement
                currentSession = user;
                currentSession.lastLogin = new Date().toISOString();
                currentSession.loginCount++;
                saveUsersToStorage();
                return true;
            }
        }
    } catch (error) {
        console.error('Erreur chargement session:', error);
    }
    return false;
}

function clearSavedSession() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

// Fonction d'enregistrement d'un nouvel utilisateur
function registerUser(username, password, rememberSession = false) {
    // Validation
    if (!username || username.length < 3 || username.length > 20) {
        throw new Error('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        throw new Error('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
    }
    
    if (allUsers[username]) {
        throw new Error('Ce nom d\'utilisateur existe déjà');
    }
    
    if (password && password.length < 4) {
        throw new Error('Le mot de passe doit contenir au moins 4 caractères');
    }
    
    // Créer le nouvel utilisateur
    const newUser = new UserSession(username, password, 'user');
    newUser.preferences.rememberSession = rememberSession;
    
    // Sauvegarder
    allUsers[username] = newUser;
    saveUsersToStorage();
    
    return newUser;
}

// Fonction de connexion améliorée
function loginUser(username, password, rememberSession = false) {
    const user = allUsers[username];
    
    if (!user) {
        throw new Error('Utilisateur introuvable');
    }
    
    // Vérifier le mot de passe (si défini)
    if (user.password && user.password !== new UserSession('temp', password).hashPassword(password)) {
        throw new Error('Mot de passe incorrect');
    }
    
    // Connexion réussie
    user.lastLogin = new Date().toISOString();
    user.loginCount++;
    user.preferences.rememberSession = rememberSession;
    user.sessionToken = user.generateSessionToken();
    
    currentSession = user;
    saveUsersToStorage();
    saveCurrentSession(rememberSession);
    
    return user;
}

// Fonction de déconnexion
function logoutUser() {
    if (currentSession) {
        currentSession.lastLogin = new Date().toISOString();
        saveUsersToStorage();
        clearSavedSession();
        currentSession = null;
    }
}

// Fonctions de gestion du bureau personnalisé
function saveDesktopLayout() {
    if (!currentSession) return;
    
    // Sauvegarder les positions des icônes
    const icons = document.querySelectorAll('.tonios-desktop-icon');
    currentSession.desktop.icons = Array.from(icons).map(icon => ({
        id: icon.dataset.app || icon.onclick?.toString().match(/openApplication\('([^']+)'\)/)?.[1],
        x: parseInt(icon.style.left) || 20,
        y: parseInt(icon.style.top) || 20,
        visible: !icon.classList.contains('hidden')
    }));
    
    saveUsersToStorage();
}

function loadDesktopLayout() {
    if (!currentSession || !currentSession.desktop) return;
    
    // Charger le fond d'écran personnalisé
    if (currentSession.desktop.wallpaper) {
        document.querySelector('.tonios-desktop').style.background = currentSession.desktop.wallpaper;
    }
    
    // Charger les positions des icônes
    setTimeout(() => {
        const icons = document.querySelectorAll('.tonios-desktop-icon');
        icons.forEach(icon => {
            const iconId = icon.dataset.app || icon.onclick?.toString().match(/openApplication\('([^']+)'\)/)?.[1];
            const savedIcon = currentSession.desktop.icons.find(saved => saved.id === iconId);
            
            if (savedIcon) {
                icon.style.left = savedIcon.x + 'px';
                icon.style.top = savedIcon.y + 'px';
                icon.style.position = 'absolute';
                
                if (!savedIcon.visible) {
                    icon.classList.add('hidden');
                }
            }
        });
    }, 100);
}

// Fonctions d'interface utilisateur pour l'authentification
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

// Fonction pour les connexions rapides
function quickLogin(type) {
    let username, role;
    
    switch(type) {
        case 'demo':
            username = 'demo';
            role = 'moderator';
            break;
        case 'guest':
            username = 'guest';
            role = 'user';
            break;
        default:
            showNotification('Type de connexion invalide', 'error');
            return;
    }
    
    // Créer ou récupérer l'utilisateur
    let user = allUsers[username];
    if (!user) {
        user = createUser(username, '', type);
    }
    
    // Connecter l'utilisateur
    currentSession = user;
    updateSessionUI();
    showDesktop();
    showNotification(`Bienvenue ${username} !`, 'success');
}

// Fonction de gestion des formulaires
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const rememberSession = document.getElementById('rememberSession').checked;
    
    if (!username) {
        showNotification('Veuillez saisir un nom d\'utilisateur', 'error');
        return;
    }
    
    const result = loginUser(username, password, rememberSession);
    if (result.success) {
        showDesktop();
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
        showDesktop();
    }
}

// Afficher le bureau après connexion
function showDesktop() {
    const loginScreen = document.getElementById('loginScreen');
    const desktop = document.querySelector('.tonios-desktop');
    
    if (loginScreen && desktop) {
        loginScreen.style.display = 'none';
        desktop.style.display = 'flex';
        
        // Démarrer l'horloge
        startClock();
        
        // Charger le bureau personnalisé
        if (currentSession) {
            loadDesktopLayout();
        }
    }
}

// Fonction pour fermer le panneau de modération
function closeModerationPanel() {
    const panel = document.getElementById('moderationPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// Fonction pour ouvrir le panneau de modération (pour les modérateurs/admins)
function openModerationPanel() {
    if (!currentSession || !hasPermission('kick')) {
        showNotification('Accès refusé - Permissions insuffisantes', 'error');
        return;
    }
    
    const panel = document.getElementById('moderationPanel');
    if (!panel) return;
    
    // Actualiser la liste des utilisateurs dans le panneau
    updateModerationUsersList();
    panel.style.display = 'block';
}

// Fonction pour mettre à jour la liste des utilisateurs dans le panneau de modération
function updateModerationUsersList() {
    const usersList = document.getElementById('moderationUsersList');
    if (!usersList) return;
    
    loadUsersFromStorage();
    const users = Object.values(allUsers);
    
    usersList.innerHTML = users.map(user => `
        <div class="tonios-moderation-user">
            <span class="tonios-moderation-user-avatar">${user.avatar}</span>
            <div class="tonios-moderation-user-info">
                <strong>${user.username}</strong>
                <span class="tonios-moderation-user-role">${user.role}</span>
                <small>Connecté ${user.loginCount} fois</small>
            </div>
            <div class="tonios-moderation-user-actions">
                ${user.username !== currentSession?.username ? `
                    <button onclick="moderateUser('${user.username}', 'warn')" class="tonios-btn-warn">⚠️</button>
                    <button onclick="moderateUser('${user.username}', 'kick')" class="tonios-btn-kick">👢</button>
                    ${hasPermission('ban') ? `<button onclick="moderateUser('${user.username}', 'ban')" class="tonios-btn-ban">🚫</button>` : ''}
                ` : '<span style="opacity: 0.5;">Vous</span>'}
            </div>
        </div>
    `).join('');
}

// Fonction de modération des utilisateurs
function moderateUser(username, action) {
    if (!currentSession || !hasPermission(action)) {
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
            saveUsersToStorage();
            showNotification(`${username} a été banni`, 'error');
            updateModerationUsersList();
            break;
    }
}

// Fonctions d'interface utilisateur pour l'authentification
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

// Fonction pour les connexions rapides
function quickLogin(type) {
    let username, role;
    
    switch(type) {
        case 'demo':
            username = 'demo';
            role = 'moderator';
            break;
        case 'guest':
            username = 'guest';
            role = 'user';
            break;
        default:
            showNotification('Type de connexion invalide', 'error');
            return;
    }
    
    // Créer ou récupérer l'utilisateur
    let user = allUsers[username];
    if (!user) {
        user = createUser(username, '', type);
    }
    
    // Connecter l'utilisateur
    currentSession = user;
    updateSessionUI();
    showDesktop();
    showNotification(`Bienvenue ${username} !`, 'success');
}

// Fonction de gestion des formulaires
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const rememberSession = document.getElementById('rememberSession').checked;
    
    if (!username) {
        showNotification('Veuillez saisir un nom d\'utilisateur', 'error');
        return;
    }
    
    const result = loginUser(username, password, rememberSession);
    if (result.success) {
        showDesktop();
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
        showDesktop();
    }
}

// Afficher le bureau après connexion
function showDesktop() {
    const loginScreen = document.getElementById('loginScreen');
    const desktop = document.querySelector('.tonios-desktop');
    
    if (loginScreen && desktop) {
        loginScreen.style.display = 'none';
        desktop.style.display = 'flex';
        
        // Démarrer l'horloge
        startClock();
        
        // Charger le bureau personnalisé
        if (currentSession) {
            loadDesktopLayout();
        }
    }
}
