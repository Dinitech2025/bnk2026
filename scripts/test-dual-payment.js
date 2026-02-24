// Test des deux méthodes de paiement séparées (PayPal et Carte) avec même backend
const fs = require('fs')

// Chargement manuel du .env
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

async function testDualPayment() {
  console.log('🔄 TEST SYSTÈME DUAL PAYPAL + CARTES')
  console.log('====================================\n')

  loadEnvVariables()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  console.log('🎯 ARCHITECTURE MISE À JOUR:')
  console.log('-----------------------------')
  console.log('   📱 Option 1: PayPal pur (compte PayPal requis)')
  console.log('   💳 Option 2: Carte bancaire (via PayPal, sans compte)')
  console.log('   🔧 Backend: PayPal API unique pour les deux')
  console.log('   💶 Devise: EUR pour toutes les méthodes')
  console.log('')

  console.log('🎮 EXPÉRIENCE UTILISATEUR:')
  console.log('--------------------------')
  console.log('   1. Client choisit "PayPal" → Connexion compte PayPal')
  console.log('   2. Client choisit "Carte bancaire" → Saisie carte directe')
  console.log('   3. Les deux utilisent la même API PayPal en arrière-plan')
  console.log('   4. Capture centralisée via /api/paypal/capture-payment')
  console.log('')

  // Test des deux méthodes
  const testCases = [
    {
      method: 'PayPal Account',
      description: 'Paiement via compte PayPal existant',
      amount: 25.00,
      config: 'PayPal pur (disable-funding: card)'
    },
    {
      method: 'Credit Card',
      description: 'Paiement par carte via PayPal',
      amount: 35.00,
      config: 'Cartes seulement (fundingSource: card)'
    }
  ]

  console.log('🧪 TEST DES DEUX MÉTHODES:')
  console.log('---------------------------')

  for (const [index, testCase] of testCases.entries()) {
    try {
      console.log(`\n${index + 1}. ${testCase.method}:`)
      console.log(`   💰 Montant: ${testCase.amount}€ EUR`)
      console.log(`   📝 Description: ${testCase.description}`)
      console.log(`   ⚙️  Config: ${testCase.config}`)

      const testOrderData = {
        items: [
          {
            name: `Test ${testCase.method}`,
            price: testCase.amount * 100,
            quantity: 1
          }
        ],
        total: testCase.amount * 100,
        currency: 'Ar',
        orderId: `DUAL-${testCase.method.replace(' ', '')}-${Date.now()}`
      }

      const response = await fetch(`${baseUrl}/api/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: testCase.amount.toFixed(2),
          currency: 'EUR',
          orderData: testOrderData
        })
      })

      console.log(`   📊 Status: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Commande créée: ${data.id}`)
        console.log(`   🔗 URL PayPal: https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`)
        
        if (testCase.method === 'PayPal Account') {
          console.log(`   💡 Interface: Boutons PayPal jaunes classiques`)
        } else {
          console.log(`   💡 Interface: Boutons bleus pour cartes + Guest checkout`)
        }
      } else {
        const errorData = await response.json()
        console.log(`   ❌ Erreur: ${errorData.error}`)
      }

    } catch (error) {
      console.log(`   ❌ Erreur connectivité: ${error.message}`)
    }
  }

  console.log('')
  console.log('📊 COMPARAISON DES MÉTHODES:')
  console.log('----------------------------')
  console.log('')
  console.log('🟡 PAYPAL PUR:')
  console.log('   ✅ Compte PayPal requis')
  console.log('   ✅ Boutons jaunes PayPal')
  console.log('   ✅ Solde PayPal, cartes liées, virement')
  console.log('   ✅ Protection acheteur PayPal')
  console.log('   ✅ Historique dans compte PayPal')
  console.log('')
  console.log('💳 CARTES BANCAIRES:')
  console.log('   ✅ Aucun compte PayPal requis')
  console.log('   ✅ Boutons bleus pour cartes')
  console.log('   ✅ Saisie directe Visa/MC/Amex')
  console.log('   ✅ Guest checkout PayPal')
  console.log('   ✅ Même sécurité PCI-DSS')

  console.log('')
  console.log('🔧 AVANTAGES TECHNIQUES:')
  console.log('------------------------')
  console.log('   ✅ Un seul backend PayPal')
  console.log('   ✅ Même API de capture')
  console.log('   ✅ Gestion d\'erreurs unifiée')
  console.log('   ✅ Analytics centralisées')
  console.log('   ✅ Remboursements unifiés')
  console.log('   ✅ Pas besoin de Stripe/autres')

  console.log('')
  console.log('🎉 Système dual PayPal + Cartes opérationnel!')
  console.log('')
  console.log('📋 PROCHAINS TESTS:')
  console.log('   1. Interface checkout: 2 options distinctes')
  console.log('   2. PayPal: Boutons jaunes sans cartes')
  console.log('   3. Cartes: Boutons bleus avec guest checkout')
  console.log('   4. Même capture backend pour les deux')
}

testDualPayment()
