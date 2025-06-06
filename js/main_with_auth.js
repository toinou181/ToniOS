// ===============================================
// TONIOS - SYSTÈME PRINCIPAL
// ===============================================

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
    setupVoiceShortcuts();
    setupDesktopInteractions();
    
    // Vérifier si une session existe (fonction dans auth.js)
    setTimeout(() => {
        checkAutoLogin();
    }, 500);
    
    console.log('✅ ToniOS initialisé avec succès !');
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
        <div class="tonios-context-item" onclick="createNewFile('text')">
            <span class="tonios-context-icon">📝</span>
            Nouveau fichier texte
        </div>
        <div class="tonios-context-item" onclick="openApplicationFromDesktop('filemanager')">
            <span class="tonios-context-icon">📁</span>
            Gestionnaire de fichiers
        </div>
        <div class="tonios-context-separator"></div>
        <div class="tonios-context-item" onclick="openApplicationFromDesktop('systemprops')">
            <span class="tonios-context-icon">⚙️</span>
            Propriétés du système
        </div>
        <div class="tonios-context-item" onclick="showAboutDialog()">
            <span class="tonios-context-icon">ℹ️</span>
            À propos de ToniOS
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Ajuster la position si le menu dépasse
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = (y - rect.height) + 'px';
    }
    
    // Fermer le menu au clic ailleurs
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

function handleWindowResize() {
    // Ajuster les fenêtres qui dépassent
    document.querySelectorAll('.tonios-window').forEach(window => {
        const rect = window.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            window.style.left = (window.innerWidth - rect.width - 10) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            window.style.top = (window.innerHeight - rect.height - 10) + 'px';
        }
    });
}

function handleDesktopClick(event) {
    // Désélectionner les fichiers si clic sur le bureau
    if (event.target.classList.contains('tonios-desktop-area') || 
        event.target.classList.contains('tonios-desktop')) {
        clearFileSelection();
        hideContextMenu();
    }
}

function handleBeforeUnload(event) {
    if (currentSession) {
        // Sauvegarder automatiquement avant fermeture
        saveUserData();
        saveChannelsData();
        localStorage.setItem('tonios_last_user', currentSession.username);
        
        // Message de confirmation (optionnel)
        const hasUnsavedWork = openWindows.some(w => w.appType === 'notepad');
        if (hasUnsavedWork) {
            event.preventDefault();
            event.returnValue = 'Vous avez des documents non sauvegardés. Êtes-vous sûr de vouloir quitter ?';
        }
    }
}

// Interactions du bureau
function setupDesktopInteractions() {
    const desktop = document.querySelector('.tonios-desktop-area');
    if (!desktop) return;
    
    let isSelecting = false;
    let startPos = { x: 0, y: 0 };
    
    desktop.addEventListener('mousedown', (e) => {
        if (e.button === 0 && e.target === desktop) { // Clic gauche sur le bureau
            isSelecting = true;
            startPos = { x: e.clientX, y: e.clientY };
            
            // Créer la boîte de sélection
            const selectionBox = document.createElement('div');
            selectionBox.id = 'selectionBox';
            selectionBox.className = 'tonios-selection-box';
            selectionBox.style.left = e.clientX + 'px';
            selectionBox.style.top = e.clientY + 'px';
            document.body.appendChild(selectionBox);
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isSelecting) {
            const selectionBox = document.getElementById('selectionBox');
            if (selectionBox) {
                const width = Math.abs(e.clientX - startPos.x);
                const height = Math.abs(e.clientY - startPos.y);
                const left = Math.min(e.clientX, startPos.x);
                const top = Math.min(e.clientY, startPos.y);
                
                selectionBox.style.width = width + 'px';
                selectionBox.style.height = height + 'px';
                selectionBox.style.left = left + 'px';
                selectionBox.style.top = top + 'px';
            }
        }
    });
    
    document.addEventListener('mouseup', (e) => {
        if (isSelecting) {
            isSelecting = false;
            const selectionBox = document.getElementById('selectionBox');
            if (selectionBox) {
                selectionBox.remove();
            }
        }
    });
}

// Exposer globalement la fonction
window.setupDesktopInteractions = setupDesktopInteractions;

