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

// ===============================================
// FONCTIONS D'INTERFACE
// ===============================================

// Fonction de gestion des formulaires
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const rememberSession = document.getElementById('rememberSession').checked;
    
    if (!username) {
        showNotification('Veuillez entrer un nom d\'utilisateur', 'error');
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
    
    if (password !== confirmPassword) {
        showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    try {
        const result = registerUser(username, password, rememberSession);
        if (result.success) {
            showDesktop();
        }
    } catch (error) {
        showNotification(error.message, 'error');
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
        if (typeof startClock === 'function') {
            startClock();
        }
        
        // Charger le bureau personnalisé
        if (currentSession) {
            loadDesktopLayout();
        }
        
        // Mettre à jour le menu utilisateur
        if (typeof updateUserMenu === 'function') {
            updateUserMenu();
        }
        
        // Initialiser les données chat pour l'utilisateur
        if (typeof initializeChannels === 'function') {
            initializeChannels();
        }
    }
}

// Basculer vers le formulaire d'inscription
function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const subtitle = document.getElementById('loginSubtitle');
    
    if (loginForm && registerForm && subtitle) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        subtitle.textContent = 'Créer un nouveau compte';
    }
}

// Basculer vers le formulaire de connexion
function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const subtitle = document.getElementById('loginSubtitle');
    
    if (loginForm && registerForm && subtitle) {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        subtitle.textContent = 'Système d\'exploitation virtuel - Connexion';
    }
}

// Fonction de déconnexion
function logoutUser() {
    if (currentSession) {
        showNotification(`Au revoir ${currentSession.username} !`, 'info');
        currentSession = null;
        clearSavedSession();
        
        // Retourner à l'écran de connexion
        const loginScreen = document.getElementById('loginScreen');
        const desktop = document.querySelector('.tonios-desktop');
        
        if (loginScreen && desktop) {
            desktop.style.display = 'none';
            loginScreen.style.display = 'block';
        }
        
        // Réinitialiser l'interface
        if (typeof updateUserMenu === 'function') {
            updateUserMenu();
        }
    }
}
