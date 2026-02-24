// Correction des URLs HTTP en dur qui causent l'alerte de sécurité
const fs = require('fs')
const path = require('path')

console.log('🔧 CORRECTION URLS HTTP → HTTPS')
console.log('================================\n')

console.log('🎯 PROBLÈME IDENTIFIÉ:')
console.log('----------------------')
console.log('❌ URLs HTTP en dur dans .env et le code')
console.log('❌ Chrome détecte ces URLs comme non sécurisées')
console.log('❌ Marquage automatique comme "site dangereux"')
console.log('')

// Lire le fichier .env
const envPath = path.join(__dirname, '..', '.env')
let envContent = fs.readFileSync(envPath, 'utf8')

console.log('🔍 CONTENU .ENV ACTUEL:')
console.log('-----------------------')
const httpLines = envContent.split('\n').filter(line => line.includes('http://'))
httpLines.forEach(line => {
  console.log(`❌ ${line}`)
})
console.log('')

// Corrections à appliquer
const corrections = [
  {
    search: 'NEXTAUTH_URL=http://localhost:3000',
    replace: 'NEXTAUTH_URL=https://localhost:3000',
    description: 'NextAuth URL → HTTPS'
  },
  {
    search: 'NEXT_PUBLIC_BASE_URL=http://localhost:3000',
    replace: 'NEXT_PUBLIC_BASE_URL=https://localhost:3000',
    description: 'Base URL publique → HTTPS'
  }
]

console.log('🛠️ CORRECTIONS APPLIQUÉES:')
console.log('---------------------------')

// Appliquer les corrections
corrections.forEach(correction => {
  if (envContent.includes(correction.search)) {
    envContent = envContent.replace(correction.search, correction.replace)
    console.log(`✅ ${correction.description}`)
    console.log(`   ${correction.search} → ${correction.replace}`)
  }
})

// Sauvegarder le fichier corrigé
fs.writeFileSync(envPath, envContent)
console.log('')
console.log('✅ Fichier .env mis à jour avec HTTPS')

// Vérifier les autres fichiers avec URLs HTTP
const filesToFix = [
  'app/(admin)/admin/orders/[id]/page.tsx',
  'app/debug/orders/page.tsx',
  'app/(admin)/admin/tickets/page.tsx',
  'app/api/debug/check-orders/route.ts'
]

console.log('')
console.log('🔧 FICHIERS À CORRIGER:')
console.log('-----------------------')

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath)
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8')
    const originalContent = content
    
    // Corrections dans le code
    content = content.replace(/http:\/\/localhost:3000/g, 'https://localhost:3000')
    content = content.replace(/'http:\/\/localhost:3000'/g, "'https://localhost:3000'")
    content = content.replace(/"http:\/\/localhost:3000"/g, '"https://localhost:3000"')
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content)
      console.log(`✅ ${filePath}`)
    }
  }
})

console.log('')
console.log('🌐 SOLUTION ALTERNATIVE POUR DÉVELOPPEMENT:')
console.log('===========================================')
console.log('')

console.log('💡 OPTION 1: HTTPS LOCAL AVEC CERTIFICAT AUTO-SIGNÉ')
console.log('----------------------------------------------------')
console.log('• npm install --save-dev @types/https-localhost')
console.log('• Utiliser mkcert pour certificat local')
console.log('• Configurer Next.js avec HTTPS custom')
console.log('')

console.log('💡 OPTION 2: DÉTECTION AUTOMATIQUE ENVIRONNEMENT')
console.log('------------------------------------------------')
console.log('• Utiliser HTTPS en production')
console.log('• Utiliser HTTP en développement local uniquement')
console.log('• Variable d\'environnement conditionnelle')
console.log('')

console.log('💡 OPTION 3: LOCALHOST HTTPS NATIF')
console.log('----------------------------------')
console.log('• Chrome: chrome://flags/#allow-insecure-localhost')
console.log('• Firefox: about:config → security.insecure_connection_text.enabled')
console.log('• Edge: edge://flags/#allow-insecure-localhost')
console.log('')

console.log('🎯 SOLUTION RECOMMANDÉE POUR PRODUCTION:')
console.log('========================================')
console.log('')
console.log('✅ Variables d\'environnement dynamiques:')
console.log('')
console.log('// next.config.js ou utils')
console.log('const getBaseUrl = () => {')
console.log('  if (process.env.NODE_ENV === "production") {')
console.log('    return "https://boutik-naka.com"')
console.log('  }')
console.log('  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"')
console.log('}')
console.log('')

console.log('🚀 RÉSULTATS ATTENDUS:')
console.log('======================')
console.log('✅ Suppression des URLs HTTP du code')
console.log('✅ Chrome ne détecte plus de contenu non sécurisé')
console.log('✅ Alerte de sécurité supprimée')
console.log('✅ Site marqué comme sûr')
console.log('')

console.log('⚠️ ATTENTION DÉVELOPPEMENT:')
console.log('===========================')
console.log('• Vous devrez peut-être accepter le certificat auto-signé')
console.log('• Ou utiliser les flags Chrome pour localhost')
console.log('• Ou revenir temporairement à HTTP pour le développement')
console.log('')

console.log('🔄 PROCHAINES ÉTAPES:')
console.log('---------------------')
console.log('1. Redémarrer le serveur de développement')
console.log('2. Tester l\'accès avec HTTPS')
console.log('3. Ajuster si nécessaire avec flags navigateur')
console.log('4. Déployer en production avec HTTPS natif')
console.log('')

console.log('✅ Correction des URLs HTTP terminée ! 🔒')
