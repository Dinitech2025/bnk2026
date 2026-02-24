// Test direct de l'API PayPal
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

async function testPayPalDirectly() {
  console.log('🧪 TEST DIRECT API PAYPAL')
  console.log('=========================\n')

  // Charger les variables du .env
  loadEnvVariables()

  // Récupération des variables
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const mode = process.env.PAYPAL_MODE || 'sandbox'
  
  console.log('📋 Variables chargées:')
  console.log(`   PAYPAL_CLIENT_ID: ${clientId ? '✅ ' + clientId.substring(0, 10) + '...' : '❌ Non définie'}`)
  console.log(`   PAYPAL_CLIENT_SECRET: ${clientSecret ? '✅ ' + clientSecret.substring(0, 10) + '...' : '❌ Non définie'}`)
  console.log(`   PAYPAL_MODE: ${mode}`)
  console.log('')

  if (!clientId || !clientSecret) {
    console.log('❌ Variables PayPal manquantes - Impossible de continuer')
    console.log('🔄 Redémarrez le serveur de développement: npm run dev')
    return
  }

  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'

  console.log(`🎯 Test sur: ${baseUrl}`)
  console.log('')

  try {
    // Test 1: Authentification
    console.log('1️⃣ Test d\'authentification...')
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    })

    if (!authResponse.ok) {
      const authError = await authResponse.json()
      console.log('❌ Authentification échouée')
      console.log(`   Status: ${authResponse.status}`)
      console.log(`   Erreur: ${authError.error_description || authError.error}`)
      return
    }

    const authData = await authResponse.json()
    console.log('✅ Authentification réussie')
    console.log(`   Access Token: ${authData.access_token.substring(0, 20)}...`)
    console.log(`   Expires in: ${authData.expires_in}s`)
    console.log('')

    // Test 2: Création d'une commande test
    console.log('2️⃣ Test de création de commande...')
    const testOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: '10.00'
        },
        description: 'Test BNK - Commande de test',
        custom_id: 'TEST-' + Date.now(),
        invoice_id: `BNK-TEST-${Date.now()}`,
      }],
      application_context: {
        brand_name: 'BNK E-commerce TEST',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: 'http://localhost:3000/order-success',
        cancel_url: 'http://localhost:3000/checkout'
      }
    }

    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder)
    })

    if (orderResponse.ok) {
      const orderData = await orderResponse.json()
      console.log('✅ Création de commande réussie')
      console.log(`   Order ID: ${orderData.id}`)
      console.log(`   Status: ${orderData.status}`)
      console.log(`   Links: ${orderData.links?.length || 0} liens disponibles`)
      
      // Trouver le lien d'approbation
      const approveLink = orderData.links?.find(link => link.rel === 'approve')
      if (approveLink) {
        console.log(`   Approve URL: ${approveLink.href.substring(0, 50)}...`)
      }
    } else {
      const orderError = await orderResponse.json()
      console.log('❌ Création de commande échouée')
      console.log(`   Status: ${orderResponse.status}`)
      console.log(`   Erreur: ${orderError.message || orderError.error}`)
      if (orderError.details) {
        orderError.details.forEach(detail => {
          console.log(`   Detail: ${detail.description}`)
        })
      }
    }

  } catch (error) {
    console.log('❌ Erreur de connectivité')
    console.log(`   ${error.message}`)
  }

  console.log('')
  console.log('🎉 Test terminé!')
}

testPayPalDirectly()
