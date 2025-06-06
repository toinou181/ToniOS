// ===============================================
// TONIOS - SYSTÈME PRINCIPAL AVEC AUTHENTIFICATION
// ===============================================

// Variables globales
let isStartMenuOpen = false;
let currentWindows = {};
let windowZIndex = 1000;
let taskbarApplications = [];
let isDragging = false;
let isResizing = false;
let dragData = {
    element: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0
};

// Initialisation du système (appelée après authentification)
function initializeToniOS() {
    console.log('🖥️ Initialisation de ToniOS...');
    
    // Marquer le temps de démarrage
    window.toniosStartTime = Date.now();
    window.sessionStartTime = Date.now();
    
    // Initialiser les systèmes
    setupEventListeners();
    initializeNotifications();
    setupDesktopInteractions();
    updateClock();
    
    // S'assurer que les fonctions sont exposées globalement
    exposeGlobalFunctions();
    
    console.log('✅ ToniOS initialisé avec succès !');
}

// Exposition des fonctions globales pour les icônes
function exposeGlobalFunctions() {
    // Exposer les fonctions nécessaires pour les événements onclick
    if (typeof openApplication !== 'undefined') {
        window.openApplication = openApplication;
    }
    if (typeof closeWindow !== 'undefined') {
        window.closeWindow = closeWindow;
    }
    if (typeof minimizeWindow !== 'undefined') {
        window.minimizeWindow = minimizeWindow;
    }
    if (typeof maximizeWindow !== 'undefined') {
        window.maximizeWindow = maximizeWindow;
    }
    if (typeof bringToFront !== 'undefined') {
        window.bringToFront = bringToFront;
    }
    if (typeof toggleStartMenu !== 'undefined') {
        window.toggleStartMenu = toggleStartMenu;
    }
    if (typeof closeStartMenu !== 'undefined') {
        window.closeStartMenu = closeStartMenu;
    }
}

// Configuration des événements globaux
function setupEventListeners() {
    // Gestion des clics pour fermer le menu démarrer
    document.addEventListener('click', function(e) {
        const startMenu = document.getElementById('startMenu');
        const startButton = document.querySelector('.tonios-start-button');
        
        if (startMenu && startButton && 
            !startMenu.contains(e.target) && 
            !startButton.contains(e.target) && 
            isStartMenuOpen) {
            closeStartMenu();
        }
    });

    // Gestion du glisser-déposer pour les fenêtres
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Gestion des raccourcis clavier
    document.addEventListener('keydown', handleKeyDown);

    // Gestion du redimensionnement de la fenêtre
    window.addEventListener('resize', handleWindowResize);
}

// Gestion du menu démarrer
function toggleStartMenu() {
    const startMenu = document.getElementById('startMenu');
    if (!startMenu) return;
    
    if (isStartMenuOpen) {
        closeStartMenu();
    } else {
        openStartMenu();
    }
}

function openStartMenu() {
    const startMenu = document.getElementById('startMenu');
    if (!startMenu) return;
    
    startMenu.classList.add('tonios-start-menu-open');
    isStartMenuOpen = true;
}

function closeStartMenu() {
    const startMenu = document.getElementById('startMenu');
    if (!startMenu) return;
    
    startMenu.classList.remove('tonios-start-menu-open');
    isStartMenuOpen = false;
}

// Gestion de l'horloge
function updateClock() {
    const clockElement = document.getElementById('taskbarClock');
    if (!clockElement) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    clockElement.textContent = timeString;
}

// Mettre à jour l'horloge toutes les secondes
setInterval(updateClock, 1000);

// Gestion des interactions du bureau
function setupDesktopInteractions() {
    // Gestion du clic droit sur le bureau
    const desktopArea = document.querySelector('.tonios-desktop-area');
    if (desktopArea) {
        desktopArea.addEventListener('contextmenu', handleDesktopRightClick);
    }

    // Gestion du double-clic sur le bureau
    desktopArea.addEventListener('dblclick', handleDesktopDoubleClick);
}

