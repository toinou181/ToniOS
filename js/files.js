// ===============================================
// SYSTÈME DE GESTION DES FICHIERS
// ===============================================

// Variables globales pour les fichiers
let userFiles = [];
let selectedFiles = [];

// Création de nouveaux fichiers
function createNewFile(type = 'text') {
    const fileName = prompt('Nom du nouveau fichier :');
    if (!fileName || !fileName.trim()) {
        showNotification('Nom de fichier requis', 'error');
        return;
    }

    const cleanFileName = fileName.trim();
    
    // Vérifier si le fichier existe déjà
    if (userFiles.find(f => f.name === cleanFileName)) {
        showNotification('Un fichier avec ce nom existe déjà', 'error');
        return;
    }

    const newFile = {
        id: Date.now() + Math.random(),
        name: cleanFileName,
        type: type,
        content: type === 'text' ? '' : null,
        size: 0,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        author: getCurrentUser()
    };

    userFiles.push(newFile);
    saveUserData();
    refreshFileList();
    
    showNotification(`Fichier "${cleanFileName}" créé avec succès ! 📄`, 'success');
    
    // Ouvrir automatiquement le fichier pour édition
    if (type === 'text') {
        openApplication('notepad', cleanFileName);
    }
}

function refreshFileList() {
    const filesList = document.getElementById('filesList');
    if (!filesList) return;

    filesList.innerHTML = '';

    if (userFiles.length === 0) {
        filesList.innerHTML = `
            <div class="tonios-empty-files">
                <div class="tonios-empty-icon">📁</div>
                <div class="tonios-empty-text">Aucun fichier</div>
                <div class="tonios-empty-subtitle">Créez votre premier fichier ou glissez-déposez des fichiers ici</div>
                <button onclick="createNewFile('text')" class="tonios-btn">📝 Créer un fichier</button>
            </div>
        `;
        return;
    }

    // Trier les fichiers par date de modification (plus récent en premier)
    const sortedFiles = [...userFiles].sort((a, b) => 
        new Date(b.lastModified) - new Date(a.lastModified)
    );

    sortedFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'tonios-file-item';
        fileItem.setAttribute('data-file-id', file.id);
        fileItem.onclick = () => selectFile(file.id);
        fileItem.ondblclick = () => openFile(file);

        const fileIcon = getFileIcon(file.type);
        const fileSize = formatFileSize(file.size);
        const lastModified = new Date(file.lastModified).toLocaleDateString('fr-FR');

        fileItem.innerHTML = `
            <div class="tonios-file-icon">${fileIcon}</div>
            <div class="tonios-file-info">
                <div class="tonios-file-name">${file.name}</div>
                <div class="tonios-file-details">
                    <span class="tonios-file-size">${fileSize}</span>
                    <span class="tonios-file-date">${lastModified}</span>
                    <span class="tonios-file-author">par ${file.author || 'Inconnu'}</span>
                </div>
            </div>
            <div class="tonios-file-actions">
                <button onclick="event.stopPropagation(); openFile({id: ${file.id}, name: '${file.name}', type: '${file.type}'})" class="tonios-btn-small">📖 Ouvrir</button>
                <button onclick="event.stopPropagation(); renameFile(${file.id})" class="tonios-btn-small">✏️ Renommer</button>
                <button onclick="event.stopPropagation(); deleteFile(${file.id})" class="tonios-btn-small danger">🗑️ Supprimer</button>
            </div>
        `;

        filesList.appendChild(fileItem);
    });

    // Mettre à jour le compteur
    updateFileCount();
}

