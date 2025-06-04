# ToniOS - Système d'exploitation virtuel

ToniOS est un système d'exploitation virtuel développé en C# WinForms qui simule l'expérience d'un OS moderne avec une interface graphique complète.

## 🚀 Fonctionnalités

### Bureau interactif
- 🖥️ Bureau avec fond d'écran en dégradé
- 📍 Barre des tâches avec bouton Démarrer et horloge en temps réel
- 🖱️ Menu contextuel du bureau
- 🔄 Écran de démarrage avec animation

### Applications incluses
- 📁 **Explorateur de fichiers** : Navigation dans le système de fichiers avec vue arborescente et liste détaillée
- 🔢 **Calculatrice** : Calculatrice complète avec support clavier et opérations mathématiques
- 📝 **Bloc-notes** : Éditeur de texte avec menu complet (ouvrir, enregistrer, police, zoom)
- ⚙️ **Gestionnaire de tâches** : Affichage et gestion des processus système en temps réel
- 🛠️ **Propriétés système** : Informations détaillées sur le système et le matériel

### Fonctionnalités système
- 🔄 Redémarrage et arrêt du système
- 📋 Menu Démarrer avec accès rapide aux applications
- ⏰ Horloge système en temps réel
- 🎨 Interface moderne avec thème sombre

## 🛠️ Technologies utilisées

- **C# .NET 8.0** - Langage de programmation principal
- **Windows Forms** - Framework d'interface utilisateur
- **System.Drawing** - Pour les graphiques et les dégradés
- **System.Diagnostics** - Pour la gestion des processus
- **System.IO** - Pour la navigation dans les fichiers

## 📋 Prérequis

- .NET 8.0 SDK ou plus récent
- Windows (requis pour WinForms)
- Visual Studio ou VS Code (optionnel mais recommandé)

## 🚀 Installation et exécution

1. **Cloner le projet** :
   ```bash
   git clone [URL_DU_REPO]
   cd ToniOS
   ```

2. **Compiler le projet** :
   ```bash
   cd ToniOS
   dotnet build
   ```

3. **Lancer ToniOS** :
   ```bash
   dotnet run
   ```

## 🎮 Utilisation

### Démarrage
1. Lancez l'application pour voir l'écran de démarrage ToniOS
2. Le bureau apparaît avec les icônes d'applications sur la gauche
3. La barre des tâches est située en bas avec le bouton Démarrer et l'horloge

### Applications

#### 📁 Explorateur de fichiers
- Cliquez sur l'icône "📁 Explorateur" ou utilisez le menu Démarrer
- Naviguez dans l'arborescence des dossiers à gauche
- Les fichiers et dossiers s'affichent dans la liste à droite
- Double-cliquez pour ouvrir un dossier ou un fichier

#### 🔢 Calculatrice
- Interface similaire à la calculatrice Windows
- Support des opérations de base (+, -, ×, ÷)
- Fonctions avancées (%, ±)
- Support complet du clavier numérique

#### 📝 Bloc-notes
- Éditeur de texte complet avec menu
- Ouvrir/Enregistrer des fichiers
- Fonctions d'édition (couper, copier, coller)
- Personnalisation de la police et zoom

#### ⚙️ Gestionnaire de tâches
- Liste tous les processus en cours d'exécution
- Informations détaillées (PID, mémoire, statut)
- Possibilité de terminer des processus
- Actualisation automatique toutes les 5 secondes

### Navigation
- **Menu Démarrer** : Clic sur le bouton "🏠 Démarrer"
- **Menu contextuel** : Clic droit sur le bureau
- **Fermeture d'applications** : Bouton X ou Alt+F4
- **Arrêt système** : Menu Démarrer → Éteindre

## 🏗️ Architecture du projet

```
ToniOS/
├── Desktop.cs           # Formulaire principal du bureau
├── Calculator.cs        # Application calculatrice
├── FileExplorer.cs      # Explorateur de fichiers
├── Notepad.cs          # Éditeur de texte
├── TaskManager.cs       # Gestionnaire de tâches
├── SystemProperties.cs  # Propriétés système
├── Program.cs          # Point d'entrée de l'application
└── ToniOS.csproj       # Configuration du projet
```

## 🎨 Personnalisation

Le système peut être personnalisé en modifiant :

- **Couleurs du thème** : Dans `Desktop.cs`, modifiez les couleurs des éléments UI
- **Applications** : Ajoutez de nouvelles applications en créant de nouveaux formulaires
- **Icônes du bureau** : Modifiez la méthode `CreateDesktopIcons()` dans `Desktop.cs`
- **Menu Démarrer** : Personnalisez `StartButton_Click()` pour ajouter de nouveaux éléments

## 🔧 Développement

### Ajouter une nouvelle application

1. Créez un nouveau formulaire héritant de `Form`
2. Implémentez l'interface de votre application
3. Ajoutez un raccourci dans `Desktop.cs` :
   ```csharp
   CreateDesktopIcon("🎯\nMon App", new Point(x, y), () => OpenMyApp());
   ```
4. Implémentez la méthode d'ouverture :
   ```csharp
   private void OpenMyApp()
   {
       var myApp = new MyApplication();
       ShowWindow(myApp);
   }
   ```

### Fonctionnalités avancées possibles

- 🌐 Navigateur web intégré
- 🎵 Lecteur multimédia
- 🎮 Jeux simples
- 📧 Client email
- 🖼️ Visionneuse d'images
- 📊 Moniteur de performance en temps réel

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème, n'hésitez pas à ouvrir une issue sur GitHub.

---

**ToniOS v1.0** - Développé avec ❤️ en C# .NET
