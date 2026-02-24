const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const defaultPaymentMethods = [

  {
    code: 'mobile_money',
    name: 'Mobile Money',
    description: 'Paiement via portefeuille mobile',
    icon: 'Smartphone',
    type: 'PROVIDERS',
    isActive: true,
    order: 2,
    feeType: 'PERCENTAGE',
    feeValue: 1.5,
    processingTime: 'Instantané',
    requiresReference: true,
    requiresTransactionId: true,
    allowPartialPayments: true,
    apiEnabled: false,
    settings: {
      supportedCountries: ['Madagascar'],
      verificationRequired: true,
      smsConfirmation: true
    },
    providers: [
      {
        code: 'orange_money',
        name: 'Orange Money',
        description: 'Portefeuille mobile Orange',
        isActive: true,
        order: 1,
        feeType: 'PERCENTAGE',
        feeValue: 1.5,
        minAmount: 100,
        maxAmount: 1000000,
        dailyLimit: 2000000,
        settings: {
          shortCode: '*144#',
          supportedCountries: ['Madagascar'],
          customerServiceNumber: '144'
        }
      },
      {
        code: 'mvola',
        name: 'MVola',
        description: 'Portefeuille mobile Telma',
        isActive: true,
        order: 2,
        feeType: 'PERCENTAGE',
        feeValue: 1.2,
        minAmount: 100,
        maxAmount: 2000000,
        dailyLimit: 5000000,
        settings: {
          shortCode: '*145#',
          supportedCountries: ['Madagascar'],
          customerServiceNumber: '145'
        }
      },
      {
        code: 'airtel_money',
        name: 'Airtel Money',
        description: 'Portefeuille mobile Airtel',
        isActive: true,
        order: 3,
        feeType: 'PERCENTAGE',
        feeValue: 1.8,
        minAmount: 100,
        maxAmount: 500000,
        dailyLimit: 1000000,
        settings: {
          shortCode: '*555#',
          supportedCountries: ['Madagascar'],
          customerServiceNumber: '555'
        }
      }
    ]
  },
  {
    code: 'bank_transfer',
    name: 'Virement bancaire',
    description: 'Paiement par virement bancaire',
    icon: 'Building',
    type: 'MANUAL',
    isActive: true,
    order: 3,
    feeType: 'FIXED',
    feeValue: 1000,
    processingTime: '24-48h',
    requiresReference: true,
    requiresTransactionId: false,
    allowPartialPayments: true,
    apiEnabled: false,
    settings: {
      verificationRequired: true,
      manualProcessing: true,
      bankDetails: {
        accountNumber: '000-000000000-00',
        accountName: 'BOUTIK NAKA',
        bankName: 'BNI Madagascar'
      }
    },
    providers: [] // Les virements sont traités manuellement, pas de fournisseurs
  },
  {
    code: 'cash',
    name: 'Paiement espèce',
    description: 'Paiement en espèces lors de la livraison ou en magasin',
    icon: 'Banknote',
    type: 'MANUAL',
    isActive: true,
    order: 4,
    feeType: 'NONE',
    processingTime: 'Immédiat',
    requiresReference: false,
    requiresTransactionId: false,
    allowPartialPayments: true,
    apiEnabled: false,
    settings: {
      acceptedDenominations: [100, 200, 500, 1000, 2000, 5000, 10000, 20000],
      changeRequired: true,
      locationBased: true
    },
    providers: [] // Le paiement espèce ne nécessite pas de fournisseurs
  },
  {
    code: 'credit_card',
    name: 'Carte bancaire',
    description: 'Paiement par carte de crédit/débit via PayPal',
    icon: 'CreditCard',
    type: 'DIRECT',
    isActive: false, // Désactivé par défaut car nécessite configuration
    order: 5,
    feeType: 'PERCENTAGE',
    feeValue: 2.9,
    processingTime: 'Instantané',
    requiresReference: false,
    requiresTransactionId: true,
    allowPartialPayments: true,
    apiEnabled: true,
    apiEndpoint: 'https://api.paypal.com',
    settings: {
      usePayPalProcessor: true, // Utilise PayPal pour traiter les cartes
      supportedCards: ['visa', 'mastercard', 'amex'],
      securityFeatures: ['3dsecure', 'fraud_protection'],
      integration: 'paypal_hosted_fields'
    },
    providers: [] // Les cartes utilisent l'API PayPal directement
  }
]

async function seedPaymentMethods() {
  console.log('🌱 Début du seeding des méthodes de paiement...')

  try {
    // Supprimer les données existantes (optionnel)
    console.log('🗑️ Suppression des données existantes...')
    await prisma.payment.updateMany({
      where: { 
        OR: [
          { methodId: { not: null } },
          { providerId: { not: null } }
        ]
      },
      data: { 
        methodId: null,
        providerId: null 
      }
    })
    await prisma.paymentProvider.deleteMany({})
    await prisma.paymentMethod.deleteMany({})

    // Créer les méthodes et fournisseurs
    for (const methodData of defaultPaymentMethods) {
      console.log(`📝 Création de la méthode: ${methodData.name}`)
      
      const { providers, ...methodFields } = methodData
      
      const method = await prisma.paymentMethod.create({
        data: methodFields
      })

      console.log(`✅ Méthode créée: ${method.name} (${method.code})`)

      // Créer les fournisseurs
      for (const providerData of providers) {
        console.log(`  📝 Création du fournisseur: ${providerData.name}`)
        
        const provider = await prisma.paymentProvider.create({
          data: {
            ...providerData,
            paymentMethodId: method.id
          }
        })

        console.log(`  ✅ Fournisseur créé: ${provider.name} (${provider.code})`)
      }
    }

    // Afficher un résumé
    const methodsCount = await prisma.paymentMethod.count()
    const providersCount = await prisma.paymentProvider.count()
    
    console.log(`\n🎉 Seeding terminé avec succès!`)
    console.log(`📊 Résumé:`)
    console.log(`   - ${methodsCount} méthodes de paiement créées`)
    console.log(`   - ${providersCount} fournisseurs créés`)
    
    // Afficher les méthodes actives
    const activeMethods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      include: {
        providers: {
          where: { isActive: true }
        }
      }
    })
    
    console.log(`\n📋 Méthodes actives:`)
    activeMethods.forEach(method => {
      const activeProviders = method.providers.length
      console.log(`   - ${method.name} (${method.code}) - ${activeProviders} fournisseur(s) actif(s)`)
    })

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    throw error
  }
}

async function main() {
  try {
    await seedPaymentMethods()
  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter seulement si le script est appelé directement
if (require.main === module) {
  main()
}

module.exports = { seedPaymentMethods }