function getFileIcon(type) {
    const icons = {
        text: '📝',
        image: '🖼️',
        audio: '🎵',
        video: '🎬',
        pdf: '📕',
        archive: '📦',
        code: '💻',
        document: '📄'
    };
    return icons[type] || '📄';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function selectFile(fileId) {
    const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
    if (!fileItem) return;

    // Toggle sélection
    if (selectedFiles.includes(fileId)) {
        selectedFiles = selectedFiles.filter(id => id !== fileId);
        fileItem.classList.remove('selected');
    } else {
        selectedFiles.push(fileId);
        fileItem.classList.add('selected');
    }

    updateFileSelection();
}

function updateFileSelection() {
    const selectionInfo = document.querySelector('.tonios-file-selection-info');
    if (selectionInfo) {
        selectionInfo.remove();
    }

    if (selectedFiles.length > 0) {
        const filesList = document.getElementById('filesList');
        const info = document.createElement('div');
        info.className = 'tonios-file-selection-info';
        info.innerHTML = `
            <div class="tonios-selection-text">${selectedFiles.length} fichier(s) sélectionné(s)</div>
            <div class="tonios-selection-actions">
                <button onclick="deleteSelectedFiles()" class="tonios-btn-small danger">🗑️ Supprimer</button>
                <button onclick="clearFileSelection()" class="tonios-btn-small">❌ Désélectionner</button>
            </div>
        `;
        filesList.parentElement.insertBefore(info, filesList);
    }
}

function clearFileSelection() {
    selectedFiles = [];
    document.querySelectorAll('.tonios-file-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    updateFileSelection();
}

function deleteSelectedFiles() {
    if (selectedFiles.length === 0) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedFiles.length} fichier(s) ?`;
    if (!confirm(confirmMessage)) return;

    selectedFiles.forEach(fileId => {
        userFiles = userFiles.filter(f => f.id !== fileId);
    });

    showNotification(`${selectedFiles.length} fichier(s) supprimé(s)`, 'info');
    
    selectedFiles = [];
    saveUserData();
    refreshFileList();
}

function openFile(file) {
    const foundFile = userFiles.find(f => f.id === file.id);
    if (!foundFile) {
        showNotification('Fichier introuvable', 'error');
        return;
    }

    switch (foundFile.type) {
        case 'text':
            openApplication('notepad', foundFile.name);
            break;
        case 'image':
            openImageViewer(foundFile);
            break;
        case 'audio':
            playAudioFile(foundFile);
            break;
        default:
            showNotification(`Type de fichier "${foundFile.type}" non supporté pour l'ouverture`, 'warning');
    }
}

function renameFile(fileId) {
    const file = userFiles.find(f => f.id === fileId);
    if (!file) return;

    const newName = prompt('Nouveau nom :', file.name);
    if (!newName || newName.trim() === '' || newName === file.name) return;

    const cleanNewName = newName.trim();
    
    // Vérifier si le nouveau nom existe déjà
    if (userFiles.find(f => f.name === cleanNewName && f.id !== fileId)) {
        showNotification('Un fichier avec ce nom existe déjà', 'error');
        return;
    }

    const oldName = file.name;
    file.name = cleanNewName;
    file.lastModified = new Date().toISOString();

    saveUserData();
    refreshFileList();
    showNotification(`Fichier renommé de "${oldName}" vers "${cleanNewName}"`, 'success');
}

function deleteFile(fileId) {
    const file = userFiles.find(f => f.id === fileId);
    if (!file) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${file.name}" ?`)) return;

    userFiles = userFiles.filter(f => f.id !== fileId);
    saveUserData();
    refreshFileList();
    showNotification(`Fichier "${file.name}" supprimé`, 'info');
}

function updateFileCount() {
    const fileCountElement = document.getElementById('fileCount');
    if (fileCountElement) {
        const totalSize = userFiles.reduce((sum, file) => sum + (file.size || 0), 0);
        fileCountElement.textContent = `${userFiles.length} fichier(s) • ${formatFileSize(totalSize)}`;
    }
}