// Raccourcis clavier pour ToniOS
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+N : Nouveau fichier
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            createNewFile('text');
            NotificationTypes.SHORTCUT_USED('Ctrl+N');
        }
        
        // Ctrl+O : Ouvrir gestionnaire de fichiers
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            openApplicationFromDesktop('filemanager');
            NotificationTypes.SHORTCUT_USED('Ctrl+O');
        }
        
        // Ctrl+Shift+C : Ouvrir calculatrice
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            openApplicationFromDesktop('calculator');
            NotificationTypes.SHORTCUT_USED('Ctrl+Shift+C');
        }
        
        // Ctrl+Shift+T : Ouvrir chat
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            openApplicationFromDesktop('chat');
            NotificationTypes.SHORTCUT_USED('Ctrl+Shift+T');
        }
        
        // Ctrl+Shift+V : Basculer en chat vocal
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            const chatApp = openWindows.find(w => w.appType === 'chat');
            if (chatApp) {
                startVoiceRecording();
            } else {
                openApplicationFromDesktop('chat');
                setTimeout(() => startVoiceRecording(), 500);
            }
            NotificationTypes.SHORTCUT_USED('Ctrl+Shift+V');
        }
        
        // Ctrl+Shift+M : Toggle microphone
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            toggleMicrophone();
            NotificationTypes.SHORTCUT_USED('Ctrl+Shift+M');
        }
        
        // F1 : Aide
        if (e.key === 'F1') {
            e.preventDefault();
            showHelpDialog();
        }
        
        // F5 : Actualiser le bureau
        if (e.key === 'F5') {
            e.preventDefault();
            refreshDesktop();
            NotificationTypes.SHORTCUT_USED('F5');
        }
        
        // Échap : Fermer menus et modales
        if (e.key === 'Escape') {
            closeStartMenu();
            hideContextMenu();
            // Fermer viewer d'image si ouvert
            const imageViewer = document.querySelector('.tonios-image-viewer');
            if (imageViewer) {
                imageViewer.remove();
            }
        }
        
        // Delete : Supprimer fichiers sélectionnés
        if (e.key === 'Delete') {
            deleteSelectedFiles();
        }
        
        // Alt+Tab : Changer de fenêtre
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault();
            switchToNextWindow();
        }
        
        // Ctrl+Q : Déconnexion rapide
        if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                logout();
            }
        }
    });
}

function switchToNextWindow() {
    if (openWindows.length === 0) return;
    
    const visibleWindows = openWindows.filter(w => !w.isMinimized);
    if (visibleWindows.length === 0) return;
    
    const currentZ = Math.max(...visibleWindows.map(w => {
        const el = document.getElementById(w.id);
        return el ? parseInt(el.style.zIndex) || 0 : 0;
    }));
    
    const currentWindow = visibleWindows.find(w => {
        const el = document.getElementById(w.id);
        return el && (parseInt(el.style.zIndex) || 0) === currentZ;
    });
    
    if (currentWindow) {
        const currentIndex = visibleWindows.indexOf(currentWindow);
        const nextIndex = (currentIndex + 1) % visibleWindows.length;
        const nextWindow = visibleWindows[nextIndex];
        bringToFront(nextWindow.id);
        showNotification(`Basculé vers ${nextWindow.title}`, 'info', 1000);
    }
}

// Fonctions utilitaires
function refreshDesktop() {
    if (currentSession) {
        loadUserData();
        refreshFileList();
        initializeChannels();
        updateTaskbar();
        showNotification('Bureau actualisé ! 🔄', 'info');
    }
}

