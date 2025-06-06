// ===============================================
// SYSTÈME DE SÉCURITÉ ADMIN ULTRA-SÉCURISÉ
// ===============================================

class AdminSecuritySystem {
    constructor() {
        this.adminAccessCodes = [
            'ADMIN_TONIOS_2025',
            'MASTER_ACCESS_CODE',
            'ULTRA_SECURE_ADMIN',
            'SECURITY_OVERRIDE_999',
            'ROOT_ACCESS_TONIOS'
        ];
        
        this.bannedIPs = new Set();
        this.failedAttempts = new Map();
        this.suspiciousActivities = new Map();
        this.deviceFingerprints = new Map();
        this.securityLogs = [];
        this.isAdminMode = false;
        
        this.setupAntiReverseEngineering();
        this.initializeSecurityMonitoring();
        this.blockKeyboardShortcuts();
    }

    // Protection anti-reverse engineering
    setupAntiReverseEngineering() {
        // Détection des outils de développement
        this.detectDevTools();
        
        // Protection contre l'inspection
        this.protectAgainstInspection();
        
        // Obfuscation du code
        this.obfuscateSecurityCode();
    }

    detectDevTools() {
        let devtools = {
            open: false,
            orientation: null
        };
        
        setInterval(() => {
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            const heightThreshold = window.outerHeight - window.innerHeight > 160;
            
            if (heightThreshold || widthThreshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.handleSecurityThreat('DEV_TOOLS_DETECTED', 'Outils de développement détectés');
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    protectAgainstInspection() {
        // Bloquer le clic droit
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleSecurityThreat('RIGHT_CLICK_BLOCKED', 'Tentative de clic droit détectée');
        });

        // Bloquer les raccourcis clavier
        document.addEventListener('keydown', (e) => {
            // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                (e.ctrlKey && e.key === 'u')) {
                e.preventDefault();
                this.handleSecurityThreat('DEV_SHORTCUT_BLOCKED', 'Raccourci développeur bloqué');
            }
        });
    }

    blockKeyboardShortcuts() {
        const blockedKeys = ['F12', 'F11', 'F10', 'F9', 'F8', 'F7', 'F6', 'F5'];
        
        document.addEventListener('keydown', (e) => {
            if (blockedKeys.includes(e.key)) {
                e.preventDefault();
                return false;
            }
            
            if (e.ctrlKey && (e.key === 's' || e.key === 'a')) {
                e.preventDefault();
                return false;
            }
        });
    }

    obfuscateSecurityCode() {
        // Créer des variables factices pour confondre les analyses
        const dummy1 = 'fake_admin_password_12345';
        const dummy2 = 'not_the_real_key_67890';
        const dummy3 = 'decoy_access_code_abcdef';
        
        // Fonction factice
        function fakeSecurityCheck() {
            return dummy1 + dummy2 + dummy3;
        }
    }

    // Génération d'empreinte du navigateur
    generateBrowserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);
        
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvas: canvas.toDataURL(),
            timestamp: Date.now()
        };
        
        return btoa(JSON.stringify(fingerprint));
    }

    // Surveillance de sécurité
    initializeSecurityMonitoring() {
        // Surveiller les tentatives de manipulation du DOM
        this.observeDOM();
        
        // Surveiller les activités suspectes
        this.monitorSuspiciousActivity();
        
        // Vérifier l'IP
        this.checkIPAddress();
    }

    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Détecter l'injection de scripts malveillants
                            if (node.tagName === 'SCRIPT' && !node.src.includes('tonios')) {
                                this.handleSecurityThreat('SCRIPT_INJECTION', 'Script malveillant détecté');
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    monitorSuspiciousActivity() {
        let keystrokes = 0;
        let mouseClicks = 0;
        
        document.addEventListener('keydown', () => {
            keystrokes++;
            if (keystrokes > 100) {
                this.handleSecurityThreat('EXCESSIVE_KEYSTROKES', 'Activité clavier suspecte');
            }
        });
        
        document.addEventListener('click', () => {
            mouseClicks++;
            if (mouseClicks > 200) {
                this.handleSecurityThreat('EXCESSIVE_CLICKS', 'Activité souris suspecte');
            }
        });
        
        // Reset des compteurs toutes les minutes
        setInterval(() => {
            keystrokes = 0;
            mouseClicks = 0;
        }, 60000);
    }

    checkIPAddress() {
        // Simulation de vérification IP
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                if (this.bannedIPs.has(data.ip)) {
                    this.handleSecurityThreat('BANNED_IP', 'IP bannie détectée');
                }
            })
            .catch(() => {
                // Ignorer les erreurs de réseau
            });
    }

    // Vérification de l'accès admin
    checkAdminAccess(password, username, additionalData = {}) {
        const fingerprint = this.generateBrowserFingerprint();
        const timestamp = Date.now();
        
        // Vérifier si l'utilisateur est banni
        if (this.isUserBanned(username)) {
            this.logSecurityEvent('BANNED_USER_ATTEMPT', username, { password, fingerprint });
            return { success: false, reason: 'BANNED_USER', message: 'Utilisateur banni du système' };
        }
        
        // Vérifier les tentatives échouées
        const failedCount = this.failedAttempts.get(username) || 0;
        if (failedCount >= 3) {
            this.banUser(username, 'Trop de tentatives échouées');
            return { success: false, reason: 'TOO_MANY_ATTEMPTS', message: 'Trop de tentatives - utilisateur banni' };
        }
        
        // Vérifier les codes d'accès admin
        const isValidAdminCode = this.adminAccessCodes.includes(password);
        
        if (isValidAdminCode) {
            // Accès admin accordé
            this.logSecurityEvent('ADMIN_ACCESS_GRANTED', username, { fingerprint, timestamp });
            this.clearFailedAttempts(username);
            
            return {
                success: true,
                accessLevel: 'ADMIN',
                message: 'Accès administrateur accordé',
                sessionToken: this.generateSecureToken(),
                fingerprint: fingerprint
            };
        } else {
            // Tentative échouée
            this.recordFailedAttempt(username);
            this.logSecurityEvent('ADMIN_ACCESS_DENIED', username, { password, fingerprint });
            
            return {
                success: false,
                reason: 'INVALID_CODE',
                message: 'Code d\'accès invalide'
            };
        }
    }

    // Gestion des utilisateurs bannis
    isUserBanned(username) {
        const bannedUsers = JSON.parse(localStorage.getItem('tonios_banned_users') || '[]');
        return bannedUsers.includes(username);
    }

    banUser(username, reason) {
        const bannedUsers = JSON.parse(localStorage.getItem('tonios_banned_users') || '[]');
        if (!bannedUsers.includes(username)) {
            bannedUsers.push(username);
            localStorage.setItem('tonios_banned_users', JSON.stringify(bannedUsers));
        }
        
        this.logSecurityEvent('USER_BANNED', username, { reason });
        
        // Bannir aussi l'IP si possible
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                this.bannedIPs.add(data.ip);
            })
            .catch(() => {});
    }

    recordFailedAttempt(username) {
        const current = this.failedAttempts.get(username) || 0;
        this.failedAttempts.set(username, current + 1);
    }

    clearFailedAttempts(username) {
        this.failedAttempts.delete(username);
    }

    // Gestion des menaces de sécurité
    handleSecurityThreat(type, description) {
        const threat = {
            type: type,
            description: description,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.logSecurityEvent('SECURITY_THREAT', 'SYSTEM', threat);
        
        // Actions automatiques selon le type de menace
        switch (type) {
            case 'DEV_TOOLS_DETECTED':
                this.triggerSecurityLockdown();
                break;
            case 'SCRIPT_INJECTION':
                this.blockAllScripts();
                break;
            case 'BANNED_IP':
                this.redirectToSecurityPage();
                break;
        }
    }

    triggerSecurityLockdown() {
        // Masquer le contenu sensible
        const adminElements = document.querySelectorAll('[data-admin-only]');
        adminElements.forEach(el => el.style.display = 'none');
        
        // Afficher un message de sécurité
        this.showSecurityWarning('Activité suspecte détectée - Système verrouillé');
    }

    blockAllScripts() {
        // Désactiver l'exécution de nouveaux scripts
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (!script.src.includes('admin-security') && !script.src.includes('tonios')) {
                script.remove();
            }
        });
    }

    redirectToSecurityPage() {
        window.location.href = 'about:blank';
    }

    showSecurityWarning(message) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #ff0000;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            z-index: 99999;
        `;
        warning.textContent = message;
        document.body.appendChild(warning);
    }

    // Génération de token sécurisé
    generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Journalisation des événements de sécurité
    logSecurityEvent(type, user, data) {
        const event = {
            id: this.generateSecureToken().substring(0, 8),
            type: type,
            user: user,
            timestamp: new Date().toISOString(),
            data: data,
            fingerprint: this.generateBrowserFingerprint()
        };
        
        this.securityLogs.push(event);
        
        // Sauvegarder dans le localStorage
        const existingLogs = JSON.parse(localStorage.getItem('tonios_security_logs') || '[]');
        existingLogs.push(event);
        
        // Garder seulement les 1000 derniers logs
        if (existingLogs.length > 1000) {
            existingLogs.splice(0, existingLogs.length - 1000);
        }
        
        localStorage.setItem('tonios_security_logs', JSON.stringify(existingLogs));
        
        // Envoyer en temps réel si dashboard admin ouvert
        if (window.adminDashboard && window.adminDashboard.isOpen) {
            window.adminDashboard.updateSecurityLogs(event);
        }
    }

    // Récupération des logs de sécurité
    getSecurityLogs() {
        return JSON.parse(localStorage.getItem('tonios_security_logs') || '[]');
    }

    // Nettoyage des logs
    clearSecurityLogs() {
        localStorage.removeItem('tonios_security_logs');
        this.securityLogs = [];
    }

    // Fonction pour ouvrir le dashboard admin
    openAdminDashboard() {
        if (!this.isAdminMode) {
            return false;
        }
        
        const dashboardWindow = window.open('admin_dashboard_secure.html', 'AdminDashboard', 
            'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes');
        
        if (dashboardWindow) {
            dashboardWindow.focus();
            this.logSecurityEvent('ADMIN_DASHBOARD_OPENED', 'ADMIN', { timestamp: Date.now() });
            return true;
        }
        
        return false;
    }

    // Vérification périodique de la sécurité
    startSecurityCheck() {
        setInterval(() => {
            this.performSecurityAudit();
        }, 30000); // Toutes les 30 secondes
    }

    performSecurityAudit() {
        // Vérifier l'intégrité du système
        const criticalElements = document.querySelectorAll('[data-security-critical]');
        
        criticalElements.forEach(element => {
            if (!element || element.style.display === 'none') {
                this.handleSecurityThreat('SYSTEM_INTEGRITY_BREACH', 'Élément critique manquant');
            }
        });
    }
}

// Initialisation du système de sécurité
const adminSecurity = new AdminSecuritySystem();

// Export des fonctions pour l'utilisation externe
window.adminSecurity = adminSecurity;
window.checkAdminAccess = (password, username, data) => adminSecurity.checkAdminAccess(password, username, data);
window.openAdminDashboard = () => adminSecurity.openAdminDashboard();

// Démarrage de la surveillance
adminSecurity.startSecurityCheck();

console.log('🛡️ Système de sécurité admin ultra-sécurisé initialisé');
