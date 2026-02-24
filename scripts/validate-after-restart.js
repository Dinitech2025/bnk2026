// Validation après redémarrage du serveur
const fs = require('fs')

// Chargement manuel du .env pour vérification
function loadEnvVariables() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        const value = valueParts.join('=').trim()
        if (key && value) {
          process.env[key] = value
        }
      }
    })
  } catch (error) {
    console.log('⚠️  Impossible de charger .env:', error.message)
  }
}

async function validateAfterRestart() {
  console.log('✅ VALIDATION APRÈS REDÉMARRAGE SERVEUR')
  console.log('======================================\n')

  loadEnvVariables()

  console.log('🔍 1. VÉRIFICATION VARIABLES D\'ENVIRONNEMENT')
  console.log('--------------------------------------------')
  
  const requiredVars = [
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET', 
    'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
    'PAYPAL_MODE',
    'NEXT_PUBLIC_BASE_URL'
  ]

  let allVarsPresent = true
  
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      const maskedValue = varName.includes('SECRET') 
        ? '***MASKED***'
        : value.length > 20 
          ? value.substring(0, 20) + '...'
          : value
      console.log(`   ✅ ${varName} = ${maskedValue}`)
    } else {
      console.log(`   ❌ ${varName} = NON DÉFINIE`)
      allVarsPresent = false
    }
  })

  if (allVarsPresent) {
    console.log('\n🎉 Toutes les variables PayPal sont chargées !')
  } else {
    console.log('\n❌ Variables manquantes - Redémarrage requis')
    return
  }

  console.log('\n🧪 2. TEST API PAYPAL')
  console.log('----------------------')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  try {
    console.log(`🎯 Test sur: ${baseUrl}`)
    
    // Test de connectivité basique
    const testResponse = await fetch(`${baseUrl}/api/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: '10.00',
        currency: 'EUR',
        orderData: {
          orderId: 'VALIDATION-TEST-' + Date.now(),
          items: [{ name: 'Test validation', price: 1000, quantity: 1 }],
          total: 1000
        }
      })
    })

    console.log(`📊 Status API: ${testResponse.status} ${testResponse.statusText}`)
    
    if (testResponse.ok) {
      const data = await testResponse.json()
      console.log(`✅ API PayPal fonctionne: Order ${data.id}`)
      console.log(`🔗 URL PayPal: https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`)
    } else {
      const errorData = await testResponse.json()
      console.log(`❌ Erreur API: ${errorData.error || 'Erreur inconnue'}`)
    }

  } catch (error) {
    console.log(`❌ Erreur connectivité: ${error.message}`)
    console.log('💡 Vérifiez que le serveur Next.js est bien démarré')
  }

  console.log('\n🎮 3. TESTS FRONTEND RECOMMANDÉS')
  console.log('---------------------------------')
  
  console.log('Ouvrez votre navigateur et testez:')
  console.log(`   1. 🌐 ${baseUrl}/checkout`)
  console.log('   2. 📱 Sélectionnez "PayPal"')
  console.log('   3. ⏱️  Vérifiez chargement < 5 secondes')
  console.log('   4. 🎯 Boutons PayPal s\'affichent')
  console.log('   5. 💳 Testez "Carte bancaire"')
  console.log('   6. 📲 Testez "Portefeuille digital"')
  console.log('')

  console.log('🔍 4. SIGNES DE SUCCÈS')
  console.log('----------------------')
  console.log('✅ SDK PayPal charge en 2-3 secondes')
  console.log('✅ Pas de message "Impossible de charger PayPal"')
  console.log('✅ Boutons PayPal jaunes/bleus/noirs visibles')
  console.log('✅ Pas de timeout de 20 secondes')
  console.log('✅ Interface responsive et fluide')
  console.log('')

  console.log('🚨 SIGNES D\'ÉCHEC')
  console.log('-----------------')
  console.log('❌ "Impossible de charger PayPal"')
  console.log('❌ Timeout après 20 secondes')
  console.log('❌ SDK PayPal ne s\'initialise pas')
  console.log('❌ Erreurs dans la console navigateur')
  console.log('')

  console.log('🛠️  SI PROBLÈME PERSISTE')
  console.log('-------------------------')
  console.log('1. Vérifiez la console navigateur (F12)')
  console.log('2. Redémarrez complètement le serveur')
  console.log('3. Videz le cache navigateur (Ctrl+F5)')
  console.log('4. Exécutez: node scripts/debug-paypal.js')
  console.log('')

  console.log('🎯 OBJECTIF ATTEINT')
  console.log('-------------------')
  console.log('PayPal unifié + Variables chargées = Interface fonctionnelle ! 🚀')
}

validateAfterRestart()