// Sauvegarde et chargement des fichiers
function saveNotepadFile(fileName = '') {
    const content = document.getElementById('notepadContent');
    if (!content) {
        showNotification('Éditeur non trouvé', 'error');
        return;
    }

    const fileContent = content.value;
    
    if (!fileName) {
        fileName = prompt('Nom du fichier :');
        if (!fileName || !fileName.trim()) {
            showNotification('Nom de fichier requis', 'error');
            return;
        }
        fileName = fileName.trim();
    }

    // Chercher le fichier existant ou en créer un nouveau
    let file = userFiles.find(f => f.name === fileName);
    
    if (file) {
        // Modifier le fichier existant
        file.content = fileContent;
        file.size = new Blob([fileContent]).size;
        file.lastModified = new Date().toISOString();
        showNotification(`Fichier "${fileName}" sauvegardé ! 💾`, 'success');
    } else {
        // Créer un nouveau fichier
        file = {
            id: Date.now() + Math.random(),
            name: fileName,
            type: 'text',
            content: fileContent,
            size: new Blob([fileContent]).size,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            author: getCurrentUser()
        };
        userFiles.push(file);
        showNotification(`Nouveau fichier "${fileName}" créé et sauvegardé ! 📄`, 'success');
    }

    saveUserData();
    refreshFileList();
    
    // Mettre à jour le titre de la fenêtre
    const notepadWindow = content.closest('.tonios-window');
    if (notepadWindow) {
        const title = notepadWindow.querySelector('.tonios-window-title');
        if (title) {
            title.innerHTML = `<span class="tonios-window-icon">📝</span>Bloc-notes - ${fileName}`;
        }
    }
}

function saveAsNotepadFile() {
    const fileName = prompt('Enregistrer sous (nouveau nom) :');
    if (fileName && fileName.trim()) {
        saveNotepadFile(fileName.trim());
    }
}

function clearNotepad() {
    const content = document.getElementById('notepadContent');
    if (content) {
        if (content.value && !confirm('Êtes-vous sûr de vouloir effacer le contenu actuel ?')) {
            return;
        }
        content.value = '';
        
        // Réinitialiser le titre
        const notepadWindow = content.closest('.tonios-window');
        if (notepadWindow) {
            const title = notepadWindow.querySelector('.tonios-window-title');
            if (title) {
                title.innerHTML = '<span class="tonios-window-icon">📝</span>Nouveau document';
            }
        }
        
        showNotification('Nouveau document créé', 'info');
    }
}

// Visualiseur d'images
function openImageViewer(file) {
    if (!file.content) {
        showNotification('Contenu de l\'image manquant', 'error');
        return;
    }

    // Fermer un éventuel visualiseur existant
    const existingViewer = document.querySelector('.tonios-image-viewer');
    if (existingViewer) {
        existingViewer.remove();
    }

    const viewer = document.createElement('div');
    viewer.className = 'tonios-image-viewer';
    viewer.innerHTML = `
        <div class="tonios-image-viewer-overlay">
            <div class="tonios-image-viewer-container">
                <div class="tonios-image-viewer-header">
                    <h3>📷 ${file.name}</h3>
                    <button onclick="this.closest('.tonios-image-viewer').remove()" class="tonios-btn">❌ Fermer</button>
                </div>
                <div class="tonios-image-viewer-content">
                    <img src="${file.content}" alt="${file.name}" style="max-width: 90vw; max-height: 80vh; object-fit: contain;">
                </div>
                <div class="tonios-image-viewer-info">
                    <span>Taille: ${formatFileSize(file.size)}</span>
                    <span>Créé: ${new Date(file.created).toLocaleDateString('fr-FR')}</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(viewer);
    
    // Fermer avec Échap
    viewer.onclick = (e) => {
        if (e.target === viewer || e.target.classList.contains('tonios-image-viewer-overlay')) {
            viewer.remove();
        }
    };
}

// Lecteur audio
function playAudioFile(file) {
    if (!file.content) {
        showNotification('Contenu audio manquant', 'error');
        return;
    }

    // Créer un lecteur audio simple
    const audio = new Audio(file.content);
    audio.controls = true;
    audio.autoplay = true;

    const player = document.createElement('div');
    player.className = 'tonios-audio-player';
    player.innerHTML = `
        <div class="tonios-audio-player-header">
            <span>🎵 ${file.name}</span>
            <button onclick="this.parentElement.parentElement.remove()">❌</button>
        </div>
    `;
    player.appendChild(audio);

    // Positionner le lecteur
    player.style.position = 'fixed';
    player.style.bottom = '20px';
    player.style.right = '20px';
    player.style.zIndex = '1000';
    player.style.background = 'var(--tonios-window-bg)';
    player.style.padding = '10px';
    player.style.borderRadius = '8px';
    player.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';

    document.body.appendChild(player);

    audio.onended = () => {
        setTimeout(() => player.remove(), 2000);
    };

    showNotification(`Lecture de "${file.name}" 🎵`, 'info');
}

// Gestion du drag & drop de fichiers
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    const dropZone = document.getElementById('fileDropZone');
    if (dropZone) {
        dropZone.classList.add('active');
        dropZone.style.display = 'flex';
    }
}

function handleDragLeave(event) {
    event.preventDefault();
    if (!event.relatedTarget || !document.querySelector('.tonios-desktop-area').contains(event.relatedTarget)) {
        const dropZone = document.getElementById('fileDropZone');
        if (dropZone) {
            dropZone.classList.remove('active');
            dropZone.style.display = 'none';
        }
    }
}

function handleDrop(event) {
    event.preventDefault();
    const dropZone = document.getElementById('fileDropZone');
    if (dropZone) {
        dropZone.classList.remove('active');
        dropZone.style.display = 'none';
    }
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
        showNotification(`Import de ${files.length} fichier(s) en cours...`);
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newFile = {
                    id: Date.now() + Math.random() + index,
                    name: file.name,
                    type: getFileType(file),
                    content: e.target.result,
                    size: file.size,
                    created: new Date().toISOString(),
                    lastModified: new Date(file.lastModified).toISOString(),
                    author: getCurrentUser()
                };
                userFiles.push(newFile);
                
                if (index === files.length - 1) {
                    saveUserData();
                    refreshFileList();
                    showNotification(`${files.length} fichier(s) importé(s) avec succès !`);
                }
            };
            
            reader.onerror = () => {
                showNotification(`Erreur lors de l'import de ${file.name}`, 'error');
            };
            
            if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }
}