function showAboutDialog() {
    const about = document.createElement('div');
    about.className = 'tonios-modal';
    about.innerHTML = `
        <div class="tonios-modal-content">
            <div class="tonios-modal-header">
                <h2>🖥️ À propos de ToniOS</h2>
                <button onclick="this.closest('.tonios-modal').remove()" class="tonios-modal-close">❌</button>
            </div>
            <div class="tonios-modal-body">
                <div class="tonios-about-info">
                    <div class="tonios-about-logo">💻</div>
                    <h3>ToniOS</h3>
                    <p>Système d'exploitation web moderne</p>
                    <div class="tonios-about-version">Version 1.0</div>
                    
                    <div class="tonios-about-features">
                        <h4>✨ Fonctionnalités :</h4>
                        <ul>
                            <li>🖥️ Interface utilisateur complète</li>
                            <li>📁 Gestionnaire de fichiers</li>
                            <li>💬 Chat texte et vocal</li>
                            <li>🧮 Applications intégrées</li>
                            <li>👥 Système multi-utilisateurs</li>
                            <li>🔐 Gestion des permissions</li>
                            <li>🎨 Interface moderne et responsive</li>
                        </ul>
                    </div>
                    
                    <div class="tonios-about-credits">
                        <p>Développé avec ❤️ pour l'éducation et le divertissement</p>
                        <p>© 2024 ToniOS Project</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(about);
    
    // Fermer au clic sur l'overlay
    about.onclick = (e) => {
        if (e.target === about) {
            about.remove();
        }
    };
}

function showHelpDialog() {
    const help = document.createElement('div');
    help.className = 'tonios-modal';
    help.innerHTML = `
        <div class="tonios-modal-content tonios-help-modal">
            <div class="tonios-modal-header">
                <h2>❓ Aide ToniOS</h2>
                <button onclick="this.closest('.tonios-modal').remove()" class="tonios-modal-close">❌</button>
            </div>
            <div class="tonios-modal-body">
                <div class="tonios-help-content">
                    <div class="tonios-help-section">
                        <h3>⌨️ Raccourcis clavier</h3>
                        <div class="tonios-help-shortcuts">
                            <div><kbd>Ctrl+N</kbd> - Nouveau fichier</div>
                            <div><kbd>Ctrl+O</kbd> - Gestionnaire de fichiers</div>
                            <div><kbd>Ctrl+Shift+C</kbd> - Calculatrice</div>
                            <div><kbd>Ctrl+Shift+T</kbd> - Chat</div>
                            <div><kbd>Ctrl+Shift+V</kbd> - Chat vocal</div>
                            <div><kbd>Ctrl+Shift+M</kbd> - Toggle microphone</div>
                            <div><kbd>F1</kbd> - Aide</div>
                            <div><kbd>F5</kbd> - Actualiser bureau</div>
                            <div><kbd>Alt+Tab</kbd> - Changer de fenêtre</div>
                            <div><kbd>Ctrl+Q</kbd> - Déconnexion</div>
                            <div><kbd>Echap</kbd> - Fermer menus</div>
                            <div><kbd>Delete</kbd> - Supprimer fichiers</div>
                        </div>
                    </div>
                    
                    <div class="tonios-help-section">
                        <h3>💬 Commandes chat</h3>
                        <div class="tonios-help-commands">
                            <div><code>/help</code> - Afficher l'aide</div>
                            <div><code>/clear</code> - Effacer les messages</div>
                            <div><code>/me &lt;action&gt;</code> - Action personnalisée</div>
                            <div><code>/time</code> - Afficher l'heure</div>
                            <div><code>/users</code> - Lister les utilisateurs</div>
                            <div><code>/channel &lt;nom&gt;</code> - Changer de canal</div>
                        </div>
                    </div>
                    
                    <div class="tonios-help-section">
                        <h3>🎯 Conseils d'utilisation</h3>
                        <ul>
                            <li>Glissez-déposez des fichiers pour les importer</li>
                            <li>Clic droit sur le bureau pour le menu contextuel</li>
                            <li>Double-cliquez sur les fichiers pour les ouvrir</li>
                            <li>Utilisez le chat vocal dans les canaux vocaux</li>
                            <li>Gérez vos permissions selon votre rôle</li>
                            <li>Sauvegardez régulièrement vos données</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(help);
    
    // Fermer au clic sur l'overlay
    help.onclick = (e) => {
        if (e.target === help) {
            help.remove();
        }
    };
}

// Menu démarrer
function toggleStartMenu() {
    const startMenu = document.getElementById('startMenu');
    if (!startMenu) return;

    if (startMenu.style.display === 'block') {
        closeStartMenu();
    } else {
        openStartMenu();
    }
}

function openStartMenu() {
    const startMenu = document.getElementById('startMenu');
    if (startMenu) {
        startMenu.style.display = 'block';
        startMenu.style.animation = 'slideUp 0.3s ease';
        
        // Fermer au clic ailleurs
        setTimeout(() => {
            document.addEventListener('click', closeStartMenuOnClick);
        }, 100);
    }
}

function closeStartMenu() {
    const startMenu = document.getElementById('startMenu');
    if (startMenu && startMenu.style.display === 'block') {
        startMenu.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            startMenu.style.display = 'none';
        }, 300);
        
        document.removeEventListener('click', closeStartMenuOnClick);
    }
}

function closeStartMenuOnClick(event) {
    const startMenu = document.getElementById('startMenu');
    const startButton = document.querySelector('.tonios-start-button');
    
    if (startMenu && !startMenu.contains(event.target) && 
        startButton && !startButton.contains(event.target)) {
        closeStartMenu();
    }
}

// Calculatrice
function appendToCalculator(value) {
    const display = document.getElementById('calcDisplay');
    if (display) {
        if (display.value === '0' && !isNaN(value)) {
            display.value = value;
        } else {
            display.value += value;
        }
    }
}

function clearCalculator() {
    const display = document.getElementById('calcDisplay');
    if (display) {
        display.value = '0';
    }
}

function deleteLast() {
    const display = document.getElementById('calcDisplay');
    if (display && display.value.length > 1) {
        display.value = display.value.slice(0, -1);
    } else if (display) {
        display.value = '0';
    }
}

