// Test rapide des méthodes de paiement
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testNow() {
  console.log('🔍 Test rapide...\n')
  
  try {
    // 1. Compter les méthodes dans la BDD
    const methodsCount = await prisma.paymentMethod.count()
    console.log(`📊 Méthodes dans la BDD: ${methodsCount}`)
    
    if (methodsCount === 0) {
      console.log('❌ Aucune méthode trouvée - Exécution du setup...')
      
      // Créer rapidement les méthodes de base
      await prisma.paymentMethod.createMany({
        data: [
          {
            code: 'paypal',
            name: 'Paiement en ligne',
            description: 'PayPal, cartes bancaires, Google Pay',
            type: 'PROVIDERS',
            icon: 'CreditCard',
            isActive: true,
            order: 1,
            apiEnabled: true
          },
          {
            code: 'cash',
            name: 'Paiement espèce',
            description: 'Paiement à la livraison',
            type: 'MANUAL',
            icon: 'Banknote',
            isActive: true,
            order: 2,
            apiEnabled: false
          }
        ]
      })
      
      // Créer les fournisseurs PayPal
      const paypalMethod = await prisma.paymentMethod.findUnique({
        where: { code: 'paypal' }
      })
      
      if (paypalMethod) {
        await prisma.paymentProvider.create({
          data: {
            code: 'paypal_api',
            name: 'PayPal',
            description: 'Paiement PayPal sécurisé',
            paymentMethodId: paypalMethod.id,
            isActive: true,
            order: 1,
            settings: {
              environment: 'sandbox',
              clientId: process.env.PAYPAL_CLIENT_ID || '',
              clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
              currency: 'EUR'
            }
          }
        })
      }
      
      console.log('✅ Méthodes créées')
    }
    
    // 2. Tester l'API
    console.log('\n🌐 Test API...')
    try {
      const response = await fetch('http://localhost:3001/api/payment-methods?amount=20000&currency=Ar')
      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ API OK - ${data.paymentMethods?.length || 0} méthodes`)
        data.paymentMethods?.forEach(method => {
          console.log(`   • ${method.name} - ${method.providers?.length || 0} fournisseurs`)
        })
      } else {
        console.log(`❌ API erreur: ${data.error}`)
      }
    } catch (error) {
      console.log(`❌ Erreur réseau: ${error.message}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNow()