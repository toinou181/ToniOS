# ToniOS - Système d'Exploitation Virtuel Web

## 📋 Description

ToniOS est un système d'exploitation virtuel développé en HTML, CSS et JavaScript, offrant une expérience bureau complète dans le navigateur web.

## 🏗️ Architecture Modulaire

Le projet a été refactorisé pour une architecture modulaire claire :

### Structure des fichiers :
```
ToniOS/
├── index_clean.html          # Interface utilisateur principale (HTML pur)
├── styles.css               # Tous les styles CSS
├── js/                      # Modules JavaScript
│   ├── auth.js             # Système d'authentification
│   ├── notifications.js    # Système de notifications
│   ├── windows.js          # Gestion des fenêtres
│   ├── chat.js            # Chat textuel
│   ├── voice.js           # Chat vocal
│   ├── files.js           # Gestionnaire de fichiers
│   └── main.js            # Initialisation et fonctions principales
└── README.md              # Documentation
```

### 📁 Description des modules :

#### **auth.js** - Authentification
- Gestion des sessions utilisateur (`UserSession`)
- Système de connexion/déconnexion
- Gestion des rôles (user, moderator, admin)
- Permissions et modération
- Stockage local des utilisateurs

#### **notifications.js** - Notifications
- Système de notifications visuelles
- Support des sons de notification
- Types : info, success, error, warning
- Animations et auto-masquage

#### **windows.js** - Gestion des fenêtres
- Ouverture/fermeture des applications
- Système de drag & drop des fenêtres
- Maximisation/minimisation
- Gestion du Z-index
- Barre des tâches dynamique

#### **chat.js** - Chat textuel
- Canaux de discussion multiples
- Messages en temps réel (simulation)
- Commandes de modération
- Interface utilisateur intuitive
- Gestion des utilisateurs en ligne

#### **voice.js** - Chat vocal
- Reconnaissance vocale (Web Speech API)
- Synthèse vocale (Text-to-Speech)
- Visualisation audio en temps réel
- Contrôles d'enregistrement
- Transcription automatique

#### **files.js** - Gestionnaire de fichiers
- CRUD complet des fichiers
- Import/Export de fichiers
- Drag & drop depuis l'OS
- Visualiseurs intégrés (texte, images)
- Menu contextuel avancé

#### **main.js** - Système principal
- Initialisation de ToniOS
- Raccourcis clavier globaux
- Horloge en temps réel
- Fonctions utilitaires
- Menu démarrer

## 🚀 Fonctionnalités

### Applications intégrées :
- 🧮 **Calculatrice** - Calculs de base avec interface moderne
- 📝 **Bloc-notes** - Éditeur de texte avec sauvegarde
- 📁 **Gestionnaire de fichiers** - Navigation et gestion complète
- 🎨 **Personnalisation** - Changement de fond d'écran
- 💬 **Chat** - Communication textuelle et vocale
- 🖥️ **Propriétés système** - Informations du système

### Fonctionnalités avancées :
- ✅ Système d'authentification avec rôles
- ✅ Glisser-déposer des fenêtres
- ✅ Menu contextuel du bureau
- ✅ Sélection multiple d'icônes
- ✅ Import de fichiers par drag & drop
- ✅ Chat vocal avec reconnaissance
- ✅ Notifications système
- ✅ Raccourcis clavier
- ✅ Modération utilisateurs
- ✅ Sauvegarde automatique

## 🔧 Installation et utilisation

1. **Cloner ou télécharger** le projet
2. **Ouvrir** `index_clean.html` dans un navigateur moderne
3. **Se connecter** avec un nom d'utilisateur ou utiliser la session démo
4. **Explorer** les applications et fonctionnalités

## 📱 Compatibilité

- ✅ Chrome / Chromium (recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ Fonctionnalités vocales nécessitent HTTPS en production

## 🎯 Technologies utilisées

- **HTML5** - Structure sémantique
- **CSS3** - Styles modernes avec variables CSS
- **JavaScript ES6+** - Logique modulaire
- **Web Speech API** - Reconnaissance et synthèse vocale
- **LocalStorage** - Persistance des données
- **FileReader API** - Gestion des fichiers

## 🔄 Améliorations apportées

### Avant (version monolithique) :
- ❌ 4537 lignes dans un seul fichier
- ❌ Code difficile à maintenir
- ❌ Pas de séparation des responsabilités
- ❌ Difficile à déboguer

### Après (version modulaire) :
- ✅ Code séparé en 8 fichiers logiques
- ✅ Architecture claire et maintenable
- ✅ Responsabilités bien définies
- ✅ Facilite le débogage et les tests
- ✅ Réutilisabilité des modules
- ✅ Chargement optimisé

## 🛠️ Développement

### Pour contribuer :
1. Modifier les modules dans `/js/`
2. Tester avec `index_clean.html`
3. S'assurer de la compatibilité entre modules
4. Documenter les changements

### Variables globales partagées :
- `currentSession` - Session utilisateur actuelle
- `openWindows` - Fenêtres ouvertes
- `nextZIndex` - Gestion de l'ordre des fenêtres
- `allUsers` - Base de données utilisateurs locale

## 📄 Licence

Projet éducatif et démonstratif.

---

**ToniOS v2.0** - Architecture modulaire | Développé avec ❤️