function calculateResult() {
    const display = document.getElementById('calcDisplay');
    if (display) {
        try {
            // Remplacer les symboles pour l'évaluation
            let expression = display.value
                .replace(/×/g, '*')
                .replace(/÷/g, '/');
            
            // Évaluation sécurisée
            const result = Function('"use strict"; return (' + expression + ')')();
            
            if (isFinite(result)) {
                display.value = result.toString();
            } else {
                throw new Error('Résultat invalide');
            }
        } catch (error) {
            display.value = 'Erreur';
            NotificationTypes.CALCULATION_ERROR();
            setTimeout(() => {
                display.value = '0';
            }, 1500);
        }
    }
}

// Statistiques système
function getSystemStats() {
    const stats = {
        uptime: Date.now() - (window.toniosStartTime || Date.now()),
        memory: (JSON.stringify(localStorage).length / 1024).toFixed(2) + ' KB',
        userFiles: userFiles.length,
        openWindows: openWindows.length,
        chatMessages: chatMessages.length,
        performance: {
            loadTime: (window.toniosStartTime ? Date.now() - window.toniosStartTime : 0) + 'ms',
            screenResolution: `${screen.width}×${screen.height}`,
            colorDepth: screen.colorDepth + ' bits',
            language: navigator.language
        }
    };
    return stats;
}

// Gestionnaire d'état des applications
function getAppState() {
    return {
        openWindows: openWindows.length,
        userFiles: userFiles.length,
        chatMessages: chatMessages.length,
        currentUser: getCurrentUser(),
        timestamp: new Date().toISOString()
    };
}

// Fonction de déconnexion depuis l'interface
function handleLogout() {
    if (currentSession) {
        const username = currentSession.username;
        logoutUser();
        
        // Masquer le bureau et afficher l'écran de connexion
        document.querySelector('.tonios-desktop').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        
        // Nettoyer l'interface
        closeAllWindows();
        
        showNotification(`Au revoir ${username} !`, 'info');
    }
}

function closeAllWindows() {
    openWindows.forEach(windowId => {
        const windowElement = document.getElementById(windowId);
        if (windowElement) {
            windowElement.remove();
        }
    });
    openWindows = [];
    updateTaskbar();
}

// Ajouter un bouton de déconnexion dans l'interface
function addLogoutButton() {
    const sessionInfo = document.getElementById('sessionInfo');
    if (sessionInfo && currentSession) {
        // Ajouter un bouton de déconnexion
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = '🚪';
        logoutBtn.title = 'Se déconnecter';
        logoutBtn.style.cssText = `
            background: rgba(231, 76, 60, 0.8);
            border: none;
            color: white;
            padding: 5px 8px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
            font-size: 12px;
        `;
        logoutBtn.onclick = () => {
            if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                handleLogout();
            }
        };
        
        sessionInfo.appendChild(logoutBtn);
    }
}

// ===============================================
// GESTION DES APPLICATIONS ET DU MENU
// ===============================================

// Variable pour le menu démarrer
let isStartMenuOpen = false;

// Fonction pour ouvrir/fermer le menu démarrer
function toggleStartMenu() {
    const startMenu = document.getElementById('startMenu');
    if (!startMenu) return;

    isStartMenuOpen = !isStartMenuOpen;
    startMenu.style.display = isStartMenuOpen ? 'block' : 'none';
}

// Fonction pour fermer le menu démarrer
function closeStartMenu() {
    const startMenu = document.getElementById('startMenu');
    if (!startMenu) return;
    
    isStartMenuOpen = false;
    startMenu.style.display = 'none';
}

// Fonction principale pour ouvrir une application
function openApplicationFromDesktop(appName) {
    console.log(`🚀 Ouverture de l'application: ${appName}`);
    
    // Fermer le menu démarrer si ouvert
    closeStartMenu();
    
    // Utiliser directement la fonction de windows.js
    if (typeof window.openApplication === 'function') {
        window.openApplication(appName);
    } else {
        showNotification(`Système de fenêtres non disponible`, 'error');
    }
}

// Exposer la fonction globalement
window.openApplicationFromDesktop = openApplicationFromDesktop;

// Exposer globalement la fonction
window.openApplicationFromDesktop = openApplicationFromDesktop;

// Fonction pour créer le contenu de la calculatrice
function createCalculatorContent() {
    return `
        <div class="tonios-calculator">
            <div class="tonios-calculator-display">
                <input type="text" id="calcDisplay" readonly value="0">
            </div>
            <div class="tonios-calculator-buttons">
                <button onclick="calcClear()">C</button>
                <button onclick="calcClearEntry()">CE</button>
                <button onclick="calcBackspace()">⌫</button>
                <button onclick="calcOperation('/')" class="calc-operator">÷</button>
                
                <button onclick="calcNumber('7')">7</button>
                <button onclick="calcNumber('8')">8</button>
                <button onclick="calcNumber('9')">9</button>
                <button onclick="calcOperation('*')" class="calc-operator">×</button>
                
                <button onclick="calcNumber('4')">4</button>
                <button onclick="calcNumber('5')">5</button>
                <button onclick="calcNumber('6')">6</button>
                <button onclick="calcOperation('-')" class="calc-operator">-</button>
                
                <button onclick="calcNumber('1')">1</button>
                <button onclick="calcNumber('2')">2</button>
                <button onclick="calcNumber('3')">3</button>
                <button onclick="calcOperation('+')" class="calc-operator">+</button>
                
                <button onclick="calcNumber('0')" class="calc-zero">0</button>
                <button onclick="calcDecimal()">.</button>
                <button onclick="calcEquals()" class="calc-equals">=</button>
            </div>
        </div>
    `;
}

