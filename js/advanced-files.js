// ===============================================
// GESTIONNAIRE DE FICHIERS AVANCÉ ToniOS
// ===============================================

class AdvancedFileManager {
    constructor() {
        this.currentPath = '/';
        this.fileSystem = this.initializeFileSystem();
        this.selectedFiles = new Set();
        this.clipboard = null;
        this.viewMode = 'grid'; // grid, list, details
        this.sortBy = 'name'; // name, size, date, type
        this.sortOrder = 'asc';
        this.searchTerm = '';
        this.fileHistory = [];
        this.userFiles = new Map(); // Fichiers par utilisateur
    }

    initializeFileSystem() {
        return {
            '/': {
                type: 'folder',
                name: 'Racine',
                children: {
                    'Documents': {
                        type: 'folder',
                        name: 'Documents',
                        created: new Date('2025-01-01'),
                        modified: new Date(),
                        size: 0,
                        children: {}
                    },
                    'Images': {
                        type: 'folder',
                        name: 'Images',
                        created: new Date('2025-01-01'),
                        modified: new Date(),
                        size: 0,
                        children: {
                            'avatar.png': {
                                type: 'file',
                                name: 'avatar.png',
                                size: 24576,
                                created: new Date('2025-01-15'),
                                modified: new Date('2025-01-15'),
                                content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                            }
                        }
                    },
                    'Téléchargements': {
                        type: 'folder',
                        name: 'Téléchargements',
                        created: new Date('2025-01-01'),
                        modified: new Date(),
                        size: 0,
                        children: {}
                    },
                    'Bureau': {
                        type: 'folder',
                        name: 'Bureau',
                        created: new Date('2025-01-01'),
                        modified: new Date(),
                        size: 0,
                        children: {}
                    },
                    'Système': {
                        type: 'folder',
                        name: 'Système',
                        created: new Date('2025-01-01'),
                        modified: new Date(),
                        size: 0,
                        protected: true,
                        children: {
                            'config.json': {
                                type: 'file',
                                name: 'config.json',
                                size: 1024,
                                created: new Date('2025-01-01'),
                                modified: new Date(),
                                content: JSON.stringify({
                                    version: '2025.1',
                                    theme: 'default',
                                    security: 'high'
                                }, null, 2),
                                protected: true
                            }
                        }
                    }
                }
            }
        };
    }

