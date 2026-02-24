const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixPaymentsNow() {
  console.log('🔧 Correction rapide des méthodes de paiement...\n')
  
  try {
    // 1. Vérifier l'état actuel
    const methodsCount = await prisma.paymentMethod.count()
    const providersCount = await prisma.paymentProvider.count()
    
    console.log(`📊 État actuel: ${methodsCount} méthodes, ${providersCount} fournisseurs`)
    
    // 2. Si pas de données, créer les essentiels
    if (methodsCount === 0) {
      console.log('🚀 Création des méthodes de base...')
      
      // Créer PayPal
      const paypalMethod = await prisma.paymentMethod.create({
        data: {
          code: 'paypal',
          name: 'Paiement en ligne',
          description: 'Paiement sécurisé en ligne via PayPal, cartes bancaires, Google Pay, etc.',
          type: 'PROVIDERS',
          icon: 'CreditCard',
          isActive: true,
          order: 1,
          apiEnabled: true
        }
      })
      
      // Créer fournisseurs PayPal
      await prisma.paymentProvider.createMany({
        data: [
          {
            paymentMethodId: paypalMethod.id,
            code: 'paypal_api',
            name: 'PayPal',
            description: 'Paiement avec compte PayPal',
            isActive: true,
            order: 1,
            settings: {
              environment: 'sandbox',
              clientId: process.env.PAYPAL_CLIENT_ID || '',
              clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
              currency: 'EUR'
            }
          },
          {
            paymentMethodId: paypalMethod.id,
            code: 'paypal_card',
            name: 'Carte bancaire',
            description: 'Paiement par carte via PayPal',
            isActive: true,
            order: 2,
            settings: {
              environment: 'sandbox',
              clientId: process.env.PAYPAL_CLIENT_ID || '',
              clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
              currency: 'EUR',
              cardOnly: true
            }
          }
        ]
      })
      
      // Créer autres méthodes
      await prisma.paymentMethod.createMany({
        data: [
          {
            code: 'mobile_money',
            name: 'Mobile Money',
            description: 'Paiement via portefeuille mobile',
            type: 'PROVIDERS',
            icon: 'Smartphone',
            isActive: true,
            order: 2
          },
          {
            code: 'bank_transfer',
            name: 'Virement bancaire',
            description: 'Paiement par virement bancaire',
            type: 'MANUAL',
            icon: 'Building',
            isActive: true,
            order: 3
          },
          {
            code: 'cash',
            name: 'Paiement espèce',
            description: 'Paiement en espèces lors de la livraison',
            type: 'MANUAL',
            icon: 'Banknote',
            isActive: true,
            order: 4
          }
        ]
      })
      
      console.log('✅ Méthodes créées')
    }
    
    // 3. Vérifier que PayPal a des fournisseurs actifs
    const paypalMethod = await prisma.paymentMethod.findUnique({
      where: { code: 'paypal' },
      include: { providers: true }
    })
    
    if (paypalMethod) {
      const activeProviders = paypalMethod.providers.filter(p => p.isActive).length
      console.log(`💳 PayPal: ${activeProviders}/${paypalMethod.providers.length} fournisseurs actifs`)
      
      if (activeProviders === 0 && paypalMethod.providers.length > 0) {
        // Activer au moins un fournisseur
        await prisma.paymentProvider.updateMany({
          where: { 
            paymentMethodId: paypalMethod.id,
            code: 'paypal_api'
          },
          data: { isActive: true }
        })
        console.log('✅ Fournisseur PayPal activé')
      }
    }
    
    // 4. Test de l'API
    console.log('\n🧪 Test de l\'API...')
    try {
      const response = await fetch('http://localhost:3001/api/payment-methods?amount=20000&currency=Ar')
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ API fonctionne - ${data.paymentMethods?.length || 0} méthodes retournées`)
        
        data.paymentMethods?.forEach(method => {
          const activeProviders = method.providers?.filter(p => p.isActive).length || 0
          console.log(`   • ${method.name} - ${method.isActive ? '✅' : '❌'} - ${activeProviders} fournisseurs`)
        })
        
        const paypalInList = data.paymentMethods?.find(m => m.code === 'paypal')
        if (paypalInList) {
          console.log(`🎯 PayPal trouvé dans la liste avec ${paypalInList.providers?.length || 0} fournisseurs`)
        } else {
          console.log(`❌ PayPal non trouvé dans la liste API`)
        }
      } else {
        const errorData = await response.json()
        console.log(`❌ API erreur ${response.status}: ${errorData.error}`)
      }
    } catch (error) {
      console.log(`⚠️  Impossible de tester l'API: ${error.message}`)
      console.log('   (Le serveur Next.js doit être démarré)')
    }
    
    // 5. Résumé final
    const finalMethods = await prisma.paymentMethod.count({ where: { isActive: true } })
    const finalProviders = await prisma.paymentProvider.count({ where: { isActive: true } })
    
    console.log(`\n🎉 Résultat final: ${finalMethods} méthodes actives, ${finalProviders} fournisseurs actifs`)
    
    // 6. Instructions
    console.log('\n📋 Instructions:')
    console.log('1. Redémarrez votre serveur Next.js si nécessaire')
    console.log('2. Allez sur http://localhost:3001/cart')
    console.log('3. Vous devriez voir "Paiement en ligne" avec PayPal et Carte bancaire')
    
    const hasPaypalConfig = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
    if (!hasPaypalConfig) {
      console.log('\n⚠️  Pour activer PayPal, ajoutez dans .env.local:')
      console.log('PAYPAL_CLIENT_ID=your_sandbox_client_id')
      console.log('PAYPAL_CLIENT_SECRET=your_sandbox_client_secret')
      console.log('PAYPAL_ENVIRONMENT=sandbox')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPaymentsNow()