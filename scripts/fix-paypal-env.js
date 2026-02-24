const fs = require('fs')

console.log('🔧 RÉPARATION CONFIGURATION PAYPAL')
console.log('===================================\n')

// Lire le fichier .env
let envContent = ''
try {
  envContent = fs.readFileSync('.env', 'utf8')
  console.log('✅ Fichier .env lu avec succès')
} catch (error) {
  console.log('❌ Erreur lecture .env:', error.message)
  process.exit(1)
}

// Extraire les variables PayPal existantes
const lines = envContent.split('\n')
let hasPublicClientId = false
let hasPrivateClientId = false
let hasClientSecret = false
let hasMode = false
let hasBaseUrl = false
let publicClientIdValue = ''

lines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_PAYPAL_CLIENT_ID=')) {
    hasPublicClientId = true
    publicClientIdValue = line.split('=')[1]
  }
  if (line.startsWith('PAYPAL_CLIENT_ID=')) {
    hasPrivateClientId = true
  }
  if (line.startsWith('PAYPAL_CLIENT_SECRET=')) {
    hasClientSecret = true
  }
  if (line.startsWith('PAYPAL_MODE=')) {
    hasMode = true
  }
  if (line.startsWith('NEXT_PUBLIC_BASE_URL=')) {
    hasBaseUrl = true
  }
})

console.log('\n📋 ÉTAT ACTUEL:')
console.log(`   NEXT_PUBLIC_PAYPAL_CLIENT_ID: ${hasPublicClientId ? '✅' : '❌'}`)
console.log(`   PAYPAL_CLIENT_ID: ${hasPrivateClientId ? '✅' : '❌'}`)
console.log(`   PAYPAL_CLIENT_SECRET: ${hasClientSecret ? '✅' : '❌'}`)
console.log(`   PAYPAL_MODE: ${hasMode ? '✅' : '❌'}`)
console.log(`   NEXT_PUBLIC_BASE_URL: ${hasBaseUrl ? '✅' : '❌'}`)

// Corrections nécessaires
const corrections = []

if (!hasPrivateClientId && publicClientIdValue) {
  corrections.push(`PAYPAL_CLIENT_ID=${publicClientIdValue}`)
  console.log('\n🔧 Ajout de PAYPAL_CLIENT_ID (copié depuis NEXT_PUBLIC_PAYPAL_CLIENT_ID)')
}

if (!hasBaseUrl) {
  corrections.push('NEXT_PUBLIC_BASE_URL=http://localhost:3000')
  console.log('🔧 Ajout de NEXT_PUBLIC_BASE_URL')
}

if (corrections.length > 0) {
  console.log('\n✏️  LIGNES À AJOUTER:')
  corrections.forEach(line => console.log(`   ${line}`))
  
  // Ajouter les corrections au fichier
  const newContent = envContent + '\n' + corrections.join('\n') + '\n'
  
  try {
    fs.writeFileSync('.env', newContent)
    console.log('\n✅ Fichier .env mis à jour avec succès!')
  } catch (error) {
    console.log('\n❌ Erreur écriture .env:', error.message)
    console.log('\n📝 AJOUTEZ MANUELLEMENT CES LIGNES AU FICHIER .env:')
    corrections.forEach(line => console.log(line))
  }
} else {
  console.log('\n✅ Aucune correction nécessaire - Configuration PayPal complète!')
}

console.log('\n🔄 REDÉMARREZ LE SERVEUR DE DÉVELOPPEMENT après ces modifications')
console.log('   npm run dev')