    createFileManagerWindow() {
        return `
            <div class="tonios-file-manager">
                <!-- Barre d'outils -->
                <div class="file-manager-toolbar">
                    <div class="toolbar-section">
                        <button class="file-btn" onclick="fileManager.goBack()" title="Précédent">
                            <span class="file-btn-icon">⬅️</span>
                        </button>
                        <button class="file-btn" onclick="fileManager.goForward()" title="Suivant">
                            <span class="file-btn-icon">➡️</span>
                        </button>
                        <button class="file-btn" onclick="fileManager.goUp()" title="Dossier parent">
                            <span class="file-btn-icon">⬆️</span>
                        </button>
                        <button class="file-btn" onclick="fileManager.refresh()" title="Actualiser">
                            <span class="file-btn-icon">🔄</span>
                        </button>
                    </div>
                    
                    <div class="toolbar-section">
                        <button class="file-btn" onclick="fileManager.createFolder()" title="Nouveau dossier">
                            <span class="file-btn-icon">📁</span>
                            <span class="file-btn-text">Nouveau dossier</span>
                        </button>
                        <button class="file-btn" onclick="fileManager.createFile()" title="Nouveau fichier">
                            <span class="file-btn-icon">📄</span>
                            <span class="file-btn-text">Nouveau fichier</span>
                        </button>
                        <input type="file" id="fileUpload" multiple style="display: none;" onchange="fileManager.uploadFiles(event)">
                        <button class="file-btn" onclick="document.getElementById('fileUpload').click()" title="Télécharger">
                            <span class="file-btn-icon">⬆️</span>
                            <span class="file-btn-text">Télécharger</span>
                        </button>
                    </div>
                    
                    <div class="toolbar-section">
                        <button class="file-btn" onclick="fileManager.cut()" title="Couper">
                            <span class="file-btn-icon">✂️</span>
                        </button>
                        <button class="file-btn" onclick="fileManager.copy()" title="Copier">
                            <span class="file-btn-icon">📋</span>
                        </button>
                        <button class="file-btn" onclick="fileManager.paste()" title="Coller">
                            <span class="file-btn-icon">📌</span>
                        </button>
                        <button class="file-btn" onclick="fileManager.deleteSelected()" title="Supprimer">
                            <span class="file-btn-icon">🗑️</span>
                        </button>
                    </div>
                    
                    <div class="toolbar-section">
                        <select class="file-select" onchange="fileManager.changeViewMode(this.value)">
                            <option value="grid">Grille</option>
                            <option value="list">Liste</option>
                            <option value="details">Détails</option>
                        </select>
                        <select class="file-select" onchange="fileManager.changeSortBy(this.value)">
                            <option value="name">Nom</option>
                            <option value="size">Taille</option>
                            <option value="date">Date</option>
                            <option value="type">Type</option>
                        </select>
                    </div>
                </div>
                
                <!-- Barre d'adresse -->
                <div class="file-manager-address-bar">
                    <div class="address-breadcrumb" id="breadcrumb">
                        <!-- Navigation breadcrumb -->
                    </div>
                    <div class="search-container">
                        <input type="text" class="search-input" placeholder="🔍 Rechercher..." 
                               oninput="fileManager.search(this.value)">
                    </div>
                </div>
                
                <!-- Zone principale -->
                <div class="file-manager-main">
                    <!-- Sidebar -->
                    <div class="file-manager-sidebar">
                        <div class="sidebar-section">
                            <h4>📁 Favoris</h4>
                            <div class="sidebar-item" onclick="fileManager.navigate('/Documents')">
                                <span class="sidebar-icon">📄</span>
                                Documents
                            </div>
                            <div class="sidebar-item" onclick="fileManager.navigate('/Images')">
                                <span class="sidebar-icon">🖼️</span>
                                Images
                            </div>
                            <div class="sidebar-item" onclick="fileManager.navigate('/Téléchargements')">
                                <span class="sidebar-icon">⬇️</span>
                                Téléchargements
                            </div>
                            <div class="sidebar-item" onclick="fileManager.navigate('/Bureau')">
                                <span class="sidebar-icon">🖥️</span>
                                Bureau
                            </div>
                        </div>
                        
                        <div class="sidebar-section">
                            <h4>⚙️ Système</h4>
                            <div class="sidebar-item" onclick="fileManager.navigate('/Système')">
                                <span class="sidebar-icon">🔧</span>
                                Système
                            </div>
                        </div>
                        
                        <div class="sidebar-section">
                            <h4>👥 Utilisateurs</h4>
                            <div id="userList">
                                <!-- Liste des utilisateurs -->
                            </div>
                        </div>
                        
                        <div class="sidebar-section">
                            <h4>📊 Stockage</h4>
                            <div class="storage-info">
                                <div class="storage-bar">
                                    <div class="storage-used" style="width: 35%"></div>
                                </div>
                                <div class="storage-text">3.5 GB / 10 GB utilisés</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Zone de contenu -->
                    <div class="file-manager-content">
                        <div class="file-grid" id="fileGrid">
                            <!-- Les fichiers et dossiers seront affichés ici -->
                        </div>
                    </div>
                </div>
                
                <!-- Barre de statut -->
                <div class="file-manager-status">
                    <div class="status-info" id="statusInfo">
                        Prêt
                    </div>
                    <div class="selected-info" id="selectedInfo">
                        0 élément(s) sélectionné(s)
                    </div>
                </div>
                
                <!-- Menu contextuel -->
                <div id="contextMenu" class="context-menu" style="display: none;">
                    <div class="context-item" onclick="fileManager.openFile()">
                        <span class="context-icon">📂</span>
                        Ouvrir
                    </div>
                    <div class="context-item" onclick="fileManager.openWith()">
                        <span class="context-icon">🔧</span>
                        Ouvrir avec...
                    </div>
                    <div class="context-separator"></div>
                    <div class="context-item" onclick="fileManager.cut()">
                        <span class="context-icon">✂️</span>
                        Couper
                    </div>
                    <div class="context-item" onclick="fileManager.copy()">
                        <span class="context-icon">📋</span>
                        Copier
                    </div>
                    <div class="context-item" onclick="fileManager.paste()">
                        <span class="context-icon">📌</span>
                        Coller
                    </div>
                    <div class="context-separator"></div>
                    <div class="context-item" onclick="fileManager.rename()">
                        <span class="context-icon">✏️</span>
                        Renommer
                    </div>
                    <div class="context-item" onclick="fileManager.deleteSelected()">
                        <span class="context-icon">🗑️</span>
                        Supprimer
                    </div>
                    <div class="context-separator"></div>
                    <div class="context-item" onclick="fileManager.properties()">
                        <span class="context-icon">ℹ️</span>
                        Propriétés
                    </div>
                </div>
            </div>
        `;
    }

