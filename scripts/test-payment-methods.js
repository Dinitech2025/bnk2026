const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPaymentMethods() {
  try {
    console.log('🧪 Test des méthodes de paiement...\n')

    // 1. Tester l'API des méthodes de paiement
    console.log('📡 Test API /api/payment-methods')
    const testAmount = 25000
    const testCurrency = 'Ar'
    
    try {
      const response = await fetch(`http://localhost:3001/api/payment-methods?amount=${testAmount}&currency=${testCurrency}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ API fonctionne - ${data.paymentMethods?.length || 0} méthodes trouvées`)
        
        data.paymentMethods?.forEach(method => {
          console.log(`   • ${method.name} (${method.type}) - ${method.isActive ? 'Actif' : 'Inactif'}`)
          if (method.providers?.length > 0) {
            method.providers.forEach(provider => {
              console.log(`     └─ ${provider.name} - ${provider.isActive ? 'Actif' : 'Inactif'}`)
            })
          }
        })
      } else {
        console.log(`❌ API erreur: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Erreur API: ${error.message}`)
    }

    console.log('\n' + '─'.repeat(50))

    // 2. Vérifier directement dans la base de données
    console.log('\n💾 Vérification base de données')
    
    const methods = await prisma.paymentMethod.findMany({
      include: {
        providers: true
      },
      orderBy: { order: 'asc' }
    })

    console.log(`\n📊 ${methods.length} méthodes dans la BDD :`)
    
    methods.forEach(method => {
      const activeProviders = method.providers.filter(p => p.isActive).length
      const totalProviders = method.providers.length
      
      console.log(`\n🔸 ${method.name} (${method.code})`)
      console.log(`   Type: ${method.type}`)
      console.log(`   Statut: ${method.isActive ? '✅ Actif' : '❌ Inactif'}`)
      console.log(`   Fournisseurs: ${activeProviders}/${totalProviders} actifs`)
      
      if (method.providers.length > 0) {
        method.providers.forEach(provider => {
          console.log(`   └─ ${provider.name} (${provider.code}) - ${provider.isActive ? '✅' : '❌'}`)
        })
      }
    })

    console.log('\n' + '─'.repeat(50))

    // 3. Test spécifique PayPal
    console.log('\n💳 Test configuration PayPal')
    
    const paypalProvider = await prisma.paymentProvider.findFirst({
      where: { code: 'paypal_api' },
      include: { paymentMethod: true }
    })

    if (paypalProvider) {
      const settings = paypalProvider.settings || {}
      console.log(`✅ Fournisseur PayPal trouvé`)
      console.log(`   Méthode: ${paypalProvider.paymentMethod?.name}`)
      console.log(`   Statut: ${paypalProvider.isActive ? '✅ Actif' : '❌ Inactif'}`)
      console.log(`   Environnement: ${settings.environment || 'sandbox'}`)
      console.log(`   Client ID: ${settings.clientId ? '✅ Configuré' : '❌ Manquant'}`)
      console.log(`   Client Secret: ${settings.clientSecret ? '✅ Configuré' : '❌ Manquant'}`)
      
      // Test de création d'ordre PayPal
      if (settings.clientId && settings.clientSecret) {
        console.log('\n🧪 Test création ordre PayPal...')
        try {
          const testOrder = {
            amount: "10.00",
            currency: "EUR",
            orderData: {
              orderId: "TEST-" + Date.now(),
              items: [{ name: "Test Item", quantity: 1, price: 10 }]
            }
          }

          const createResponse = await fetch('http://localhost:3001/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testOrder)
          })

          if (createResponse.ok) {
            const orderData = await createResponse.json()
            console.log(`✅ Ordre PayPal créé: ${orderData.id}`)
          } else {
            const errorData = await createResponse.json()
            console.log(`❌ Erreur création ordre: ${errorData.error}`)
          }
        } catch (error) {
          console.log(`❌ Erreur test PayPal: ${error.message}`)
        }
      } else {
        console.log('⚠️  Configuration PayPal incomplète - impossible de tester')
      }
    } else {
      console.log('❌ Fournisseur PayPal non trouvé')
    }

    console.log('\n🏁 Test terminé !')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
if (require.main === module) {
  testPaymentMethods()
}