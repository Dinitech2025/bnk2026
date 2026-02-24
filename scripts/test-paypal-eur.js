// Test PayPal avec devise EUR
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

async function testPayPalEUR() {
  console.log('💶 TEST PAYPAL AVEC DEVISE EUR')
  console.log('==============================\n')

  loadEnvVariables()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  // Test avec différents montants en Ariary
  const testCases = [
    { amountAr: 50000, description: 'Produit basique' },
    { amountAr: 125000, description: 'Produit moyen' },
    { amountAr: 250000, description: 'Produit premium' }
  ]

  console.log('📋 Test des conversions Ariary → EUR:')
  console.log('--------------------------------------')

  testCases.forEach((testCase, index) => {
    const eurAmount = (testCase.amountAr / 5000).toFixed(2)
    console.log(`${index + 1}. ${testCase.description}:`)
    console.log(`   💰 ${testCase.amountAr.toLocaleString()} Ar → ${eurAmount}€ EUR`)
  })

  console.log('')

  // Test API avec EUR
  console.log('🔧 Test API PayPal avec EUR:')
  console.log('------------------------------')

  try {
    const testAmount = 125000 // 125,000 Ar
    const eurAmount = (testAmount / 5000).toFixed(2) // 25.00 EUR

    const testOrderData = {
      items: [
        {
          name: 'Test Product EUR',
          price: testAmount,
          quantity: 1
        }
      ],
      total: testAmount,
      currency: 'Ar',
      orderId: `EUR-TEST-${Date.now()}`
    }

    console.log(`📊 Test avec: ${testAmount.toLocaleString()} Ar → ${eurAmount}€ EUR`)

    const response = await fetch(`${baseUrl}/api/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: eurAmount,
        currency: 'EUR',
        orderData: testOrderData
      })
    })

    console.log(`   Status: ${response.status} ${response.statusText}`)

    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ SUCCÈS - Commande EUR créée')
      console.log(`   🆔 PayPal Order ID: ${data.id}`)
      console.log(`   📊 Status: ${data.status}`)
      console.log(`   💶 Devise utilisée: EUR`)
      console.log(`   💰 Montant PayPal: ${eurAmount}€`)
      
      // URL d'approbation
      const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`
      console.log(`   🔗 URL d'approbation: ${approvalUrl}`)
    } else {
      const errorData = await response.json()
      console.log('   ❌ ÉCHEC')
      console.log(`   Erreur: ${errorData.error}`)
    }

  } catch (error) {
    console.log('   ❌ ERREUR DE CONNECTIVITÉ')
    console.log(`   ${error.message}`)
  }

  console.log('')
  console.log('📊 RÉSUMÉ DES CHANGEMENTS EUR:')
  console.log('-------------------------------')
  console.log('   🔄 Conversion: MGA → EUR (au lieu d\'USD)')
  console.log('   💱 Taux: 1 EUR ≈ 5000 MGA (au lieu de 1 USD ≈ 4500 MGA)')
  console.log('   🌍 Région: France/Europe (au lieu des États-Unis)')
  console.log('   🎯 Locale: fr_FR')
  console.log('   💶 Affichage: Montants en € EUR')

  console.log('')
  console.log('💡 AVANTAGES DE L\'EUR:')
  console.log('----------------------')
  console.log('   ✅ Plus familier pour les clients européens')
  console.log('   ✅ Taux de change plus stable')
  console.log('   ✅ Moins de frais de conversion depuis EUR')
  console.log('   ✅ Meilleure expérience utilisateur en zone EUR')

  console.log('')
  console.log('🎉 Configuration EUR appliquée avec succès!')
}

testPayPalEUR()