    navigate(path) {
        this.fileHistory.push(this.currentPath);
        this.currentPath = path;
        this.selectedFiles.clear();
        this.updateDisplay();
    }

    goBack() {
        if (this.fileHistory.length > 0) {
            this.currentPath = this.fileHistory.pop();
            this.updateDisplay();
        }
    }

    goUp() {
        if (this.currentPath !== '/') {
            const parentPath = this.currentPath.split('/').slice(0, -1).join('/') || '/';
            this.navigate(parentPath);
        }
    }

    refresh() {
        this.updateDisplay();
        this.showNotification('Dossier actualisé', 'info');
    }

    updateDisplay() {
        this.updateBreadcrumb();
        this.updateFileGrid();
        this.updateStatusInfo();
        this.updateUserList();
    }

    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;

        const parts = this.currentPath.split('/').filter(part => part);
        let html = '<span class="breadcrumb-item" onclick="fileManager.navigate(\'/\')">🏠 Racine</span>';
        
        let currentPath = '';
        parts.forEach(part => {
            currentPath += '/' + part;
            html += ` <span class="breadcrumb-separator">></span> 
                     <span class="breadcrumb-item" onclick="fileManager.navigate('${currentPath}')">${part}</span>`;
        });
        
        breadcrumb.innerHTML = html;
    }

    updateFileGrid() {
        const fileGrid = document.getElementById('fileGrid');
        if (!fileGrid) return;

        const currentFolder = this.getCurrentFolder();
        if (!currentFolder || !currentFolder.children) {
            fileGrid.innerHTML = '<div class="empty-folder">📂 Dossier vide</div>';
            return;
        }

        const files = Object.values(currentFolder.children);
        const filteredFiles = this.filterAndSortFiles(files);
        
        fileGrid.className = `file-grid ${this.viewMode}-view`;
        fileGrid.innerHTML = filteredFiles.map(file => this.createFileItem(file)).join('');
    }

    getCurrentFolder() {
        let current = this.fileSystem['/'];
        if (this.currentPath === '/') return current;
        
        const parts = this.currentPath.split('/').filter(part => part);
        for (const part of parts) {
            if (current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        return current;
    }

    filterAndSortFiles(files) {
        let filtered = files;
        
        // Filtrer par recherche
        if (this.searchTerm) {
            filtered = filtered.filter(file => 
                file.name.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }
        
        // Trier
        filtered.sort((a, b) => {
            // Dossiers d'abord
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            
            let compareValue;
            switch (this.sortBy) {
                case 'size':
                    compareValue = (a.size || 0) - (b.size || 0);
                    break;
                case 'date':
                    compareValue = new Date(a.modified) - new Date(b.modified);
                    break;
                case 'type':
                    compareValue = this.getFileExtension(a.name).localeCompare(this.getFileExtension(b.name));
                    break;
                default: // name
                    compareValue = a.name.localeCompare(b.name);
            }
            
            return this.sortOrder === 'asc' ? compareValue : -compareValue;
        });
        
        return filtered;
    }

    createFileItem(file) {
        const isSelected = this.selectedFiles.has(file.name);
        const icon = this.getFileIcon(file);
        const size = this.formatFileSize(file.size);
        const date = new Date(file.modified).toLocaleDateString();
        
        return `
            <div class="file-item ${isSelected ? 'selected' : ''}" 
                 data-name="${file.name}"
                 onclick="fileManager.selectFile('${file.name}', event)"
                 ondblclick="fileManager.openFile('${file.name}')"
                 oncontextmenu="fileManager.showContextMenu(event, '${file.name}')">
                <div class="file-icon">${icon}</div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    ${this.viewMode === 'details' ? `
                        <div class="file-details">
                            <span class="file-size">${size}</span>
                            <span class="file-date">${date}</span>
                            <span class="file-type">${this.getFileType(file)}</span>
                        </div>
                    ` : ''}
                </div>
                ${file.protected ? '<div class="file-protected">🔒</div>' : ''}
            </div>
        `;
    }

    getFileIcon(file) {
        if (file.type === 'folder') return '📁';
        
        const ext = this.getFileExtension(file.name).toLowerCase();
        const iconMap = {
            'txt': '📄', 'doc': '📄', 'docx': '📄',
            'pdf': '📕', 'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
            'mp3': '🎵', 'wav': '🎵', 'mp4': '🎬', 'avi': '🎬',
            'zip': '📦', 'rar': '📦', 'js': '⚙️', 'html': '🌐', 'css': '🎨',
            'json': '⚙️', 'xml': '📋'
        };
        
        return iconMap[ext] || '📄';
    }

    getFileExtension(filename) {
        return filename.split('.').pop() || '';
    }

    getFileType(file) {
        if (file.type === 'folder') return 'Dossier';
        const ext = this.getFileExtension(file.name).toLowerCase();
        
        const typeMap = {
            'txt': 'Document texte',
            'jpg': 'Image JPEG', 'jpeg': 'Image JPEG', 'png': 'Image PNG', 'gif': 'Image GIF',
            'mp3': 'Audio MP3', 'wav': 'Audio WAV',
            'mp4': 'Vidéo MP4', 'avi': 'Vidéo AVI',
            'zip': 'Archive ZIP', 'rar': 'Archive RAR',
            'js': 'Script JavaScript', 'html': 'Page Web', 'css': 'Feuille de style'
        };
        
        return typeMap[ext] || 'Fichier ' + ext.toUpperCase();
    }

    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    selectFile(fileName, event) {
        if (event.ctrlKey || event.metaKey) {
            // Sélection multiple
            if (this.selectedFiles.has(fileName)) {
                this.selectedFiles.delete(fileName);
            } else {
                this.selectedFiles.add(fileName);
            }
        } else {
            // Sélection simple
            this.selectedFiles.clear();
            this.selectedFiles.add(fileName);
        }
        
        this.updateFileSelection();
        this.updateStatusInfo();
    }

    updateFileSelection() {
        document.querySelectorAll('.file-item').forEach(item => {
            const fileName = item.dataset.name;
            item.classList.toggle('selected', this.selectedFiles.has(fileName));
        });
    }

    openFile(fileName) {
        const currentFolder = this.getCurrentFolder();
        const file = currentFolder.children[fileName];
        
        if (!file) return;
        
        if (file.type === 'folder') {
            this.navigate(this.currentPath + (this.currentPath === '/' ? '' : '/') + fileName);
        } else {
            // Ouvrir le fichier selon son type
            this.openFileByType(file);
        }
    }

    openFileByType(file) {
        const ext = this.getFileExtension(file.name).toLowerCase();
        
        switch (ext) {
            case 'txt':
            case 'json':
            case 'js':
            case 'html':
            case 'css':
                window.openApplication('notepad', file.name);
                break;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                this.showImageViewer(file);
                break;
            default:
                this.showNotification(`Impossible d'ouvrir ${file.name}`, 'warning');
        }
    }

    showImageViewer(file) {
        const viewer = document.createElement('div');
        viewer.className = 'image-viewer-overlay';
        viewer.innerHTML = `
            <div class="image-viewer">
                <div class="image-viewer-header">
                    <h3>${file.name}</h3>
                    <button onclick="this.closest('.image-viewer-overlay').remove()">✕</button>
                </div>
                <div class="image-viewer-content">
                    <img src="${file.content || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg=='}" alt="${file.name}">
                </div>
            </div>
        `;
        document.body.appendChild(viewer);
    }

    createFolder() {
        const name = prompt('Nom du nouveau dossier:');
        if (!name) return;
        
        const currentFolder = this.getCurrentFolder();
        if (currentFolder.children[name]) {
            this.showNotification('Un fichier avec ce nom existe déjà', 'error');
            return;
        }
        
        currentFolder.children[name] = {
            type: 'folder',
            name: name,
            created: new Date(),
            modified: new Date(),
            size: 0,
            children: {}
        };
        
        this.updateDisplay();
        this.showNotification(`Dossier "${name}" créé`, 'success');
    }

    createFile() {
        const name = prompt('Nom du nouveau fichier:');
        if (!name) return;
        
        const currentFolder = this.getCurrentFolder();
        if (currentFolder.children[name]) {
            this.showNotification('Un fichier avec ce nom existe déjà', 'error');
            return;
        }
        
        currentFolder.children[name] = {
            type: 'file',
            name: name,
            created: new Date(),
            modified: new Date(),
            size: 0,
            content: ''
        };
        
        this.updateDisplay();
        this.showNotification(`Fichier "${name}" créé`, 'success');
    }

    uploadFiles(event) {
        const files = Array.from(event.target.files);
        const currentFolder = this.getCurrentFolder();
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentFolder.children[file.name] = {
                    type: 'file',
                    name: file.name,
                    created: new Date(file.lastModified),
                    modified: new Date(file.lastModified),
                    size: file.size,
                    content: e.target.result
                };
                this.updateDisplay();
            };
            reader.readAsDataURL(file);
        });
        
        this.showNotification(`${files.length} fichier(s) téléchargé(s)`, 'success');
    }

    copy() {
        if (this.selectedFiles.size === 0) return;
        
        this.clipboard = {
            operation: 'copy',
            files: Array.from(this.selectedFiles),
            sourcePath: this.currentPath
        };
        
        this.showNotification(`${this.selectedFiles.size} élément(s) copié(s)`, 'info');
    }

    cut() {
        if (this.selectedFiles.size === 0) return;
        
        this.clipboard = {
            operation: 'cut',
            files: Array.from(this.selectedFiles),
            sourcePath: this.currentPath
        };
        
        this.showNotification(`${this.selectedFiles.size} élément(s) coupé(s)`, 'info');
    }

    paste() {
        if (!this.clipboard) return;
        
        const currentFolder = this.getCurrentFolder();
        const sourceFolder = this.getFolderByPath(this.clipboard.sourcePath);
        
        this.clipboard.files.forEach(fileName => {
            const sourceFile = sourceFolder.children[fileName];
            if (sourceFile) {
                if (this.clipboard.operation === 'cut') {
                    // Déplacer
                    delete sourceFolder.children[fileName];
                    currentFolder.children[fileName] = sourceFile;
                } else {
                    // Copier
                    currentFolder.children[fileName] = JSON.parse(JSON.stringify(sourceFile));
                }
            }
        });
        
        if (this.clipboard.operation === 'cut') {
            this.clipboard = null;
        }
        
        this.updateDisplay();
        this.showNotification('Éléments collés', 'success');
    }

    deleteSelected() {
        if (this.selectedFiles.size === 0) return;
        
        if (!confirm(`Supprimer ${this.selectedFiles.size} élément(s) ?`)) return;
        
        const currentFolder = this.getCurrentFolder();
        this.selectedFiles.forEach(fileName => {
            const file = currentFolder.children[fileName];
            if (file && !file.protected) {
                delete currentFolder.children[fileName];
            }
        });
        
        this.selectedFiles.clear();
        this.updateDisplay();
        this.showNotification('Éléments supprimés', 'success');
    }

    rename() {
        if (this.selectedFiles.size !== 1) return;
        
        const fileName = Array.from(this.selectedFiles)[0];
        const newName = prompt('Nouveau nom:', fileName);
        if (!newName || newName === fileName) return;
        
        const currentFolder = this.getCurrentFolder();
        const file = currentFolder.children[fileName];
        
        if (currentFolder.children[newName]) {
            this.showNotification('Un fichier avec ce nom existe déjà', 'error');
            return;
        }
        
        file.name = newName;
        currentFolder.children[newName] = file;
        delete currentFolder.children[fileName];
        
        this.selectedFiles.clear();
        this.selectedFiles.add(newName);
        
        this.updateDisplay();
        this.showNotification(`Renommé en "${newName}"`, 'success');
    }

    properties() {
        if (this.selectedFiles.size !== 1) return;
        
        const fileName = Array.from(this.selectedFiles)[0];
        const currentFolder = this.getCurrentFolder();
        const file = currentFolder.children[fileName];
        
        const propsWindow = document.createElement('div');
        propsWindow.className = 'properties-overlay';
        propsWindow.innerHTML = `
            <div class="properties-dialog">
                <div class="properties-header">
                    <h3>Propriétés de ${file.name}</h3>
                    <button onclick="this.closest('.properties-overlay').remove()">✕</button>
                </div>
                <div class="properties-content">
                    <div class="property-row">
                        <label>Nom:</label>
                        <span>${file.name}</span>
                    </div>
                    <div class="property-row">
                        <label>Type:</label>
                        <span>${this.getFileType(file)}</span>
                    </div>
                    <div class="property-row">
                        <label>Taille:</label>
                        <span>${this.formatFileSize(file.size)}</span>
                    </div>
                    <div class="property-row">
                        <label>Créé:</label>
                        <span>${new Date(file.created).toLocaleString()}</span>
                    </div>
                    <div class="property-row">
                        <label>Modifié:</label>
                        <span>${new Date(file.modified).toLocaleString()}</span>
                    </div>
                    <div class="property-row">
                        <label>Chemin:</label>
                        <span>${this.currentPath}/${file.name}</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(propsWindow);
    }

    getFolderByPath(path) {
        let current = this.fileSystem['/'];
        if (path === '/') return current;
        
        const parts = path.split('/').filter(part => part);
        for (const part of parts) {
            if (current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        return current;
    }

    search(term) {
        this.searchTerm = term;
        this.updateDisplay();
    }

    changeViewMode(mode) {
        this.viewMode = mode;
        this.updateDisplay();
    }

    changeSortBy(sortBy) {
        if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortOrder = 'asc';
        }
        this.updateDisplay();
    }

    updateStatusInfo() {
        const statusInfo = document.getElementById('statusInfo');
        const selectedInfo = document.getElementById('selectedInfo');
        
        if (statusInfo) {
            const currentFolder = this.getCurrentFolder();
            const itemCount = currentFolder ? Object.keys(currentFolder.children).length : 0;
            statusInfo.textContent = `${itemCount} élément(s)`;
        }
        
        if (selectedInfo) {
            selectedInfo.textContent = `${this.selectedFiles.size} élément(s) sélectionné(s)`;
        }
    }

    updateUserList() {
        const userList = document.getElementById('userList');
        if (!userList) return;
        
        // Récupérer la liste des utilisateurs depuis le localStorage
        const users = JSON.parse(localStorage.getItem('tonios_users') || '{}');
        
        userList.innerHTML = Object.values(users).map(user => `
            <div class="sidebar-item user-item" onclick="fileManager.viewUserFiles('${user.username}')">
                <span class="sidebar-icon">👤</span>
                <span class="user-name">${user.username}</span>
                <span class="user-status ${user.isOnline ? 'online' : 'offline'}">
                    ${user.isOnline ? '🟢' : '🔴'}
                </span>
            </div>
        `).join('');
    }

    viewUserFiles(username) {
        // Créer un dossier virtuel pour les fichiers de l'utilisateur
        this.navigate(`/Utilisateurs/${username}`);
    }

    showContextMenu(event, fileName) {
        event.preventDefault();
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu) return;
        
        contextMenu.style.display = 'block';
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        
        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        }, { once: true });
    }

    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        }
    }
}

// Instance globale du gestionnaire de fichiers
window.fileManager = new AdvancedFileManager();
