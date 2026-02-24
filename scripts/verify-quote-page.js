const fs = require('fs')
const path = require('path')

console.log('🔍 Vérification de la page de devis...\n')

const pagePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'quotes', '[id]', 'page.tsx')
const oldPagePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'quotes', '[id]', 'page-old.tsx')

try {
  // Vérifier que le nouveau fichier existe
  if (!fs.existsSync(pagePath)) {
    console.log('❌ Le fichier page.tsx n\'existe pas!')
    process.exit(1)
  }
  console.log('✅ Le fichier page.tsx existe')

  // Lire le contenu
  const content = fs.readFileSync(pagePath, 'utf8')

  // Vérifications
  const checks = [
    {
      name: 'Import UnifiedQuoteMessages',
      test: content.includes('UnifiedQuoteMessages'),
      expected: true
    },
    {
      name: 'Fonction AdminQuoteDetailPage',
      test: content.includes('export default function AdminQuoteDetailPage()'),
      expected: true
    },
    {
      name: 'Utilisation du composant unifié',
      test: content.includes('<UnifiedQuoteMessages'),
      expected: true
    },
    {
      name: 'Pas de QuoteMessage (ancien système)',
      test: !content.includes('quoteMessage.create'),
      expected: true
    },
    {
      name: 'Taille du fichier (< 500 lignes)',
      test: content.split('\n').length < 500,
      expected: true
    }
  ]

  console.log('\n📋 Vérifications:')
  let allPassed = true

  checks.forEach(check => {
    const status = check.test === check.expected ? '✅' : '❌'
    console.log(`${status} ${check.name}`)
    if (check.test !== check.expected) {
      allPassed = false
    }
  })

  // Statistiques
  const lines = content.split('\n').length
  console.log(`\n📊 Statistiques:`)
  console.log(`   Lignes: ${lines}`)
  console.log(`   Taille: ${(content.length / 1024).toFixed(2)} KB`)

  // Vérifier l'ancien fichier
  if (fs.existsSync(oldPagePath)) {
    console.log(`\n⚠️ L'ancien fichier page-old.tsx existe toujours`)
    console.log(`   Vous pouvez le supprimer après vérification`)
  }

  if (allPassed) {
    console.log('\n✅ TOUT EST CORRECT!')
    console.log('🎉 La nouvelle page unifiée est en place')
    console.log('\n💡 Prochaines étapes:')
    console.log('   1. Videz le cache du navigateur (Ctrl+Shift+R)')
    console.log('   2. Rechargez la page /admin/quotes/[id]')
    console.log('   3. Vous devriez voir la nouvelle interface moderne')
  } else {
    console.log('\n❌ Des problèmes ont été détectés')
    console.log('Vérifiez le fichier page.tsx')
  }

} catch (error) {
  console.error('❌ Erreur:', error.message)
  process.exit(1)
}

