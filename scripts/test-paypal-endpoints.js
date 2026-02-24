// Test des endpoints PayPal de l'application
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

async function testApplicationEndpoints() {
  console.log('🔧 TEST DES ENDPOINTS PAYPAL DE L\'APPLICATION')
  console.log('==============================================\n')

  loadEnvVariables()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  console.log(`🎯 Test sur: ${baseUrl}`)
  console.log('')

  // Test de données de commande d'exemple
  const testOrderData = {
    items: [
      {
        name: 'Produit Test',
        price: 25.00,
        quantity: 1
      }
    ],
    total: 25.00,
    currency: 'USD',
    orderId: 'TEST-' + Date.now()
  }

  try {
    // Test 1: Endpoint create-order
    console.log('1️⃣ Test /api/paypal/create-order')
    const createResponse = await fetch(`${baseUrl}/api/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: '25.00',
        currency: 'USD',
        orderData: testOrderData
      })
    })

    console.log(`   Status: ${createResponse.status} ${createResponse.statusText}`)

    if (createResponse.ok) {
      const createData = await createResponse.json()
      console.log('   ✅ Création réussie')
      console.log(`   Order ID: ${createData.id}`)
      console.log(`   Status: ${createData.status}`)

      // Test 2: Endpoint capture-payment (simulation)
      console.log('\n2️⃣ Test /api/paypal/capture-payment (simulation)')
      const captureResponse = await fetch(`${baseUrl}/api/paypal/capture-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: createData.id,
          orderData: testOrderData
        })
      })

      console.log(`   Status: ${captureResponse.status} ${captureResponse.statusText}`)
      
      if (captureResponse.ok) {
        const captureData = await captureResponse.json()
        console.log('   ✅ Endpoint accessible')
        console.log(`   Response: ${JSON.stringify(captureData).substring(0, 100)}...`)
      } else {
        const captureError = await captureResponse.json()
        console.log('   ⚠️  Erreur attendue (ordre non approuvé)')
        console.log(`   Erreur: ${captureError.error}`)
      }

    } else {
      const createError = await createResponse.json()
      console.log('   ❌ Création échouée')
      console.log(`   Erreur: ${createError.error}`)
    }

  } catch (error) {
    console.log('❌ Erreur de connectivité')
    console.log(`   ${error.message}`)
    console.log('\n💡 Le serveur de développement est-il démarré ?')
    console.log('   npm run dev')
  }

  console.log('')
  console.log('🎉 Test des endpoints terminé!')
}

testApplicationEndpoints()