// Fonction pour créer le contenu du bloc-notes
function createNotepadContent() {
    return `
        <div class="tonios-notepad">
            <div class="tonios-notepad-toolbar">
                <button onclick="notepadNew()">📄 Nouveau</button>
                <button onclick="notepadSave()">💾 Sauvegarder</button>
                <button onclick="notepadLoad()">📂 Ouvrir</button>
                <span style="margin: 0 10px;">|</span>
                <button onclick="notepadUndo()">↶ Annuler</button>
                <button onclick="notepadRedo()">↷ Refaire</button>
            </div>
            <textarea id="notepadText" class="tonios-notepad-textarea" placeholder="Tapez votre texte ici..."></textarea>
        </div>
    `;
}

// Fonction pour créer le contenu du gestionnaire de fichiers
function createFileManagerContent() {
    return `
        <div class="tonios-filemanager">
            <div class="tonios-filemanager-toolbar">
                <button onclick="fileManagerNew()">📁 Nouveau dossier</button>
                <button onclick="fileManagerUpload()">📤 Importer</button>
                <button onclick="fileManagerRefresh()">🔄 Actualiser</button>
            </div>
            <div class="tonios-filemanager-content">
                <div id="fileManagerList" class="tonios-filemanager-list">
                    <div class="tonios-file-item">
                        <span class="tonios-file-icon">📁</span>
                        <span class="tonios-file-name">Documents</span>
                    </div>
                    <div class="tonios-file-item">
                        <span class="tonios-file-icon">📁</span>
                        <span class="tonios-file-name">Images</span>
                    </div>
                    <div class="tonios-file-item">
                        <span class="tonios-file-icon">📄</span>
                        <span class="tonios-file-name">readme.txt</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour créer le contenu des propriétés système
function createSystemPropsContent() {
    const uptime = Math.floor((Date.now() - (window.toniosStartTime || Date.now())) / 1000);
    const uptimeStr = formatUptime(uptime);
    
    return `
        <div class="tonios-systemprops">
            <h3>🖥️ Informations système</h3>
            <div class="tonios-system-info">
                <div class="tonios-info-row">
                    <span class="tonios-info-label">Système :</span>
                    <span class="tonios-info-value">ToniOS v2.0</span>
                </div>
                <div class="tonios-info-row">
                    <span class="tonios-info-label">Utilisateur :</span>
                    <span class="tonios-info-value">${currentSession?.username || 'Invité'}</span>
                </div>
                <div class="tonios-info-row">
                    <span class="tonios-info-label">Rôle :</span>
                    <span class="tonios-info-value">${currentSession?.role || 'user'}</span>
                </div>
                <div class="tonios-info-row">
                    <span class="tonios-info-label">Temps de session :</span>
                    <span class="tonios-info-value">${uptimeStr}</span>
                </div>
                <div class="tonios-info-row">
                    <span class="tonios-info-label">Navigateur :</span>
                    <span class="tonios-info-value">${navigator.userAgent.split(' ')[0]}</span>
                </div>
                <div class="tonios-info-row">
                    <span class="tonios-info-label">Résolution :</span>
                    <span class="tonios-info-value">${screen.width}x${screen.height}</span>
                </div>
            </div>
            <div class="tonios-system-actions">
                <button onclick="openModerationPanel()" style="background: #e74c3c;">🛡️ Modération</button>
                <button onclick="showNotification('Système actualisé', 'success')">🔄 Actualiser</button>
            </div>
        </div>
    `;
}

// Fonction pour créer le contenu du sélecteur de fond d'écran
function createWallpaperContent() {
    return `
        <div class="tonios-wallpaper">
            <h3>🎨 Personnaliser le fond d'écran</h3>
            <div class="tonios-wallpaper-options">
                <div class="tonios-wallpaper-preset" onclick="setWallpaper('gradient1')" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                     Gradient 1
                </div>
                <div class="tonios-wallpaper-preset" onclick="setWallpaper('gradient2')" 
                     style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                     Gradient 2
                </div>
                <div class="tonios-wallpaper-preset" onclick="setWallpaper('gradient3')" 
                     style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                     Gradient 3
                </div>
                <div class="tonios-wallpaper-preset" onclick="setWallpaper('solid1')" 
                     style="background: #2c3e50;">
                     Sombre
                </div>
                <div class="tonios-wallpaper-preset" onclick="setWallpaper('solid2')" 
                     style="background: #34495e;">
                     Gris
                </div>
                <div class="tonios-wallpaper-preset" onclick="setWallpaper('solid3')" 
                     style="background: #3498db;">
                     Bleu
                </div>
            </div>
        </div>
    `;
}

// Fonction pour créer le contenu du chat
function createChatContent() {
    return `
        <div class="tonios-chat-window">
            <div class="tonios-chat-header">
                <div class="tonios-chat-tabs">
                    <div class="tonios-chat-tab active" onclick="switchChatTab('general')">
                        💬 Général
                    </div>
                    <div class="tonios-chat-tab" onclick="switchChatTab('voice')">
                        🎤 Vocal
                    </div>
                </div>
                <div class="tonios-chat-users">
                    <span id="chatUsersCount">1 utilisateur</span>
                </div>
            </div>
            
            <div class="tonios-chat-content">
                <div id="chatGeneral" class="tonios-chat-messages">
                    <div class="tonios-chat-system-message">
                        🤖 Bienvenue dans le chat ToniOS ! Tapez votre message ci-dessous.
                    </div>
                </div>
                
                <div id="chatVoice" class="tonios-chat-voice hidden">
                    <div class="tonios-voice-controls">
                        <button id="voiceStartBtn" onclick="startVoiceRecording()" class="tonios-voice-btn">
                            🎤 Commencer l'enregistrement
                        </button>
                        <button id="voiceStopBtn" onclick="stopVoiceRecording()" class="tonios-voice-btn" disabled>
                            ⏹️ Arrêter
                        </button>
                        <button onclick="playLastRecording()" class="tonios-voice-btn">
                            ▶️ Écouter
                        </button>
                    </div>
                    <div id="voiceTranscription" class="tonios-voice-transcription">
                        Transcription apparaîtra ici...
                    </div>
                </div>
            </div>
            
            <div class="tonios-chat-input">
                <input type="text" id="chatInput" placeholder="Tapez votre message..." 
                       onkeypress="handleChatKeyPress(event)">
                <button onclick="sendChatMessage()" class="tonios-chat-send-btn">
                    📤 Envoyer
                </button>
            </div>
        </div>
    `;
}

// ===============================================
// FONCTIONS DU CHAT
// ===============================================

let currentChatTab = 'general';
let chatMessages = [];

function switchChatTab(tab) {
    currentChatTab = tab;
    
    // Mettre à jour les onglets
    document.querySelectorAll('.tonios-chat-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[onclick="switchChatTab('${tab}')"]`).classList.add('active');
    
    // Afficher le bon contenu
    document.getElementById('chatGeneral').classList.toggle('hidden', tab !== 'general');
    document.getElementById('chatVoice').classList.toggle('hidden', tab !== 'voice');
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    const chatMessages = document.getElementById('chatGeneral');
    if (!chatMessages) return;
    
    // Ajouter le message à l'interface
    const messageElement = document.createElement('div');
    messageElement.className = 'tonios-chat-message tonios-chat-message-user';
    messageElement.innerHTML = `
        <div class="tonios-chat-message-header">
            <span class="tonios-chat-username">${currentSession?.username || 'Utilisateur'}</span>
            <span class="tonios-chat-time">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="tonios-chat-message-content">${escapeHtml(message)}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Vider l'input
    input.value = '';
    
    // Simuler une réponse automatique après 1-3 secondes
    setTimeout(() => {
        addAutomaticResponse(message);
    }, Math.random() * 2000 + 1000);
}

function addAutomaticResponse(originalMessage) {
    const chatMessages = document.getElementById('chatGeneral');
    if (!chatMessages) return;
    
    const responses = [
        "Intéressant ! 🤔",
        "Je suis d'accord avec vous ! 👍",
        "C'est une bonne idée ! 💡",
        "Merci pour ce message ! 😊",
        "Pouvez-vous en dire plus ? 🤔",
        "Excellent point ! ⭐",
        "Je n'y avais pas pensé ! 💭"
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    const messageElement = document.createElement('div');
    messageElement.className = 'tonios-chat-message tonios-chat-message-system';
    messageElement.innerHTML = `
        <div class="tonios-chat-message-header">
            <span class="tonios-chat-username">🤖 Assistant ToniOS</span>
            <span class="tonios-chat-time">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="tonios-chat-message-content">${response}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fonctions vocal (versions simplifiées)
