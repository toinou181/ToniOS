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

    validateBrowserFingerprint(fingerprint) {
        // Créer une empreinte unique basée sur le navigateur
        const expectedFingerprint = this.generateBrowserFingerprint();
        return fingerprint === expectedFingerprint;
    }

    generateBrowserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('ToniOS Security Check', 2, 2);
        
        return btoa(
            navigator.userAgent +
            navigator.language +
            screen.width + 'x' + screen.height +
            new Date().getTimezoneOffset() +
            canvas.toDataURL()
        ).substring(0, 32);
    }

    detectSuspiciousPatterns(username) {
        const suspiciousPatterns = [
            /admin/i, /root/i, /test/i, /hack/i, /exploit/i,
            /script/i, /bot/i, /crawler/i, /spider/i
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(username));
    }

    validateGeolocation() {
        // Simulation d'une vérification géographique
        // En production, ceci utiliserait une vraie API de géolocalisation
        return true; // Pour la démo
    }

    banUser(userKey, reason) {
        this.bannedUsers.add(userKey);
        this.logSecurityEvent('USER_BANNED', { userKey, reason });
        
        // Bannissement temporaire (24h)
        setTimeout(() => {
            this.bannedUsers.delete(userKey);
            this.logSecurityEvent('BAN_EXPIRED', { userKey });
        }, this.banDuration);
    }

    handleSecurityThreat(threatType) {
        this.logSecurityEvent('SECURITY_THREAT', { type: threatType });
        
        // Actions automatiques selon le type de menace
        switch (threatType) {
            case 'DEV_TOOLS_DETECTED':
                this.showSecurityWarning('Outils de développement détectés');
                break;
            case 'FORBIDDEN_KEYS':
                this.showSecurityWarning('Combinaison de touches interdite');
                break;
            case 'SECURITY_CHECK_FAILED':
                this.lockdown();
                break;
        }
    }

    showSecurityWarning(message) {
        if (document.getElementById('securityWarning')) return;
        
        const warning = document.createElement('div');
        warning.id = 'securityWarning';
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 0, 0, 0.9);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            z-index: 99999;
            text-align: center;
        `;
        warning.innerHTML = `
            <div>
                <h1>⚠️ ALERTE SÉCURITÉ ⚠️</h1>
                <p>${message}</p>
                <p>Accès refusé pour des raisons de sécurité</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="padding: 10px 20px; font-size: 16px; margin-top: 20px;">
                    Fermer
                </button>
            </div>
        `;
        document.body.appendChild(warning);
    }

    lockdown() {
        // Verrouillage complet du système
        document.body.innerHTML = `
            <div style="background: #000; color: #ff0000; height: 100vh; display: flex; 
                        align-items: center; justify-content: center; text-align: center;">
                <div>
                    <h1>🔒 SYSTÈME VERROUILLÉ 🔒</h1>
                    <p>Activité suspecte détectée</p>
                    <p>Accès interdit</p>
                </div>
            </div>
        `;
    }

    clearFailedAttempts(userKey) {
        this.failedAttempts.delete(userKey);
    }

    logSecurityEvent(event, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.securityLogs.push(logEntry);
        console.log(`🔒 SECURITY LOG: ${event}`, data);
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('tonios_security_logs', JSON.stringify(this.securityLogs));
    }

    startSecurityMonitoring() {
        // Surveillance continue
        setInterval(() => {
            this.monitorSuspiciousActivity();
        }, 5000);
    }

    monitorSuspiciousActivity() {
        // Vérifier les tentatives d'accès rapides
        const now = Date.now();
        const recentLogs = this.securityLogs.filter(log => 
            now - new Date(log.timestamp).getTime() < 60000 // Dernière minute
        );
        
        if (recentLogs.length > 10) {
            this.handleSecurityThreat('RAPID_ACCESS_ATTEMPTS');
        }
    }

    getSecurityLogs() {
        return this.securityLogs.slice(-100); // Derniers 100 logs
    }

    getBannedUsers() {
        return Array.from(this.bannedUsers);
    }

    // Interface pour le dashboard admin
    openAdminDashboard() {
        // Permettre l'accès pour le propriétaire du GitHub (toinou181) sans mot de passe
        const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const isOwner = currentUser === 'toinou181' || currentUser === '@toinou181';
        
        if (!this.isAdminMode && !isOwner) {
            this.showSecurityWarning('Accès non autorisé au dashboard admin');
            return false;
        }

        // Ouvrir le dashboard admin dans une nouvelle fenêtre sécurisée
        window.open('/admin_dashboard.html', '_blank', 
            'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
        return true;
    }
}

// Instance globale du système de sécurité
window.adminSecurity = new AdminSecuritySystem();

// Exposition des fonctions nécessaires
window.checkAdminAccess = (password, username) => {
    const fingerprint = adminSecurity.generateBrowserFingerprint();
    return adminSecurity.checkAdminAccess(password, username, fingerprint);
};

window.openAdminDashboard = () => {
    return adminSecurity.openAdminDashboard();
};