function getFileType(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) return 'text';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    if (file.name.endsWith('.pdf')) return 'pdf';
    if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) return 'archive';
    if (file.name.match(/\.(js|html|css|json|xml)$/)) return 'code';
    return 'document';
}

// Export/Import des données utilisateur
function exportUserData() {
    const userData = {
        user: currentSession,
        files: userFiles,
        chatMessages: chatMessages,
        channels: channels,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tonios_backup_${getCurrentUser()}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Sauvegarde exportée avec succès ! 💾', 'success');
}

function importUserData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const userData = JSON.parse(event.target.result);
                    
                    // Validation des données
                    if (!userData.user || !userData.files) {
                        throw new Error('Format de sauvegarde invalide');
                    }
                    
                    // Confirmation avant import
                    const confirmMessage = `Importer la sauvegarde de "${userData.user.username}" ?\nCela remplacera vos données actuelles.`;
                    if (!confirm(confirmMessage)) return;
                    
                    // Importer les données
                    if (userData.files) userFiles = userData.files;
                    if (userData.chatMessages) chatMessages = userData.chatMessages;
                    if (userData.channels) channels = userData.channels;
                    
                    // Sauvegarder et actualiser
                    saveUserData();
                    saveChannelsData();
                    refreshFileList();
                    initializeChannels();
                    
                    showNotification('Données importées avec succès ! 📥', 'success');
                    
                } catch (error) {
                    console.error('Erreur import:', error);
                    showNotification('Erreur lors de l\'import des données', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Sauvegarde et chargement des données utilisateur
function saveUserData() {
    if (!currentSession) return;
    
    const userData = {
        files: userFiles,
        preferences: currentSession.preferences,
        chatStats: currentSession.chatStats,
        achievements: currentSession.achievements,
        lastSave: new Date().toISOString()
    };
    
    localStorage.setItem(`tonios_data_${currentSession.username}`, JSON.stringify(userData));
    saveUser(currentSession);
}

function loadUserData() {
    if (!currentSession) return;
    
    const userData = localStorage.getItem(`tonios_data_${currentSession.username}`);
    if (userData) {
        try {
            const data = JSON.parse(userData);
            userFiles = data.files || [];
            
            if (data.preferences) {
                currentSession.preferences = { ...currentSession.preferences, ...data.preferences };
            }
            if (data.chatStats) {
                currentSession.chatStats = { ...currentSession.chatStats, ...data.chatStats };
            }
            if (data.achievements) {
                currentSession.achievements = data.achievements;
            }
            
            refreshFileList();
        } catch (error) {
            console.error('Erreur chargement données utilisateur:', error);
            showNotification('Erreur lors du chargement des données', 'error');
        }
    }
}