function startVoiceRecording() {
    const startBtn = document.getElementById('voiceStartBtn');
    const stopBtn = document.getElementById('voiceStopBtn');
    
    if (startBtn && stopBtn) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        showNotification('Enregistrement vocal démarré', 'info');
        
        // Simuler l'enregistrement
        setTimeout(() => {
            stopVoiceRecording();
        }, 5000);
    }
}

function stopVoiceRecording() {
    const startBtn = document.getElementById('voiceStartBtn');
    const stopBtn = document.getElementById('voiceStopBtn');
    const transcription = document.getElementById('voiceTranscription');
    
    if (startBtn && stopBtn) {
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
    
    if (transcription) {
        transcription.textContent = 'Enregistrement terminé - Transcription simulée : "Ceci est un test vocal"';
    }
    
    showNotification('Enregistrement vocal terminé', 'success');
}

function playLastRecording() {
    showNotification('Lecture de l\'enregistrement...', 'info');
}

// ===============================================
// FONCTIONS DU BLOC-NOTES
// ===============================================

function notepadNew() {
    const textarea = document.getElementById('notepadText');
    if (textarea) {
        if (textarea.value && !confirm('Créer un nouveau document ? Le contenu actuel sera perdu.')) {
            return;
        }
        textarea.value = '';
        showNotification('Nouveau document créé', 'success');
    }
}

function notepadSave() {
    const textarea = document.getElementById('notepadText');
    if (!textarea) return;
    
    const content = textarea.value;
    const filename = prompt('Nom du fichier:', 'document.txt');
    
    if (filename) {
        // Simuler la sauvegarde
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification(`Fichier "${filename}" sauvegardé`, 'success');
    }
}

function notepadLoad() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.js,.css,.html';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const textarea = document.getElementById('notepadText');
                if (textarea) {
                    textarea.value = e.target.result;
                    showNotification(`Fichier "${file.name}" chargé`, 'success');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

function notepadUndo() {
    document.execCommand('undo');
}

function notepadRedo() {
    document.execCommand('redo');
}

// ===============================================
// FONCTIONS DU GESTIONNAIRE DE FICHIERS
// ===============================================

function fileManagerNew() {
    const name = prompt('Nom du nouveau dossier:', 'Nouveau dossier');
    if (name) {
        showNotification(`Dossier "${name}" créé`, 'success');
        // Ici on pourrait ajouter le dossier à la liste
    }
}

function fileManagerUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    input.onchange = function(e) {
        const files = Array.from(e.target.files);
        showNotification(`${files.length} fichier(s) importé(s)`, 'success');
        // Ici on pourrait traiter les fichiers
    };
    
    input.click();
}

function fileManagerRefresh() {
    showNotification('Liste des fichiers actualisée', 'info');
    // Ici on pourrait recharger la liste des fichiers
}

// ===============================================
// SYSTÈME D'HORLOGE
// ===============================================

let clockInterval = null;

function startClock() {
    // Arrêter l'horloge existante si elle existe
    if (clockInterval) {
        clearInterval(clockInterval);
    }
    
    // Mettre à jour l'horloge immédiatement
    updateClock();
    
    // Mettre à jour l'horloge toutes les secondes
    clockInterval = setInterval(updateClock, 1000);
}

function updateClock() {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR');
    clockElement.textContent = timeString;
    
    // Mettre à jour le temps de session
    updateSessionTime();
}

function updateSessionTime() {
    const sessionTimeElement = document.getElementById('sessionTime');
    if (!sessionTimeElement || !sessionStartTime) return;
    
    const now = Date.now();
    const sessionDuration = Math.floor((now - sessionStartTime) / 1000);
    const hours = Math.floor(sessionDuration / 3600);
    const minutes = Math.floor((sessionDuration % 3600) / 60);
    
    if (hours > 0) {
        sessionTimeElement.textContent = `${hours}h ${minutes}m`;
    } else {
        sessionTimeElement.textContent = `${minutes}m`;
    }
}

// ===============================================
// GESTION DU MENU CONTEXTUEL
// ===============================================

function closeContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
}

