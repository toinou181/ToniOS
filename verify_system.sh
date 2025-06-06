#!/bin/bash

# ===============================================
# SCRIPT DE VÉRIFICATION TONIOS - AUTHENTICATION
# ===============================================

echo "🔍 Vérification du système ToniOS..."
echo "======================================"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        return 0
    else
        echo -e "${RED}❌${NC} $1 (MANQUANT)"
        return 1
    fi
}

check_function_in_file() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} Fonction '$2' trouvée dans $1"
        return 0
    else
        echo -e "${RED}❌${NC} Fonction '$2' manquante dans $1"
        return 1
    fi
}

# Vérification des fichiers principaux
echo -e "${BLUE}📁 Vérification des fichiers principaux...${NC}"
files_ok=0
total_files=0

files=(
    "index.html"
    "index_without_auth.html"
    "js/auth_fixed.js"
    "js/main_with_auth_final.js"
    "js/windows.js"
    "js/notifications.js"
    "styles.css"
)

for file in "${files[@]}"; do
    check_file "$file"
    if [ $? -eq 0 ]; then
        ((files_ok++))
    fi
    ((total_files++))
done

echo ""
echo -e "${BLUE}🔧 Vérification des fonctions critiques...${NC}"

# Vérification des fonctions d'authentification
functions_ok=0
total_functions=0

auth_functions=(
    "handleLogin:js/auth_fixed.js"
    "handleRegister:js/auth_fixed.js"
    "startSession:js/auth_fixed.js"
    "reinitializeDesktopEvents:js/auth_fixed.js"
)

for func_file in "${auth_functions[@]}"; do
    IFS=':' read -r func file <<< "$func_file"
    check_function_in_file "$file" "$func"
    if [ $? -eq 0 ]; then
        ((functions_ok++))
    fi
    ((total_functions++))
done

# Vérification des fonctions de fenêtres
window_functions=(
    "openApplication:js/windows.js"
    "window.openApplication:js/windows.js"
    "closeWindow:js/windows.js"
    "minimizeWindow:js/windows.js"
)

for func_file in "${window_functions[@]}"; do
    IFS=':' read -r func file <<< "$func_file"
    check_function_in_file "$file" "$func"
    if [ $? -eq 0 ]; then
        ((functions_ok++))
    fi
    ((total_functions++))
done

echo ""
echo -e "${BLUE}🧪 Vérification des fichiers de test...${NC}"

test_files=(
    "test_authentication.html"
    "admin_dashboard.html"
    "final_diagnostic.html"
)

tests_ok=0
total_tests=0

for file in "${test_files[@]}"; do
    check_file "$file"
    if [ $? -eq 0 ]; then
        ((tests_ok++))
    fi
    ((total_tests++))
done

echo ""
echo "======================================"
echo -e "${BLUE}📊 RÉSUMÉ DE LA VÉRIFICATION${NC}"
echo "======================================"

# Calcul du pourcentage de réussite
total_checks=$((total_files + total_functions + total_tests))
total_success=$((files_ok + functions_ok + tests_ok))
percentage=$((total_success * 100 / total_checks))

echo -e "📁 Fichiers principaux: ${GREEN}$files_ok${NC}/$total_files"
echo -e "🔧 Fonctions critiques: ${GREEN}$functions_ok${NC}/$total_functions"
echo -e "🧪 Fichiers de test: ${GREEN}$tests_ok${NC}/$total_tests"
echo ""
echo -e "🎯 Score global: ${GREEN}$total_success${NC}/$total_checks (${GREEN}$percentage%${NC})"

if [ $percentage -ge 90 ]; then
    echo -e "${GREEN}🎉 EXCELLENT! Le système est prêt.${NC}"
elif [ $percentage -ge 75 ]; then
    echo -e "${YELLOW}⚠️  BON. Quelques améliorations possibles.${NC}"
else
    echo -e "${RED}❌ ATTENTION. Des éléments critiques manquent.${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Pour tester le système:${NC}"
echo "1. Ouvrir index.html dans un navigateur"
echo "2. Se connecter avec un nom d'utilisateur"
echo "3. Tester les icônes du bureau"
echo "4. Utiliser test_authentication.html pour les diagnostics"

echo ""
echo -e "${BLUE}🔗 Fichiers disponibles:${NC}"
echo "• index.html (Avec authentification)"
echo "• index_without_auth.html (Sans authentification)"
echo "• admin_dashboard.html (Dashboard administrateur)"
echo "• test_authentication.html (Tests et diagnostics)"

echo ""
echo "Vérification terminée!"
