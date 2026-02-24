// Test de la fonction getCurrentUser côté serveur
const { getServerSession } = require('next-auth/next')
const { authOptions } = require('../lib/auth')

async function testCurrentUser() {
  try {
    console.log('🔍 TEST DE getCurrentUser()')
    console.log('============================')
    
    // Simuler une requête avec session
    console.log('⚠️  Note: Ce test ne peut pas simuler une vraie session NextAuth')
    console.log('   Il faut tester directement dans le navigateur')
    
    console.log('\n💡 SOLUTIONS POSSIBLES:')
    console.log('1. Vérifier que la session NextAuth contient le rôle')
    console.log('2. Vérifier que les cookies de session sont valides')
    console.log('3. Redémarrer le serveur de développement')
    console.log('4. Vider le cache du navigateur')
    
    console.log('\n🔧 COMMANDES À ESSAYER:')
    console.log('   • Ctrl+Shift+R (hard refresh)')
    console.log('   • Déconnexion puis reconnexion')
    console.log('   • Vérifier la console du navigateur')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

testCurrentUser()