function showContextMenu(x, y) {
    const contextMenu = document.getElementById('contextMenu');
    if (!contextMenu) return;
    
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.style.display = 'block';
}

// ===============================================
// GESTIONNAIRES D'ÉVÉNEMENTS
// ===============================================

function handleRightClick(e) {
    e.preventDefault();
    
    // Vérifier si on est sur le bureau
    const desktop = document.querySelector('.tonios-desktop-area');
    if (desktop && desktop.contains(e.target) && e.target === desktop) {
        showContextMenu(e.clientX, e.clientY);
    } else {
        closeContextMenu();
    }
}

function handleDesktopClick(e) {
    // Fermer le menu contextuel si on clique ailleurs
    if (!e.target.closest('#contextMenu')) {
        closeContextMenu();
    }
    
    // Fermer le menu démarrer si on clique ailleurs
    if (!e.target.closest('#startMenu') && !e.target.closest('.tonios-start-button')) {
        closeStartMenu();
    }
}

function handleWindowResize() {
    // Réajuster les fenêtres si nécessaire
    const windows = document.querySelectorAll('.tonios-window');
    windows.forEach(window => {
        const rect = window.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            window.style.left = (window.innerWidth - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            window.style.top = (window.innerHeight - rect.height) + 'px';
        }
    });
}

