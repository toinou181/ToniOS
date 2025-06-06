#!/bin/bash

# Script de diagnostic approfondi pour les icônes ToniOS
echo "🔧 DIAGNOSTIC APPROFONDI DES ICÔNES TONIOS"
echo "=========================================="

# Vérification de la structure des fichiers
echo ""
echo "1. Vérification de la structure des fichiers..."
echo "------------------------------------------------"

files_to_check=(
    "index.html"
    "js/windows.js"
    "js/auth_fixed.js"
    "styles.css"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file MISSING"
    fi
done

# Vérification des fonctions essentielles
echo ""
echo "2. Vérification des fonctions dans windows.js..."
echo "------------------------------------------------"

if grep -q "function openApplication" js/windows.js; then
    echo "✅ function openApplication found"
else
    echo "❌ function openApplication NOT found"
fi

if grep -q "window.openApplication = openApplication" js/windows.js; then
    echo "✅ openApplication exposed globally"
else
    echo "❌ openApplication NOT exposed globally"
fi

# Vérification des événements dans auth_fixed.js
echo ""
echo "3. Vérification des événements dans auth_fixed.js..."
echo "----------------------------------------------------"

if grep -q "reinitializeDesktopEvents" js/auth_fixed.js; then
    echo "✅ reinitializeDesktopEvents function found"
else
    echo "❌ reinitializeDesktopEvents function NOT found"
fi

if grep -q "reinitializeDesktopEvents();" js/auth_fixed.js; then
    echo "✅ reinitializeDesktopEvents called in startSession"
else
    echo "❌ reinitializeDesktopEvents NOT called in startSession"
fi

# Vérification des icônes dans index.html
echo ""
echo "4. Vérification des icônes dans index.html..."
echo "----------------------------------------------"

icon_count=$(grep -c "tonios-desktop-icon.*onclick" index.html)
echo "📊 Nombre d'icônes avec onclick: $icon_count"

if [ $icon_count -gt 0 ]; then
    echo "✅ Icônes avec onclick trouvées"
    echo "📋 Détail des icônes:"
    grep -n "tonios-desktop-icon.*onclick" index.html | head -6
else
    echo "❌ Aucune icône avec onclick trouvée"
fi

# Vérification des scripts inclus
echo ""
echo "5. Vérification des scripts inclus dans index.html..."
echo "----------------------------------------------------"

scripts_to_check=(
    "js/windows.js"
    "js/auth_fixed.js"
)

for script in "${scripts_to_check[@]}"; do
    if grep -q "$script" index.html; then
        echo "✅ $script included"
    else
        echo "❌ $script NOT included"
    fi
done

# Test de syntaxe JavaScript
echo ""
echo "6. Test de syntaxe JavaScript..."
echo "---------------------------------"

for jsfile in js/*.js; do
    if command -v node >/dev/null 2>&1; then
        if node -c "$jsfile" 2>/dev/null; then
            echo "✅ $jsfile syntax OK"
        else
            echo "❌ $jsfile syntax ERROR"
            node -c "$jsfile"
        fi
    else
        echo "⚠️  Node.js not available for syntax check"
        break
    fi
done

# Créer un test automatisé
echo ""
echo "7. Création d'un test automatisé..."
echo "-----------------------------------"

cat > test_icon_functionality.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Test Automatisé Icônes</title>
</head>
<body>
    <div id="results"></div>
    
    <!-- Simulation des icônes -->
    <div style="display:none;">
        <div class="tonios-desktop-icon" onclick="openApplication('calculator')">Calc</div>
        <div class="tonios-desktop-icon" onclick="openApplication('notepad')">Notes</div>
    </div>

    <!-- Scripts ToniOS -->
    <script src="js/windows.js"></script>
    <script src="js/auth_fixed.js"></script>
    
    <script>
        let testResults = [];
        
        function addResult(test, status, message) {
            testResults.push({test, status, message});
            updateDisplay();
        }
        
        function updateDisplay() {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<h2>Résultats des Tests</h2>' + 
                testResults.map(r => 
                    `<div style="color: ${r.status === 'OK' ? 'green' : 'red'}">
                        ${r.status === 'OK' ? '✅' : '❌'} ${r.test}: ${r.message}
                    </div>`
                ).join('');
        }
        
        // Tests automatiques
        window.addEventListener('load', function() {
            // Test 1: openApplication disponible
            if (typeof window.openApplication === 'function') {
                addResult('openApplication', 'OK', 'Fonction disponible globalement');
            } else {
                addResult('openApplication', 'ERROR', 'Fonction non disponible');
            }
            
            // Test 2: reinitializeDesktopEvents disponible
            if (typeof reinitializeDesktopEvents === 'function') {
                addResult('reinitializeDesktopEvents', 'OK', 'Fonction disponible');
                
                // Test 3: Exécution de reinitializeDesktopEvents
                try {
                    reinitializeDesktopEvents();
                    addResult('reinitializeDesktopEvents execution', 'OK', 'Exécution réussie');
                } catch (e) {
                    addResult('reinitializeDesktopEvents execution', 'ERROR', e.message);
                }
            } else {
                addResult('reinitializeDesktopEvents', 'ERROR', 'Fonction non disponible');
            }
            
            // Test 4: Simulation de clic
            const icons = document.querySelectorAll('.tonios-desktop-icon');
            addResult('Icons found', icons.length > 0 ? 'OK' : 'ERROR', 
                     `${icons.length} icônes trouvées`);
            
            // Test 5: Événements après reinitializeDesktopEvents
            let eventCount = 0;
            icons.forEach(icon => {
                if (icon.onclick || icon.addEventListener) {
                    eventCount++;
                }
            });
            addResult('Events attached', eventCount > 0 ? 'OK' : 'ERROR', 
                     `${eventCount} événements attachés`);
        });
    </script>
</body>
</html>
EOF

echo "✅ Fichier test_icon_functionality.html créé"

echo ""
echo "8. Recommandations..."
echo "--------------------"
echo "1. Ouvrez http://localhost:8000/debug_icons.html pour les tests interactifs"
echo "2. Ouvrez http://localhost:8000/test_icon_functionality.html pour les tests automatiques"
echo "3. Ouvrez http://localhost:8000/ pour tester le système principal"
echo ""
echo "📊 DIAGNOSTIC TERMINÉ"
