const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function quickSetupPayments() {
  try {
    console.log('⚡ Configuration rapide des méthodes de paiement...')

    // Supprimer les anciennes données pour repartir proprement
    await prisma.paymentProvider.deleteMany({})
    await prisma.paymentMethod.deleteMany({})
    
    console.log('🧹 Anciennes données supprimées')

    // 1. Créer la méthode PayPal avec ses fournisseurs
    const paypalMethod = await prisma.paymentMethod.create({
      data: {
        code: 'paypal',
        name: 'Paiement en ligne',
        description: 'Paiement sécurisé en ligne via PayPal, cartes bancaires, Google Pay, etc.',
        type: 'PROVIDERS',
        icon: 'CreditCard',
        isActive: true,
        order: 1,
        apiEnabled: true,
        providers: {
          create: [
            {
              code: 'paypal_api',
              name: 'PayPal',
              description: 'Paiement avec compte PayPal',
              isActive: true,
              order: 1,
              settings: {
                environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
                clientId: process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
                currency: 'EUR',
                conversionRate: 5000,
                autoConvert: true
              }
            },
            {
              code: 'paypal_card',
              name: 'Carte bancaire',
              description: 'Paiement par carte bancaire via PayPal (sans compte)',
              isActive: true,
              order: 2,
              settings: {
                environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
                clientId: process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
                currency: 'EUR',
                conversionRate: 5000,
                autoConvert: true,
                cardOnly: true
              }
            }
          ]
        }
      }
    })
    console.log('✅ Méthode PayPal créée avec 2 fournisseurs')

    // 2. Créer Mobile Money
    const mobileMethod = await prisma.paymentMethod.create({
      data: {
        code: 'mobile_money',
        name: 'Mobile Money',
        description: 'Paiement via portefeuille mobile',
        type: 'PROVIDERS',
        icon: 'Smartphone',
        isActive: true,
        order: 2,
        apiEnabled: false,
        providers: {
          create: [
            {
              code: 'mvola',
              name: 'MVola',
              description: 'Paiement via MVola (Telma)',
              isActive: false, // Désactivé en attendant l'API
              order: 1,
              settings: {
                apiUrl: '',
                merchantId: '',
                secretKey: ''
              }
            },
            {
              code: 'orange_money',
              name: 'Orange Money',
              description: 'Paiement via Orange Money',
              isActive: false, // Désactivé en attendant l'API
              order: 2,
              settings: {
                apiUrl: '',
                merchantId: '',
                secretKey: ''
              }
            }
          ]
        }
      }
    })
    console.log('✅ Méthode Mobile Money créée avec 2 fournisseurs')

    // 3. Créer Virement bancaire
    const bankMethod = await prisma.paymentMethod.create({
      data: {
        code: 'bank_transfer',
        name: 'Virement bancaire',
        description: 'Paiement par virement bancaire',
        type: 'MANUAL',
        icon: 'Building',
        isActive: true,
        order: 3,
        apiEnabled: false
      }
    })
    console.log('✅ Méthode Virement bancaire créée')

    // 4. Créer Paiement espèces
    const cashMethod = await prisma.paymentMethod.create({
      data: {
        code: 'cash',
        name: 'Paiement espèce',
        description: 'Paiement en espèces lors de la livraison ou en magasin',
        type: 'MANUAL',
        icon: 'Banknote',
        isActive: true,
        order: 4,
        apiEnabled: false
      }
    })
    console.log('✅ Méthode Paiement espèce créée')

    // Vérification finale
    const totalMethods = await prisma.paymentMethod.count()
    const totalProviders = await prisma.paymentProvider.count()
    const activeMethods = await prisma.paymentMethod.count({ where: { isActive: true } })
    const activeProviders = await prisma.paymentProvider.count({ where: { isActive: true } })

    console.log('\n🎉 Configuration terminée !')
    console.log(`📊 Résumé :`)
    console.log(`   • ${totalMethods} méthodes créées (${activeMethods} actives)`)
    console.log(`   • ${totalProviders} fournisseurs créés (${activeProviders} actifs)`)

    // Test rapide de l'API
    console.log('\n🧪 Test rapide de l\'API...')
    try {
      const response = await fetch('http://localhost:3001/api/payment-methods?amount=20000&currency=Ar')
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ API fonctionne - ${data.paymentMethods?.length || 0} méthodes retournées`)
      } else {
        console.log(`❌ API erreur: ${response.status}`)
      }
    } catch (error) {
      console.log(`⚠️  API non accessible (serveur peut-être arrêté): ${error.message}`)
    }

    // Vérifier PayPal
    const paypalConfig = await prisma.paymentProvider.findFirst({
      where: { code: 'paypal_api' }
    })
    
    if (paypalConfig?.settings) {
      const settings = paypalConfig.settings
      const hasConfig = settings.clientId && settings.clientSecret
      
      console.log(`\n💳 Configuration PayPal :`)
      console.log(`   • Client ID : ${settings.clientId ? '✅ Configuré' : '❌ Manquant'}`)
      console.log(`   • Client Secret : ${settings.clientSecret ? '✅ Configuré' : '❌ Manquant'}`)
      console.log(`   • Environnement : ${settings.environment}`)
      
      if (!hasConfig) {
        console.log(`\n⚠️  Pour activer PayPal, ajoutez dans .env.local :`)
        console.log(`PAYPAL_CLIENT_ID=your_sandbox_client_id`)
        console.log(`PAYPAL_CLIENT_SECRET=your_sandbox_client_secret`)
        console.log(`PAYPAL_ENVIRONMENT=sandbox`)
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
if (require.main === module) {
  quickSetupPayments()
}

module.exports = { quickSetupPayments }