function handleBeforeUnload(e) {
    if (currentSession) {
        saveDesktopLayout();
        
        if (currentSession.preferences.rememberSession) {
            saveCurrentSession();
        }
    }
    
    // Pas de message de confirmation pour une meilleure UX
    return undefined;
}

// Variables pour le drag & drop
let isDragging = false;
let dragTarget = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function handleMouseMove(e) {
    if (!isDragging || !dragTarget) return;
    
    const newX = e.clientX - dragOffsetX;
    const newY = e.clientY - dragOffsetY;
    
    dragTarget.style.left = Math.max(0, newX) + 'px';
    dragTarget.style.top = Math.max(0, newY) + 'px';
}

function handleMouseUp(e) {
    if (isDragging && dragTarget) {
        isDragging = false;
        dragTarget.classList.remove('dragging');
        dragTarget = null;
        
        // Sauvegarder la position des fenêtres
        saveDesktopLayout();
    }
}

// Drag & drop de fichiers
function handleDragOver(e) {
    e.preventDefault();
    const dropZone = document.getElementById('fileDropZone');
    if (dropZone) {
        dropZone.style.display = 'block';
    }
}

function handleDragLeave(e) {
    // Vérifier si on quitte vraiment la zone
    if (e.clientX === 0 && e.clientY === 0) {
        const dropZone = document.getElementById('fileDropZone');
        if (dropZone) {
            dropZone.style.display = 'none';
        }
    }
}

function handleDrop(e) {
    e.preventDefault();
    const dropZone = document.getElementById('fileDropZone');
    if (dropZone) {
        dropZone.style.display = 'none';
    }
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        showNotification(`${files.length} fichier(s) déposé(s)`, 'success');
        // Ici on pourrait traiter les fichiers
    }
}

// Fonction pour réinitialiser le bureau après connexion
function reinitializeDesktop() {
    console.log('🔄 Réinitialisation du bureau...');
    
    // Réinitialiser les interactions du bureau
    setupDesktopInteractions();
    
    // Réattacher les événements aux icônes du bureau
    const icons = document.querySelectorAll('.tonios-desktop-icon');
    icons.forEach(icon => {
        // Récupérer l'attribut onclick pour le réattacher
        const onclickAttr = icon.getAttribute('onclick');
        if (onclickAttr) {
            console.log(`🔧 Réattachement événement: ${onclickAttr}`);
            // Supprimer et réattacher l'événement
            icon.removeAttribute('onclick');
            icon.addEventListener('click', function() {
                eval(onclickAttr);
            });
        }
    });
    
    // Réattacher les événements aux items du menu démarrer
    const startMenuApps = document.querySelectorAll('.tonios-start-menu-app');
    startMenuApps.forEach(app => {
        const onclickAttr = app.getAttribute('onclick');
        if (onclickAttr) {
            console.log(`🔧 Réattachement menu: ${onclickAttr}`);
            app.removeAttribute('onclick');
            app.addEventListener('click', function() {
                eval(onclickAttr);
            });
        }
    });
    
    // Réattacher le clic droit sur le bureau
    const desktop = document.querySelector('.tonios-desktop-area');
    if (desktop) {
        desktop.addEventListener('contextmenu', handleRightClick);
    }
    
    // Assurer que les fenêtres peuvent être créées
    initializeWindowSystem();
    
    console.log('✅ Bureau réinitialisé avec événements réattachés');
}

// Exposer les fonctions globalement
window.reinitializeDesktop = reinitializeDesktop;
window.setupDesktopInteractions = setupDesktopInteractions;

// Exposer globalement la fonction
window.reinitializeDesktop = reinitializeDesktop;

// Initialiser le système de fenêtres
function initializeWindowSystem() {
    // S'assurer que le conteneur de fenêtres existe
    let windowContainer = document.getElementById('windowContainer');
    if (!windowContainer) {
        windowContainer = document.createElement('div');
        windowContainer.id = 'windowContainer';
        windowContainer.className = 'tonios-window-container';
        document.body.appendChild(windowContainer);
    }
}

// Exposer les autres fonctions globalement pour accessibilité
window.setupDesktopInteractions = setupDesktopInteractions;
window.initializeWindowSystem = initializeWindowSystem;
