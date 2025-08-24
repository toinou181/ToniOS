// Test rapide des fonctions d'authentification ToniOS
console.log('=== TEST SYSTÈME D\'AUTHENTIFICATION TONIOS ===');

// Test 1: Vérifier les fonctions principales
console.log('\n1. Vérification des fonctions principales:');
console.log('✓ registerUser:', typeof registerUser === 'function');
console.log('✓ loginUser:', typeof loginUser === 'function');
console.log('✓ quickLogin:', typeof quickLogin === 'function');
console.log('✓ logout:', typeof logout === 'function');
console.log('✓ checkAutoLogin:', typeof checkAutoLogin === 'function');

// Test 2: Vérifier les fonctions de formulaire
console.log('\n2. Vérification des fonctions de formulaire:');
console.log('✓ handleLogin:', typeof handleLogin === 'function');
console.log('✓ handleRegister:', typeof handleRegister === 'function');
console.log('✓ showLoginForm:', typeof showLoginForm === 'function');
console.log('✓ showRegisterForm:', typeof showRegisterForm === 'function');

// Test 3: Vérifier les fonctions utilitaires
console.log('\n3. Vérification des fonctions utilitaires:');
console.log('✓ saveUser:', typeof saveUser === 'function');
console.log('✓ loadUser:', typeof loadUser === 'function');
console.log('✓ showUserList:', typeof showUserList === 'function');
console.log('✓ getUserName:', typeof getUserName === 'function');

// Test 4: Vérifier l'état initial
console.log('\n4. État initial:');
console.log('✓ currentSession:', currentSession);
console.log('✓ allUsers:', Object.keys(allUsers).length, 'utilisateurs chargés');

// Test 5: Test session démo
console.log('\n5. Test session démo:');
try {
    quickLogin('demo');
    if (currentSession && currentSession.username.startsWith('Démo_')) {
        console.log('✅ Session démo créée avec succès:', currentSession.username);
    } else {
        console.log('❌ Échec création session démo');
    }
} catch (error) {
    console.log('❌ Erreur session démo:', error.message);
}

// Test 6: Test inscription
console.log('\n6. Test inscription:');
try {
    const result = registerUser('TestUser', 'password123', false);
    if (result && result.success) {
        console.log('✅ Inscription test réussie');
    } else {
        console.log('❌ Échec inscription test');
    }
} catch (error) {
    console.log('❌ Erreur inscription:', error.message);
}

// Test 7: Test connexion
console.log('\n7. Test connexion:');
try {
    logout(); // Se déconnecter d'abord
    const result = loginUser('TestUser', 'password123', false);
    if (result && result.success) {
        console.log('✅ Connexion test réussie');
    } else {
        console.log('❌ Échec connexion test');
    }
} catch (error) {
    console.log('❌ Erreur connexion:', error.message);
}

console.log('\n=== FIN DES TESTS ===');