function handleDesktopRightClick(e) {
    e.preventDefault();
    // Ici on pourrait ajouter un menu contextuel du bureau
    console.log('Clic droit sur le bureau');
}

function handleDesktopDoubleClick(e) {
    // Ici on pourrait ajouter une action sur double-clic
    console.log('Double-clic sur le bureau');
}

// Gestion des raccourcis clavier
function handleKeyDown(e) {
    // Raccourcis système
    if (e.ctrlKey) {
        switch(e.key) {
            case 'Escape':
                closeStartMenu();
                break;
            case 'Tab':
                e.preventDefault();
                // Cycle entre les fenêtres ouvertes
                cycleThroughWindows();
                break;
        }
    }
    
    // Touche Windows/Cmd pour ouvrir le menu démarrer
    if (e.key === 'Meta' || e.key === 'Super') {
        e.preventDefault();
        toggleStartMenu();
    }
}

function cycleThroughWindows() {
    if (typeof openWindows !== 'undefined' && openWindows.length > 0) {
        // Logique pour cycler entre les fenêtres
        const currentWindow = openWindows[0];
        if (currentWindow && typeof bringToFront === 'function') {
            bringToFront(currentWindow.id);
        }
    }
}

// Gestion du redimensionnement de la fenêtre
function handleWindowResize() {
    // Ajuster les fenêtres si nécessaire
    if (typeof openWindows !== 'undefined') {
        openWindows.forEach(window => {
            // Vérifier que les fenêtres restent dans les limites de l'écran
            if (window.element) {
                const rect = window.element.getBoundingClientRect();
                const maxWidth = window.innerWidth - 20;
                const maxHeight = window.innerHeight - 100;
                
                if (rect.right > maxWidth) {
                    window.element.style.left = (maxWidth - rect.width) + 'px';
                }
                if (rect.bottom > maxHeight) {
                    window.element.style.top = (maxHeight - rect.height) + 'px';
                }
            }
        });
    }
}

// Gestion du glisser-déposer (placeholders)
function handleMouseMove(e) {
    if (isDragging && dragData.element) {
        const newX = e.clientX - dragData.startX + dragData.startLeft;
        const newY = e.clientY - dragData.startY + dragData.startTop;
        
        dragData.element.style.left = newX + 'px';
        dragData.element.style.top = newY + 'px';
    }
}

function handleMouseUp(e) {
    if (isDragging) {
        isDragging = false;
        dragData.element = null;
        document.body.style.cursor = 'default';
    }
}

// Initialisation des notifications
function initializeNotifications() {
    // S'assurer que le conteneur de notifications existe
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'tonios-notification-container';
        document.body.appendChild(notificationContainer);
    }
}

// Fonction de nettoyage pour la déconnexion
function closeAllWindows() {
    if (typeof openWindows !== 'undefined') {
        openWindows.forEach(window => {
            if (window.element) {
                window.element.remove();
            }
        });
        openWindows = [];
    }
    
    // Nettoyer la barre des tâches
    const taskbarApps = document.getElementById('taskbarApps');
    if (taskbarApps) {
        taskbarApps.innerHTML = '';
    }
    
    taskbarApplications = [];
    currentWindows = {};
}

// Fonction utilitaire pour obtenir des informations système
function getSystemInfo() {
    return {
        version: 'ToniOS v1.0',
        uptime: window.toniosStartTime ? Date.now() - window.toniosStartTime : 0,
        user: typeof getCurrentUser === 'function' ? getCurrentUser() : 'Invité',
        authenticated: typeof isUserAuthenticated === 'function' ? isUserAuthenticated() : false,
        openWindows: typeof openWindows !== 'undefined' ? openWindows.length : 0
    };
}

// Exposer les fonctions globalement
window.initializeToniOS = initializeToniOS;
window.toggleStartMenu = toggleStartMenu;
window.openStartMenu = openStartMenu;
window.closeStartMenu = closeStartMenu;
window.closeAllWindows = closeAllWindows;
window.getSystemInfo = getSystemInfo;
