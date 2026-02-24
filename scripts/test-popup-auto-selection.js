const { execSync } = require('child_process')

console.log('🤖 Test du popup avec sélection automatique')
console.log('=' .repeat(50))

try {
  // Démarrer le serveur en arrière-plan
  console.log('🚀 Démarrage du serveur Next.js...')
  const serverProcess = require('child_process').spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  })

  // Attendre que le serveur démarre
  console.log('⏳ Attente du démarrage du serveur (10 secondes)...')
  
  setTimeout(() => {
    console.log('\n📋 Instructions pour tester la sélection automatique:')
    console.log('1. Ouvrez votre navigateur à http://localhost:3000')
    console.log('2. Allez sur la page des abonnements (/subscriptions)')
    console.log('3. Cliquez sur "S\'abonner" pour une offre')
    console.log('4. Observez la sélection automatique dans le popup')
    console.log('\n🎯 Algorithme de sélection:')
    console.log('• Sélection du compte avec le minimum de profils libres nécessaires')
    console.log('• En cas d\'égalité, privilégie le compte avec moins de profils totaux')
    console.log('• Sélection automatique des profils par ordre de priorité')
    console.log('• Le profil "Principal" est toujours sélectionné en premier')
    console.log('\n🔍 Vérifications à faire:')
    console.log('• Le compte optimal est automatiquement sélectionné')
    console.log('• Les profils sont sélectionnés automatiquement')
    console.log('• L\'icône couronne (👑) apparaît sur les éléments auto-sélectionnés')
    console.log('• Le message de confirmation apparaît')
    console.log('• Vous pouvez toujours modifier la sélection manuellement')
    console.log('\n💡 Exemples de tests:')
    console.log('• Netflix Standard (2 profils) → devrait choisir netflix2@test.com (2/2 profils)')
    console.log('• Netflix Premium (4 profils) → devrait choisir netflix1@test.com (4/4 profils)')
    console.log('• Spotify Premium (1 profil) → devrait choisir le compte avec le moins de gaspillage')
    
    console.log('\n✨ Appuyez sur Ctrl+C pour arrêter le serveur')
  }, 10000)

  // Gérer l'arrêt propre
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...')
    serverProcess.kill('SIGTERM')
    process.exit(0)
  })

  // Afficher les logs du serveur
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString()
    if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
      console.log('✅ Serveur prêt!')
    }
  })

  serverProcess.stderr.on('data', (data) => {
    const error = data.toString()
    if (error.includes('Error') || error.includes('error')) {
      console.error('❌ Erreur serveur:', error)
    }
  })

} catch (error) {
  console.error('❌ Erreur lors du démarrage:', error.message)
} 