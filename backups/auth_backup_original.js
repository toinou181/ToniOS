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
                { id: 'chat', x: 20, y: 320, visible: true },
                { id: 'systemprops', x: 20, y: 420, visible: true }
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
        // Simple hash pour démo
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
        // Utilisateur n'existe pas
        showNotification(`Utilisateur "${username}" introuvable. Veuillez vous inscrire d'abord.`, 'error');
        return { success: false };
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

// Gestion des formulaires
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const rememberSession = document.getElementById('rememberSession').checked;

    const result = loginUser(username, password, rememberSession);
    
    // Ne pas procéder si la connexion a échoué
    if (!result || !result.success) {
        return false;
    }
    
    return true;
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
    
    registerUser(username, password, rememberSession);
}

// Session rapide
function quickLogin(type) {
    let username, role;
    
    switch(type) {
        case 'demo':
            username = 'Démo_' + Math.floor(Math.random() * 1000);
            role = 'user';
            break;
        default:
            return;
    }
    
    currentSession = new UserSession(username, '', role);
    saveUser(currentSession);
    startSession();
    showNotification(`Session démo créée : ${username}`, 'info');
}

// Démarrer une session
function startSession() {
    sessionStartTime = Date.now();
    window.toniosStartTime = sessionStartTime;
    
    // Masquer l'écran de connexion
    const loginScreen = document.getElementById('loginScreen');
    const desktop = document.querySelector('.tonios-desktop');
    
    if (loginScreen && desktop) {
        loginScreen.style.display = 'none';
        desktop.style.display = 'flex';
    }
    
    // Charger les données utilisateur
    loadUserData();
    
    // Initialiser le bureau
    updateDesktopInfo();
    
    // Reinitialiser complètement le bureau
    if (typeof reinitializeDesktop === 'function') {
        reinitializeDesktop();
    } else {
        // Fallback si reinitializeDesktop n'est pas encore chargé
        setTimeout(() => {
            if (typeof reinitializeDesktop === 'function') {
                reinitializeDesktop();
            }
        }, 100);
    }
    
    // Autres initialisations
    if (typeof setupKeyboardShortcuts === 'function') {
        setupKeyboardShortcuts();
    }
    if (typeof initializeChannels === 'function') {
        initializeChannels();
    }
    if (typeof startClock === 'function') {
        startClock();
    }
    
    // Message de bienvenue
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
        if (typeof saveUserData === 'function') saveUserData();
        
        // Fermer toutes les fenêtres
        if (typeof openWindows !== 'undefined') {
            openWindows = [];
        }
        document.querySelectorAll('.tonios-window').forEach(win => win.remove());
        
        // Réinitialiser les variables
        currentSession = null;
        sessionStartTime = null;
        
        // Afficher l'écran de connexion
        const loginScreen = document.getElementById('loginScreen');
        const desktop = document.querySelector('.tonios-desktop');
        
        if (loginScreen && desktop) {
            desktop.style.display = 'none';
            loginScreen.style.display = 'flex';
        }
        
        // Effacer les champs
        const usernameInput = document.getElementById('usernameInput');
        const passwordInput = document.getElementById('passwordInput');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
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
            // Copier toutes les propriétés existantes
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
            const usersData = JSON.parse(stored);
            allUsers = {};
            // Recréer les instances UserSession
            Object.keys(usersData).forEach(username => {
                const userData = usersData[username];
                const userSession = new UserSession(userData.username, '', userData.role);
                Object.assign(userSession, userData);
                allUsers[username] = userSession;
            });
        }
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
        allUsers = {};
    }
}

// Fonctions pour les formulaires
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

// Fonction pour afficher la liste des utilisateurs
function showUserList() {
    loadUsersFromStorage();
    const userList = Object.keys(allUsers);
    
    if (userList.length === 0) {
        showNotification('Aucun utilisateur enregistré', 'info');
        return;
    }
    
    const userListText = userList.join(', ');
    showNotification(`Utilisateurs : ${userListText}`, 'info');
}

// Fonctions de permissions
function hasPermission(action) {
    if (!currentSession) return false;
    return currentSession.hasPermission(action);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Charger les utilisateurs depuis le stockage
    loadUsersFromStorage();
    
    // Vérifier s'il y a une session à restaurer
    setTimeout(() => {
        checkAutoLogin();
    }, 500);
});