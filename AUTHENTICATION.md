# 🔐 Système d'Authentification ToniOS v2.0

## 📋 Nouvelles Fonctionnalités

### ✅ Enregistrement d'Utilisateurs
- **Création de comptes** : Les utilisateurs peuvent créer leur propre compte
- **Validation** : Vérification de la complexité des mots de passe et unicité des noms
- **Hashage** : Les mots de passe sont automatiquement hashés pour la sécurité

### ✅ Sessions Persistantes
- **Se souvenir de moi** : Option pour maintenir la session même après fermeture du navigateur
- **Reconnexion automatique** : Détection et proposition de reconnexion automatique
- **Tokens de session** : Chaque session a un token unique pour la sécurité

### ✅ Bureaux Personnalisés
- **Positionnement des icônes** : Chaque utilisateur peut organiser son bureau
- **Sauvegarde automatique** : Les positions sont sauvegardées automatiquement
- **Fonds d'écran** : Possibilité de personnaliser le fond d'écran par utilisateur
- **Préférences** : Chaque utilisateur a ses propres préférences système

## 🔧 Utilisation

### Création d'un Nouveau Compte
1. Sur l'écran de connexion, cliquer sur **"Pas encore de compte ? S'inscrire"**
2. Remplir le formulaire :
   - Nom d'utilisateur (3-20 caractères, lettres/chiffres/tirets uniquement)
   - Mot de passe (minimum 4 caractères)
   - Confirmation du mot de passe
   - Cocher "Se souvenir de moi" si désiré
3. Cliquer sur **"S'inscrire"**

### Connexion
1. Entrer nom d'utilisateur et mot de passe
2. Cocher "Se souvenir de moi" pour une session persistante
3. Cliquer sur **"Se connecter"**

### Sessions Automatiques
- Si une session persistante existe, une boîte de dialogue apparaît au démarrage
- Choix entre reconnexion automatique ou changement d'utilisateur
- Les sessions temporaires expirent à la fermeture du navigateur

### Personnalisation du Bureau
- **Déplacer les icônes** : Glisser-déposer pour réorganiser
- **Position sauvegardée** : Les positions sont automatiquement sauvegardées
- **Restauration** : À la reconnexion, le bureau est restauré à l'état précédent

## 🛡️ Sécurité

### Hashage des Mots de Passe
```javascript
hashPassword(password) {
    // Simple hash pour démo - utiliser bcrypt en production
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}
```

### Tokens de Session
- Chaque session génère un token unique
- Format : `session_{timestamp}_{random}`
- Validation du token à chaque reconnexion

### Stockage Sécurisé
- Utilisation de `localStorage` pour la persistance
- `sessionStorage` pour les sessions temporaires
- Nettoyage automatique des sessions expirées

## 📊 Structure des Données

### Utilisateur
```javascript
{
    username: "string",
    password: "hashed_string",
    role: "user|moderator|admin",
    avatar: { color: "#hex", letter: "A" },
    createdAt: "ISO_date",
    lastLogin: "ISO_date",
    loginCount: number,
    preferences: {
        wallpaper: "string",
        theme: "string",
        notifications: boolean,
        soundEnabled: boolean,
        rememberSession: boolean
    },
    desktop: {
        icons: [
            { id: "app_id", x: number, y: number, visible: boolean }
        ],
        wallpaper: "string"
    },
    sessionToken: "string"
}
```

### Session Sauvegardée
```javascript
{
    username: "string",
    token: "session_token",
    timestamp: number
}
```

## 🔄 API Fonctions

### Enregistrement
```javascript
registerUser(username, password, rememberSession)
// Crée un nouvel utilisateur et retourne l'instance UserSession
```

### Connexion
```javascript
loginUser(username, password, rememberSession)
// Connecte l'utilisateur et retourne l'instance UserSession
```

### Déconnexion
```javascript
logoutUser()
// Déconnecte l'utilisateur et nettoie les sessions
```

### Persistance
```javascript
saveUsersToStorage()           // Sauvegarde tous les utilisateurs
loadUsersFromStorage()         // Charge tous les utilisateurs
saveCurrentSession(remember)   // Sauvegarde la session actuelle
loadSavedSession()            // Charge une session sauvegardée
clearSavedSession()           // Supprime les sessions sauvegardées
```

### Bureau
```javascript
saveDesktopLayout()    // Sauvegarde la disposition du bureau
loadDesktopLayout()    // Charge la disposition du bureau
```

## 🎯 Améliorations Futures

### Court Terme
- [ ] Récupération de mot de passe
- [ ] Gestion des avatars personnalisés
- [ ] Thèmes personnalisables par utilisateur
- [ ] Statistiques d'utilisation détaillées

### Long Terme
- [ ] Synchronisation cloud
- [ ] Authentification à deux facteurs
- [ ] Groupes d'utilisateurs
- [ ] Permissions granulaires
- [ ] Audit des connexions

## 🐛 Débogage

### Vérifier l'État des Utilisateurs
```javascript
console.log('Utilisateurs:', allUsers);
console.log('Session actuelle:', currentSession);
```

### Nettoyer le Stockage
```javascript
localStorage.removeItem('tonios_users');
localStorage.removeItem('tonios_current_session');
sessionStorage.removeItem('tonios_current_session');
```

### Réinitialiser un Utilisateur
```javascript
delete allUsers['nom_utilisateur'];
saveUsersToStorage();
```

---

**ToniOS Authentification v2.0** - Sessions persistantes et bureaux personnalisés
