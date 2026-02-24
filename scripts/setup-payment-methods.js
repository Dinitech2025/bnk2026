const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupPaymentMethods() {
  try {
    console.log('🚀 Configuration des méthodes de paiement...')

    // 1. Créer les méthodes de paiement de base
    const paymentMethods = [
      {
        code: 'paypal',
        name: 'Paiement en ligne',
        description: 'Paiement sécurisé en ligne via PayPal, Google Pay, Stripe, etc.',
        type: 'PROVIDERS',
        icon: 'CreditCard',
        isActive: true,
        order: 1,
        apiEnabled: true
      },
      {
        code: 'mobile_money',
        name: 'Mobile Money',
        description: 'Paiement via portefeuille mobile',
        type: 'PROVIDERS',
        icon: 'Smartphone',
        isActive: true,
        order: 2,
        apiEnabled: false
      },
      {
        code: 'bank_transfer',
        name: 'Virement bancaire',
        description: 'Paiement par virement bancaire',
        type: 'MANUAL',
        icon: 'Building',
        isActive: true,
        order: 3,
        apiEnabled: false
      },
      {
        code: 'cash',
        name: 'Paiement espèce',
        description: 'Paiement en espèces lors de la livraison ou en magasin',
        type: 'MANUAL',
        icon: 'Banknote',
        isActive: true,
        order: 4,
        apiEnabled: false
      }
    ]

    for (const methodData of paymentMethods) {
      await prisma.paymentMethod.upsert({
        where: { code: methodData.code },
        update: methodData,
        create: methodData
      })
      console.log(`✅ Méthode ${methodData.name} configurée`)
    }

    // 2. Créer les fournisseurs PayPal
    const paypalMethod = await prisma.paymentMethod.findUnique({
      where: { code: 'paypal' }
    })

    if (paypalMethod) {
      const paypalProviders = [
        {
          code: 'paypal_api',
          name: 'PayPal',
          description: 'Paiement sécurisé avec PayPal',
          paymentMethodId: paypalMethod.id,
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
          code: 'stripe_api',
          name: 'Stripe',
          description: 'Paiement par carte bancaire via Stripe',
          paymentMethodId: paypalMethod.id,
          isActive: false, // Désactivé par défaut
          order: 2,
          settings: {
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
            secretKey: process.env.STRIPE_SECRET_KEY || '',
            currency: 'EUR'
          }
        }
      ]

      for (const providerData of paypalProviders) {
        await prisma.paymentProvider.upsert({
          where: { code: providerData.code },
          update: providerData,
          create: providerData
        })
        console.log(`✅ Fournisseur ${providerData.name} configuré`)
      }
    }

    // 3. Créer les fournisseurs Mobile Money
    const mobileMethod = await prisma.paymentMethod.findUnique({
      where: { code: 'mobile_money' }
    })

    if (mobileMethod) {
      const mobileProviders = [
        {
          code: 'mvola',
          name: 'MVola',
          description: 'Paiement via MVola (Telma)',
          paymentMethodId: mobileMethod.id,
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
          paymentMethodId: mobileMethod.id,
          isActive: false, // Désactivé en attendant l'API
          order: 2,
          settings: {
            apiUrl: '',
            merchantId: '',
            secretKey: ''
          }
        }
      ]

      for (const providerData of mobileProviders) {
        await prisma.paymentProvider.upsert({
          where: { code: providerData.code },
          update: providerData,
          create: providerData
        })
        console.log(`✅ Fournisseur ${providerData.name} configuré`)
      }
    }

    console.log('\n🎉 Configuration des méthodes de paiement terminée !')
    
    // Afficher un résumé
    const methodsCount = await prisma.paymentMethod.count()
    const providersCount = await prisma.paymentProvider.count()
    const activeMethodsCount = await prisma.paymentMethod.count({ where: { isActive: true } })
    const activeProvidersCount = await prisma.paymentProvider.count({ where: { isActive: true } })
    
    console.log(`\n📊 Résumé :`)
    console.log(`   • ${methodsCount} méthodes de paiement (${activeMethodsCount} actives)`)
    console.log(`   • ${providersCount} fournisseurs (${activeProvidersCount} actifs)`)
    
    // Vérifier la configuration PayPal
    const paypalProvider = await prisma.paymentProvider.findFirst({
      where: { code: 'paypal_api' }
    })
    
    if (paypalProvider && paypalProvider.settings) {
      const settings = paypalProvider.settings
      const hasClientId = !!(settings.clientId)
      const hasClientSecret = !!(settings.clientSecret)
      
      console.log(`\n🔧 Configuration PayPal :`)
      console.log(`   • Environnement : ${settings.environment || 'sandbox'}`)
      console.log(`   • Client ID : ${hasClientId ? '✅ Configuré' : '❌ Manquant'}`)
      console.log(`   • Client Secret : ${hasClientSecret ? '✅ Configuré' : '❌ Manquant'}`)
      
      if (!hasClientId || !hasClientSecret) {
        console.log(`\n⚠️  Pour activer PayPal, ajoutez ces variables d'environnement :`)
        console.log(`   PAYPAL_CLIENT_ID=your_client_id`)
        console.log(`   PAYPAL_CLIENT_SECRET=your_client_secret`)
        console.log(`   PAYPAL_ENVIRONMENT=sandbox (ou production)`)
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
  setupPaymentMethods()
}