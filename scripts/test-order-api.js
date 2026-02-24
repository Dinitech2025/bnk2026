const fetch = require('node-fetch')

async function testOrderAPI() {
  console.log('🧪 Test de l\'API des commandes publiques')
  console.log('=' .repeat(50))

  const testOrder = {
    customer: {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '0123456789',
      address: 'Test Address',
      city: 'Antananarivo'
    },
    items: [
      {
        id: 'test-subscription-1',
        name: 'Netflix Standard',
        price: 45000,
        quantity: 1,
        type: 'subscription',
        platform: {
          id: '1',
          name: 'Netflix',
          logo: '/logos/netflix.png'
        },
        duration: '1 mois',
        maxProfiles: 2,
        reservation: {
          offerId: 'clh0v2k6g0001l308abc123def', // ID d'offre fictif
          account: { id: 'account123' },
          profiles: [{ id: 'profile1' }, { id: 'profile2' }],
          autoSelected: true
        }
      }
    ],
    total: 45000,
    currency: 'Ar',
    paymentMethod: 'bank_transfer'
  }

  try {
    console.log('📤 Envoi de la commande de test...')
    
    const response = await fetch('http://localhost:3000/api/public/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ Commande créée avec succès!')
      console.log('📋 Détails:')
      console.log(`   • ID: ${result.orderId}`)
      console.log(`   • Numéro: ${result.orderNumber}`)
      console.log(`   • Message: ${result.message}`)
    } else {
      console.log('❌ Erreur lors de la création:')
      console.log(`   • Status: ${response.status}`)
      console.log(`   • Message: ${result.message}`)
      if (result.error) {
        console.log(`   • Erreur: ${result.error}`)
      }
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
    console.log('')
    console.log('💡 Assurez-vous que le serveur est démarré:')
    console.log('   npm run dev')
  }
}

testOrderAPI() 