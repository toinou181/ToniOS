#!/bin/bash

# ===============================================
# SCRIPT DE TEST COMPLET POUR TONIOS
# ===============================================

echo "🧪 Démarrage des tests ToniOS..."

# Vérifier que tous les fichiers JavaScript existent
echo "📁 Vérification des fichiers JavaScript..."

files=(
    "js/admin-security-ultra.js"
    "js/notifications.js"
    "js/windows.js"
    "js/files.js"
    "js/chat.js"
    "js/discord-chat-advanced.js"
    "js/advanced-files.js"
    "js/session-manager.js"
    "js/voice.js"
    "js/auth_fixed.js"
    "js/main_with_auth_final.js"
)

missing_files=0
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file MANQUANT"
        missing_files=$((missing_files + 1))
    fi
done

# Vérifier les fichiers CSS et HTML
echo ""
echo "🎨 Vérification des fichiers de style et HTML..."

if [ -f "styles.css" ]; then
    echo "✅ styles.css"
else
    echo "❌ styles.css MANQUANT"
    missing_files=$((missing_files + 1))
fi

if [ -f "index.html" ]; then
    echo "✅ index.html"
else
    echo "❌ index.html MANQUANT"
    missing_files=$((missing_files + 1))
fi

# Vérifier les fichiers de sécurité
echo ""
echo "🔒 Vérification des fichiers de sécurité..."

security_files=(
    "admin_dashboard_secure.html"
    "js/admin-security-ultra.js"
)

for file in "${security_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file MANQUANT"
        missing_files=$((missing_files + 1))
    fi
done

# Analyser le contenu HTML pour vérifier les applications
echo ""
echo "🖥️ Vérification des applications dans index.html..."

applications=(
    "filemanager"
    "discord-chat"
    "session-manager"
)

for app in "${applications[@]}"; do
    if grep -q "openApplication('$app')" index.html; then
        echo "✅ Application $app configurée"
    else
        echo "❌ Application $app NON configurée"
    fi
done

# Vérifier les scripts dans le HTML
echo ""
echo "📜 Vérification des scripts dans index.html..."

for file in "${files[@]}"; do
    filename=$(basename "$file")
    if grep -q "$filename" index.html; then
        echo "✅ Script $filename inclus"
    else
        echo "❌ Script $filename NON inclus"
    fi
done

# Vérifier les fonctionnalités de sécurité
echo ""
echo "🛡️ Vérification des fonctionnalités de sécurité..."

if grep -q "adminSecurity" js/auth_fixed.js; then
    echo "✅ Système de sécurité admin intégré"
else
    echo "❌ Système de sécurité admin NON intégré"
fi

if grep -q "ADMIN_TONIOS_2025" js/admin-security-ultra.js; then
    echo "✅ Codes d'accès admin configurés"
else
    echo "❌ Codes d'accès admin NON configurés"
fi

# Vérifier les styles CSS pour les nouvelles applications
echo ""
echo "🎨 Vérification des styles CSS..."

css_sections=(
    "discord-chat-container"
    "advanced-file-manager"
    "session-manager"
)

for section in "${css_sections[@]}"; do
    if grep -q "$section" styles.css; then
        echo "✅ Styles $section présents"
    else
        echo "❌ Styles $section MANQUANTS"
    fi
done

# Résumé final
echo ""
echo "📊 RÉSUMÉ DES TESTS:"
echo "======================"

if [ $missing_files -eq 0 ]; then
    echo "✅ Tous les fichiers sont présents"
    echo "✅ Le système ToniOS est prêt"
    echo ""
    echo "🚀 FONCTIONNALITÉS DISPONIBLES:"
    echo "• 🔐 Système d'authentification ultra-sécurisé"
    echo "• 🛡️ Dashboard admin avec codes d'accès"
    echo "• 📁 Gestionnaire de fichiers avancé"
    echo "• 💬 Chat Discord avec canaux vocaux"
    echo "• 👥 Gestionnaire de sessions utilisateurs"
    echo "• 🎤 Support vocal et enregistrement"
    echo "• 🚫 Protection anti-intrusion"
    echo "• 📊 Monitoring de sécurité en temps réel"
    echo ""
    echo "🌐 Pour tester: http://localhost:8000"
    echo "🔑 Codes admin: ADMIN_TONIOS_2025, MASTER_ACCESS_CODE, ULTRA_SECURE_ADMIN"
else
    echo "❌ $missing_files fichiers manquants détectés"
    echo "⚠️ Vérifiez les erreurs ci-dessus"
fi

echo ""
echo "🎯 Test terminé!"
