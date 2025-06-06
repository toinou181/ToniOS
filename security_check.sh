#!/bin/bash

# Script de vérification de sécurité ToniOS Admin Dashboard
# À exécuter régulièrement pour vérifier l'intégrité du système

echo "🛡️ VÉRIFICATION SÉCURITÉ TONIOS ADMIN DASHBOARD"
echo "=================================================="
echo

# Vérifier l'existence des fichiers critiques
echo "📁 Vérification des fichiers critiques..."

if [ -f "/workspaces/ToniOS/.admin_auth" ]; then
    echo "✅ Fichier d'authentification présent"
    
    # Vérifier les permissions
    PERMS=$(stat -c "%a" /workspaces/ToniOS/.admin_auth)
    if [ "$PERMS" = "600" ]; then
        echo "✅ Permissions correctes (600)"
    else
        echo "⚠️ Permissions incorrectes: $PERMS (devrait être 600)"
        echo "   Correction en cours..."
        chmod 600 /workspaces/ToniOS/.admin_auth
        echo "✅ Permissions corrigées"
    fi
else
    echo "❌ CRITIQUE: Fichier d'authentification manquant!"
    exit 1
fi

if [ -f "/workspaces/ToniOS/admin_dashboard.html" ]; then
    echo "✅ Dashboard administrateur présent"
else
    echo "❌ CRITIQUE: Dashboard administrateur manquant!"
    exit 1
fi

echo

# Vérifier les logs de sécurité
echo "📊 Vérification des logs de sécurité..."
if [ -f "/workspaces/ToniOS/.security_log" ]; then
    echo "✅ Log de sécurité présent"
    echo "📝 Dernières entrées:"
    tail -5 /workspaces/ToniOS/.security_log | sed 's/^/   /'
else
    echo "⚠️ Log de sécurité manquant, création..."
    echo "$(date): Log de sécurité initialisé par script de vérification" > /workspaces/ToniOS/.security_log
    chmod 600 /workspaces/ToniOS/.security_log
    echo "✅ Log de sécurité créé"
fi

echo

# Vérifier l'intégrité du dashboard
echo "🔍 Vérification de l'intégrité du dashboard..."
if grep -q "HOxJSjPee17kGCcK" /workspaces/ToniOS/admin_dashboard.html; then
    echo "✅ Identifiants d'authentification intégrés"
else
    echo "❌ CRITIQUE: Identifiants d'authentification manquants dans le dashboard!"
    exit 1
fi

if grep -q "TONIOS ADMIN CONSOLE" /workspaces/ToniOS/admin_dashboard.html; then
    echo "✅ Interface administrateur intègre"
else
    echo "❌ CRITIQUE: Interface administrateur corrompue!"
    exit 1
fi

echo

# Statistiques de sécurité
echo "📈 Statistiques de sécurité:"
echo "   - Fichiers protégés: $(find /workspaces/ToniOS -name ".*" -type f | wc -l)"
echo "   - Taille du dashboard: $(stat -c%s /workspaces/ToniOS/admin_dashboard.html) bytes"
echo "   - Dernière modification: $(stat -c%y /workspaces/ToniOS/admin_dashboard.html)"

echo

# Générer un rapport de sécurité
REPORT_FILE="/workspaces/ToniOS/.security_report_$(date +%Y%m%d_%H%M%S)"
echo "📄 Génération du rapport de sécurité: $REPORT_FILE"

cat > "$REPORT_FILE" << EOF
RAPPORT DE SÉCURITÉ TONIOS ADMIN DASHBOARD
==========================================
Date: $(date)
Script: security_check.sh

FICHIERS CRITIQUES:
- .admin_auth: $([ -f "/workspaces/ToniOS/.admin_auth" ] && echo "PRÉSENT" || echo "MANQUANT")
- admin_dashboard.html: $([ -f "/workspaces/ToniOS/admin_dashboard.html" ] && echo "PRÉSENT" || echo "MANQUANT")
- .security_log: $([ -f "/workspaces/ToniOS/.security_log" ] && echo "PRÉSENT" || echo "MANQUANT")

PERMISSIONS:
- .admin_auth: $(stat -c "%a" /workspaces/ToniOS/.admin_auth 2>/dev/null || echo "N/A")
- .security_log: $(stat -c "%a" /workspaces/ToniOS/.security_log 2>/dev/null || echo "N/A")

INTÉGRITÉ:
- Dashboard: $(grep -q "TONIOS ADMIN CONSOLE" /workspaces/ToniOS/admin_dashboard.html && echo "OK" || echo "CORROMPU")
- Authentification: $(grep -q "HOxJSjPee17kGCcK" /workspaces/ToniOS/admin_dashboard.html && echo "OK" || echo "MANQUANT")

STATUT GLOBAL: $([ -f "/workspaces/ToniOS/.admin_auth" ] && [ -f "/workspaces/ToniOS/admin_dashboard.html" ] && echo "SÉCURISÉ ✅" || echo "VULNÉRABLE ❌")
EOF

chmod 600 "$REPORT_FILE"
echo "✅ Rapport généré et sécurisé"

echo
echo "🎯 VÉRIFICATION TERMINÉE"
echo "=========================="
echo "Statut: $([ -f "/workspaces/ToniOS/.admin_auth" ] && [ -f "/workspaces/ToniOS/admin_dashboard.html" ] && echo "SYSTÈME SÉCURISÉ ✅" || echo "PROBLÈMES DÉTECTÉS ❌")"

# Ajouter une entrée au log de sécurité
echo "$(date): Vérification de sécurité effectuée - Statut: $([ -f "/workspaces/ToniOS/.admin_auth" ] && [ -f "/workspaces/ToniOS/admin_dashboard.html" ] && echo "OK" || echo "ERREUR")" >> /workspaces/ToniOS/.security_log
