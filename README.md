# ToniOS v2 - Système d'Exploitation Virtuel Web - Version Fichier Unique

**🎯 Version consolidée en un seul fichier HTML pour facilité d'utilisation !**

## 🚀 Fonctionnalités

### Applications intégrées :
- **📁 Gestionnaire de fichiers** : Gestion complète des fichiers utilisateur avec interface drag & drop
- **💬 ToniOS Chat** : Système de chat multi-canaux avec support vocal et textuel
- **👥 Gestionnaire de sessions** : Visualisation et interaction avec les sessions d'autres utilisateurs

### Fonctionnalités avancées :
- **🔐 Authentification individuelle** : Chaque utilisateur a sa propre session isolée
- **🎨 Interface personnalisable** : Bureau avec fond d'écran et positionnement des icônes
- **🔧 Panneau d'administration** : Accès sécurisé pour les administrateurs uniquement (spécialement pour toinou181)
- **📱 Interface responsive** : Compatible avec tous types d'écrans

## 📄 Version Fichier Unique

**ToniOS est maintenant disponible en version fichier unique !**

### Structure actuelle :
```
ToniOS/
├── index.html                    # ⭐ FICHIER UNIQUE COMPLET - Tout inclus !
│                                 # Contient HTML + CSS + JavaScript intégrés
├── index-original.html           # Sauvegarde de l'ancien index.html
├── styles.css                   # CSS de référence (inclus dans index.html)
├── js/                          # Scripts de référence (inclus dans index.html)
│   ├── auth.js                  # Système d'authentification
│   ├── main.js                  # Fonctions principales et menu utilisateur
│   ├── chat.js                  # Chat multi-canaux avec sessions individuelles
│   ├── files.js                 # Gestionnaire de fichiers
│   ├── session-manager.js       # Gestionnaire de sessions utilisateurs
│   ├── admin-security.js        # Système de sécurité admin
│   ├── windows.js               # Gestion des fenêtres
│   ├── voice.js                 # Chat vocal
│   └── notifications.js         # Système de notifications
├── docs/                        # Documentation
├── tests/                       # Fichiers de test
└── backups/                     # Sauvegardes des anciennes versions
```

## ✨ Avantages de la Version Fichier Unique

### 🎯 Simplicité :
- **Un seul fichier** : `index.html` contient tout le système
- **Déploiement facile** : Copiez simplement le fichier index.html
- **Aucune dépendance** : Tous les CSS et JavaScript sont intégrés

### 🚀 Performance :
- **Chargement rapide** : Aucune requête externe pour CSS/JS
- **Fonctionnement offline** : Fonctionne sans serveur pour les fonctionnalités de base
- **Cache optimal** : Un seul fichier à mettre en cache

### 🔧 Maintenance :
- **Code source préservé** : Les fichiers originaux restent disponibles dans `js/` et `styles.css`
- **Version de référence** : `index-original.html` contient l'ancienne version modulaire

## 🔧 Installation et utilisation

**Option 1 - Ouverture directe** :
   Ouvrez simplement `index.html` dans votre navigateur !

**Option 2 - Serveur local** :
1. **Démarrer le serveur local** :
   ```bash
   python3 -m http.server 8000
   ```

2. **Accéder à ToniOS** :
   Ouvrir `http://localhost:8000` dans votre navigateur

3. **Créer un compte** :
   - Premier utilisateur = automatiquement administrateur
   - Chaque utilisateur a sa propre session isolée

## 👤 Accès administrateur

1. **Connexion normale** : Connectez-vous avec votre compte utilisateur
2. **Menu utilisateur** : Cliquez sur votre nom dans la barre des tâches
3. **Dashboard admin** : Le bouton n'apparaît que pour les administrateurs
4. **Accès sécurisé** : Utilisation de codes d'accès et empreinte navigateur

## 📱 Fonctionnalités par utilisateur

### Sessions individuelles :
- **Chat personnel** : Chaque utilisateur a ses propres canaux et messages
- **Fichiers privés** : Système de fichiers isolé par utilisateur
- **Préférences** : Configuration personnalisée du bureau
- **Historique** : Historique des actions et statistiques personnelles

### Chat amélioré :
- **Canaux texte** : `#général`, `#tech`, `#random`
- **Canaux vocaux** : Support reconnaissance vocale
- **Commandes** : `/help`, `/clear`, `/me`, etc.
- **Modération** : Fonctions admin pour gérer les utilisateurs

## 🛠️ Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **APIs** : Web Speech API, File API, WebRTC
- **Stockage** : LocalStorage avec isolation par utilisateur
- **Sécurité** : Système d'empreinte navigateur, chiffrement

## 🔄 Améliorations v2

- ✅ **Organisation des fichiers** : Structure modulaire claire
- ✅ **Sessions individuelles** : Isolation complète des données utilisateur
- ✅ **Chat amélioré** : Messages et canaux personnalisés par utilisateur
- ✅ **Accès admin** : Contrôle d'accès sécurisé au dashboard
- ✅ **Interface utilisateur** : Menu utilisateur avec profil et préférences
- ✅ **Nettoyage du code** : Suppression des doublons et fichiers obsolètes

## 📄 Licence

Projet open source - Utilisation libre pour des fins éducatives et personnelles.