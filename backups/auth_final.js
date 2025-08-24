// ===============================================
// SYSTÈME D'AUTHENTIFICATION TONIOS - VERSION FINALE
// ===============================================

// Variables globales d'authentification
let currentUser = null;
let isAuthenticated = false;
let sessionToken = null;

// Initialisation du système d'authentification
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    console.log('🔐 Initialisation du système d\'authentification...');
    
    // Vérifier s'il y a une session sauvegardée
    checkSavedSession();
    
    // Si pas de session, afficher l'écran de connexion
    if (!isAuthenticated) {
        showLoginScreen();
    } else {
        showMainDesktop();
    }
}

function checkSavedSession() {
    const savedSession = localStorage.getItem('tonios_session');
    const rememberMe = localStorage.getItem('tonios_remember');
    
    if (savedSession && rememberMe === 'true') {
        try {
            const sessionData = JSON.parse(savedSession);
            if (sessionData.username && sessionData.timestamp) {
                // Vérifier si la session n'est pas expirée (7 jours)
                const now = Date.now();
                const sessionAge = now - sessionData.timestamp;
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours
                
                if (sessionAge < maxAge) {
                    currentUser = sessionData.username;
                    isAuthenticated = true;
                    sessionToken = sessionData.token;
                    console.log('✅ Session restaurée pour:', currentUser);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la restoration de session:', error);
            localStorage.removeItem('tonios_session');
            localStorage.removeItem('tonios_remember');
        }
    }
}

function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const mainDesktop = document.getElementById('mainDesktop');
    
    if (loginScreen && mainDesktop) {
        loginScreen.style.display = 'flex';
        mainDesktop.style.display = 'none';
    }
}

function showMainDesktop() {
    const loginScreen = document.getElementById('loginScreen');
    const mainDesktop = document.getElementById('mainDesktop');
    
    if (loginScreen && mainDesktop) {
        loginScreen.style.display = 'none';
        mainDesktop.style.display = 'block';
        
        // Mettre à jour l'affichage utilisateur
        updateUserDisplay();
        
        // Réinitialiser les événements des icônes du bureau
        reinitializeDesktopEvents();
        
        // Initialiser ToniOS après l'authentification
        setTimeout(() => {
            if (typeof initializeToniOS === 'function') {
                initializeToniOS();
            }
        }, 100);
    }
}

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
}

function updateUserDisplay() {
    const userDisplay = document.getElementById('currentUserDisplay');
    if (userDisplay && currentUser) {
        userDisplay.textContent = currentUser;
    }
}

// Gestion de la connexion
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const rememberMe = document.getElementById('rememberSession').checked;
    
    // Validation basique
    if (!username || username.length < 3) {
        showAuthMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères.', 'error');
        return;
    }
    
    // Vérifier les caractères autorisés
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
        showAuthMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores.', 'error');
        return;
    }
    
    // Simuler l'authentification
    performLogin(username, password, rememberMe);
}

function performLogin(username, password, rememberMe) {
    // Dans un vrai système, ceci serait un appel API
    // Pour la démo, on accepte tout utilisateur valide
    
    showAuthMessage('Connexion en cours...', 'info');
    
    setTimeout(() => {
        // Simuler un délai de connexion
        currentUser = username;
        isAuthenticated = true;
        sessionToken = generateSessionToken();
        
        // Sauvegarder la session si demandé
        if (rememberMe) {
            const sessionData = {
                username: username,
                token: sessionToken,
                timestamp: Date.now()
            };
            localStorage.setItem('tonios_session', JSON.stringify(sessionData));
            localStorage.setItem('tonios_remember', 'true');
        }
        
        showAuthMessage('Connexion réussie ! Bienvenue ' + username, 'success');
        
        // Afficher le bureau après un délai
        setTimeout(() => {
            showMainDesktop();
        }, 1000);
        
    }, 1000);
}

// Gestion de l'inscription
function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsernameInput').value.trim();
    const password = document.getElementById('regPasswordInput').value;
    const confirmPassword = document.getElementById('regConfirmPasswordInput').value;
    
    // Validations
    if (!username || username.length < 3) {
        showAuthMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères.', 'error');
        return;
    }
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
        showAuthMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores.', 'error');
        return;
    }
    
    if (!password || password.length < 4) {
        showAuthMessage('Le mot de passe doit contenir au moins 4 caractères.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthMessage('Les mots de passe ne correspondent pas.', 'error');
        return;
    }
    
    // Simuler l'inscription
    performRegister(username, password);
}

function performRegister(username, password) {
    showAuthMessage('Création du compte en cours...', 'info');
    
    setTimeout(() => {
        // Dans un vrai système, ceci serait un appel API
        showAuthMessage('Compte créé avec succès ! Vous pouvez maintenant vous connecter.', 'success');
        
        // Revenir au formulaire de connexion
        setTimeout(() => {
            showLoginForm();
            // Pré-remplir le nom d'utilisateur
            document.getElementById('usernameInput').value = username;
        }, 2000);
        
    }, 1000);
}

// Navigation entre formulaires
function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');
    const subtitle = document.getElementById('loginSubtitle');
    
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    showRegisterLink.classList.add('hidden');
    showLoginLink.classList.remove('hidden');
    subtitle.textContent = 'Système d\'exploitation virtuel - Inscription';
    
    clearAuthMessage();
}

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');
    const subtitle = document.getElementById('loginSubtitle');
    
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    showLoginLink.classList.add('hidden');
    showRegisterLink.classList.remove('hidden');
    subtitle.textContent = 'Système d\'exploitation virtuel - Connexion';
    
    clearAuthMessage();
}

// Déconnexion
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        // Effacer les données de session
        currentUser = null;
        isAuthenticated = false;
        sessionToken = null;
        
        // Effacer le stockage local
        localStorage.removeItem('tonios_session');
        localStorage.removeItem('tonios_remember');
        
        // Fermer toutes les fenêtres ouvertes
        if (typeof closeAllWindows === 'function') {
            closeAllWindows();
        } else if (typeof openWindows !== 'undefined') {
            openWindows.forEach(window => {
                if (window.element) {
                    window.element.remove();
                }
            });
            openWindows = [];
        }
        
        // Afficher l'écran de connexion
        showLoginScreen();
        
        // Réinitialiser les formulaires
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        clearAuthMessage();
        
        console.log('🚪 Déconnexion réussie');
    }
}

// Utilitaires
function generateSessionToken() {
    return 'tonios_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showAuthMessage(message, type = 'info') {
    const messageElement = document.getElementById('authMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = 'tonios-auth-message tonios-auth-' + type;
        messageElement.style.display = 'block';
    }
}

function clearAuthMessage() {
    const messageElement = document.getElementById('authMessage');
    if (messageElement) {
        messageElement.textContent = '';
        messageElement.style.display = 'none';
    }
}

// Fonction pour vérifier l'authentification (utilisée par d'autres modules)
function isUserAuthenticated() {
    return isAuthenticated && currentUser;
}

function getCurrentUser() {
    return currentUser;
}

// Exposer les fonctions globalement
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.logout = logout;
window.isUserAuthenticated = isUserAuthenticated;
window.getCurrentUser = getCurrentUser;
