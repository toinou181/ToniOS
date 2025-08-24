// ===============================================
// TONIOS - SYSTÈME PRINCIPAL (VERSION ORIGINALE)
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

// Initialisation du système
document.addEventListener('DOMContentLoaded', function() {
    initializeToniOS();
});

function initializeToniOS() {
    console.log('🖥️ Initialisation de ToniOS...');
    
    // Marquer le temps de démarrage
    window.toniosStartTime = Date.now();
    
    // Initialiser les systèmes
    setupEventListeners();
    initializeNotifications();
    setupDesktopInteractions();
    updateClock();
    
    // Afficher le bureau
    showDesktop();
    
    console.log('✅ ToniOS initialisé avec succès !');
}

function showDesktop() {
    const desktop = document.querySelector('.tonios-desktop');
    if (desktop) {
        desktop.style.display = 'block';
    }
}

// Configuration des événements globaux
function setupEventListeners() {
    // Gestion du drag & drop global
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    
    // Gestion du drag des fenêtres
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Clic droit pour menu contextuel
    document.addEventListener('contextmenu', handleRightClick);
    
    // Gestion du redimensionnement de la fenêtre
    window.addEventListener('resize', handleWindowResize);
    
    // Clic sur le bureau pour désélectionner
    document.addEventListener('click', handleDesktopClick);
    
    // Prévenir la fermeture accidentelle
    window.addEventListener('beforeunload', handleBeforeUnload);
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
    
    startMenu.classList.add('show');
    isStartMenuOpen = true;
}

function closeStartMenu() {
    const startMenu = document.getElementById('startMenu');
    if (!startMenu) return;
    
    startMenu.classList.remove('show');
    isStartMenuOpen = false;
}

// Gestion de l'horloge
function updateClock() {
    const clockElement = document.getElementById('taskbarClock');
    if (clockElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        clockElement.textContent = timeString;
    }
    
    // Mettre à jour toutes les minutes
    setTimeout(updateClock, 60000);
}

// Interactions du bureau
function setupDesktopInteractions() {
    const desktopArea = document.querySelector('.tonios-desktop-area');
    if (desktopArea) {
        desktopArea.addEventListener('click', closeStartMenu);
    }
}

// Menu contextuel
function handleRightClick(event) {
    event.preventDefault();
    
    // Vérifier si on est sur le bureau
    if (event.target.classList.contains('tonios-desktop-area') || 
        event.target.classList.contains('tonios-desktop')) {
        showContextMenu(event.clientX, event.clientY);
    }
}

function showContextMenu(x, y) {
    // Supprimer le menu existant
    hideContextMenu();
    
    const menu = document.createElement('div');
    menu.className = 'tonios-context-menu';
    menu.id = 'contextMenu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    menu.innerHTML = `
        <div class="tonios-context-item" onclick="refreshDesktop()">
            <span class="tonios-context-icon">🔄</span>
            Actualiser le bureau
        </div>
        <div class="tonios-context-separator"></div>
        <div class="tonios-context-item" onclick="openApplication('notepad')">
            <span class="tonios-context-icon">📝</span>
            Nouveau fichier texte
        </div>
        <div class="tonios-context-item" onclick="openApplication('filemanager')">
            <span class="tonios-context-icon">📁</span>
            Gestionnaire de fichiers
        </div>
        <div class="tonios-context-separator"></div>
        <div class="tonios-context-item" onclick="openApplication('systemprops')">
            <span class="tonios-context-icon">⚙️</span>
            Propriétés du système
        </div>
        <div class="tonios-context-item" onclick="showAboutDialog()">
            <span class="tonios-context-icon">ℹ️</span>
            À propos de ToniOS
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Cacher le menu après un délai ou sur clic
    setTimeout(() => {
        document.addEventListener('click', hideContextMenu, { once: true });
    }, 100);
}

function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) {
        menu.remove();
    }
}

function refreshDesktop() {
    hideContextMenu();
    showNotification('Bureau actualisé', 'Le bureau a été actualisé avec succès.', 'success');
}

function showAboutDialog() {
    hideContextMenu();
    openApplication('about'); // Créer une application à propos
}

// Drag & Drop
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function handleDragLeave(event) {
    event.preventDefault();
}

function handleDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    
    if (files.length > 0) {
        handleFileUpload(files);
    }
}

function handleFileUpload(files) {
    for (let file of files) {
        showNotification('Fichier ajouté', `${file.name} a été ajouté au bureau.`, 'success');
    }
}

// Gestion des fenêtres (drag)
function handleMouseMove(event) {
    if (isDragging && dragData.element) {
        const deltaX = event.clientX - dragData.startX;
        const deltaY = event.clientY - dragData.startY;
        
        const newLeft = dragData.startLeft + deltaX;
        const newTop = dragData.startTop + deltaY;
        
        // Limites de l'écran
        const maxLeft = window.innerWidth - dragData.element.offsetWidth;
        const maxTop = window.innerHeight - dragData.element.offsetHeight - 60; // 60px pour la taskbar
        
        dragData.element.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
        dragData.element.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
    }
}

function handleMouseUp(event) {
    if (isDragging) {
        isDragging = false;
        dragData.element = null;
        document.body.style.cursor = 'default';
    }
}

// Utilitaires
function handleWindowResize() {
    // Réajuster les fenêtres si nécessaire
    Object.values(currentWindows).forEach(windowElement => {
        if (windowElement) {
            const rect = windowElement.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                windowElement.style.left = (window.innerWidth - windowElement.offsetWidth) + 'px';
            }
            if (rect.bottom > window.innerHeight - 60) {
                windowElement.style.top = (window.innerHeight - windowElement.offsetHeight - 60) + 'px';
            }
        }
    });
}

function handleDesktopClick(event) {
    // Fermer le menu contextuel si ouvert
    if (!event.target.closest('.tonios-context-menu')) {
        hideContextMenu();
    }
}

function handleBeforeUnload(event) {
    const hasOpenWindows = Object.keys(currentWindows).length > 0;
    if (hasOpenWindows) {
        event.preventDefault();
        event.returnValue = '';
        return '';
    }
}

// Fonctions utilitaires
function generateId() {
    return 'tonios_' + Math.random().toString(36).substr(2, 9);
}

function getRandomPosition() {
    return {
        x: Math.max(50, Math.random() * (window.innerWidth - 500)),
        y: Math.max(50, Math.random() * (window.innerHeight - 400))
    };
}

// Initialisation des notifications (si le système existe)
function initializeNotifications() {
    if (typeof showNotification === 'function') {
        showNotification('Bienvenue !', 'ToniOS a démarré avec succès.', 'success');
    }
}

// Initialisation des raccourcis vocaux (si le système existe)
function setupVoiceShortcuts() {
    // Cette fonction sera implémentée si le système vocal existe
    console.log('Raccourcis vocaux initialisés');
}
