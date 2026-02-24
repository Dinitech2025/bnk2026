// Configuration des environnements de développement
const fs = require('fs')
const path = require('path')

console.log('🔧 CONFIGURATION ENVIRONNEMENT DÉVELOPPEMENT')
console.log('=============================================\n')

const envPath = path.join(__dirname, '..', '.env')

console.log('🎯 CHOIX D\'ENVIRONNEMENT:')
console.log('=========================')
console.log('')
console.log('1. 🌐 HTTP (Recommandé pour développement)')
console.log('   ✅ Pas d\'alertes de certificat')
console.log('   ✅ Configuration simple')
console.log('   ❌ Peut déclencher alertes de sécurité Chrome')
console.log('')
console.log('2. 🔒 HTTPS (Recommandé pour production)')
console.log('   ✅ Sécurisé et conforme')
console.log('   ✅ Pas d\'alertes de sécurité')
console.log('   ❌ Nécessite certificat auto-signé en local')
console.log('')

// Configuration HTTP pour développement
const httpConfig = `# Base de données
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDFKWkE2QlhFUFhUTTJQSDdYTlExWjBOODQiLCJ0ZW5hbnRfaWQiOiJhYzc4ZmU4YWI2MzBkZTNhOWI4ZThmMjA0M2QwNDY5NDYwOWQxNDhmNzgyZDE5MzY3MjM3ODMwZDVkNTI3NWQxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNGMxZWZmZDMtNWI0My00NzhhLWIwOGQtZDJmN2RiNGUzZWU0In0.aHGFESZ8psE9mxW3Wj7UHscLc37eN3wdPQhDdli_P8U"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL=http://localhost:3000

# URLs de base
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# PayPal Configuration
PAYPAL_CLIENT_ID=ARhWb68VmOrhIvTOuoLjMgVKwmz-bsQ4gZEKCqf7ynUVrmILXF8UH7Z8xxSjhxdSdUaC9fK8LjA8BbYj
PAYPAL_CLIENT_SECRET=ELh2KWbUhHaDJWW5k0hU96IZpBZXcL4yQgLVGmxnfTi0pz37zl8nTjbvBOhN-9pF7bP9qZ3E8sY4D5X7
NEXT_PUBLIC_PAYPAL_CLIENT_ID=ARhWb68VmOrhIvTOuoLjMgVKwmz-bsQ4gZEKCqf7ynUVrmILXF8UH7Z8xxSjhxdSdUaC9fK8LjA8BbYj
PAYPAL_MODE=sandbox

# Autres configurations...`

// Configuration HTTPS pour développement
const httpsConfig = httpConfig.replace(/http:\/\/localhost:3000/g, 'https://localhost:3000')

console.log('💻 CONFIGURATION HTTP (Développement Simple):')
console.log('==============================================')
console.log('NEXTAUTH_URL=http://localhost:3000')
console.log('NEXT_PUBLIC_BASE_URL=http://localhost:3000')
console.log('')

console.log('🔒 CONFIGURATION HTTPS (Sécurisé):')
console.log('==================================')
console.log('NEXTAUTH_URL=https://localhost:3000')
console.log('NEXT_PUBLIC_BASE_URL=https://localhost:3000')
console.log('')

console.log('⚠️  POUR UTILISER HTTPS EN DÉVELOPPEMENT:')
console.log('=========================================')
console.log('')
console.log('Option 1: mkcert (Recommandé)')
console.log('------------------------------')
console.log('npm install -g mkcert')
console.log('mkcert -install')
console.log('mkcert localhost 127.0.0.1 ::1')
console.log('')

console.log('Option 2: Flags Chrome')
console.log('----------------------')
console.log('chrome --ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content')
console.log('Ou chrome://flags/#allow-insecure-localhost → Enabled')
console.log('')

console.log('Option 3: Flags Firefox')
console.log('-----------------------')
console.log('about:config → security.insecure_connection_text.enabled → false')
console.log('')

console.log('🚀 RECOMMANDATION POUR VOTRE CAS:')
console.log('=================================')
console.log('')
console.log('Pour résoudre immédiatement l\'alerte Google Safe Browsing :')
console.log('')
console.log('1. 🔄 Garder HTTP en développement')
console.log('2. 🛡️ Utiliser HTTPS en production uniquement')
console.log('3. 🎯 Ajouter détection dynamique d\'environnement')
console.log('')

console.log('Cela permettra de :')
console.log('✅ Éliminer les URLs HTTP du code de production')
console.log('✅ Garder la simplicité en développement')
console.log('✅ Supprimer l\'alerte de sécurité Chrome')
console.log('')

// Fonction pour choisir la configuration
function chooseConfiguration(useHttps = false) {
  const config = useHttps ? httpsConfig : httpConfig
  
  try {
    // Backup de l'ancien fichier
    if (fs.existsSync(envPath)) {
      fs.writeFileSync(envPath + '.backup', fs.readFileSync(envPath, 'utf8'))
      console.log('✅ Sauvegarde .env créée')
    }
    
    // Écrire la nouvelle configuration
    fs.writeFileSync(envPath, config)
    console.log(`✅ Configuration ${useHttps ? 'HTTPS' : 'HTTP'} appliquée`)
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

console.log('🎯 CONFIGURATION ACTUELLE MAINTENUE')
console.log('===================================')
console.log('Le fichier .env garde sa configuration HTTPS actuelle.')
console.log('Si vous avez des problèmes de certificat, utilisez les flags Chrome.')
console.log('')

console.log('📋 ACTIONS RECOMMANDÉES:')
console.log('========================')
console.log('1. Redémarrer le serveur de développement')
console.log('2. Tester avec Chrome + flags si nécessaire')
console.log('3. Vérifier que l\'alerte de sécurité a disparu')
console.log('4. Déployer en production avec HTTPS natif')
console.log('')

console.log('✅ Configuration d\'environnement prête ! 🚀')
