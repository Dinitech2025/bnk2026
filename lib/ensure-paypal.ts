import { prisma } from '@/lib/prisma'

/**
 * S'assure que la méthode PayPal "Paiement en ligne" existe toujours
 * Appelé automatiquement lors du chargement des méthodes de paiement
 */
export async function ensurePayPalExists() {
  try {
    // 1. Vérifier/Créer la méthode "Paiement en ligne"
    let paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        code: 'online_payment'
      }
    })

    if (!paymentMethod) {
      console.log('🔧 Création automatique de la méthode "Paiement en ligne"...')
      
      paymentMethod = await prisma.paymentMethod.create({
        data: {
          code: 'online_payment',
          name: 'Paiement en ligne',
          description: 'Paiement via votre compte PayPal',
          icon: 'CreditCard',
          type: 'DIRECT',
          isActive: true,
          order: 1,
          minAmount: null,
          maxAmount: null,
          feeType: 'NONE',
          feeValue: null,
          processingTime: 'Instantané',
          requiresReference: false,
          requiresTransactionId: false,
          allowPartialPayments: true,
          apiEnabled: true,
          apiEndpoint: 'https://api-m.sandbox.paypal.com',
          publicKey: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || null,
          settings: {}
        }
      })
    }

    // 2. Vérifier/Créer le fournisseur PayPal
    let paypalProvider = await prisma.paymentProvider.findFirst({
      where: {
        code: 'paypal',
        paymentMethodId: paymentMethod.id
      }
    })

    if (!paypalProvider) {
      console.log('🔧 Création automatique du fournisseur PayPal...')
      
      paypalProvider = await prisma.paymentProvider.create({
        data: {
          paymentMethodId: paymentMethod.id,
          code: 'paypal',
          name: 'PayPal',
          description: 'Paiement sécurisé via PayPal',
          logo: null,
          isActive: true,
          order: 1,
          apiEndpoint: 'https://api-m.sandbox.paypal.com',
          publicKey: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || null,
          merchantId: null,
          feeType: 'NONE',
          feeValue: null,
          minAmount: null,
          maxAmount: null,
          dailyLimit: null,
          settings: {
            environment: process.env.PAYPAL_MODE || 'sandbox',
            clientId: process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
            currency: 'EUR',
            conversionRate: 5102,
            autoConvert: true,
            webhookId: null
          }
        }
      })
    }

    // 3. S'assurer que PayPal est toujours actif et non supprimable
    await prisma.paymentMethod.update({
      where: { id: paymentMethod.id },
      data: { 
        isActive: true,
        name: 'Paiement en ligne' // Force le nom correct
      }
    })

    await prisma.paymentProvider.update({
      where: { id: paypalProvider.id },
      data: { isActive: true }
    })

    return { paymentMethod, paypalProvider }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification PayPal:', error)
    return null
  }
}

/**
 * Empêche la suppression de la méthode PayPal
 */
export async function preventPayPalDeletion(methodId: string): Promise<boolean> {
  try {
    const method = await prisma.paymentMethod.findUnique({
      where: { id: methodId }
    })

    if (method?.code === 'online_payment') {
      console.log('🚫 Tentative de suppression de PayPal bloquée')
      return false // Empêche la suppression
    }

    return true // Autorise la suppression pour les autres méthodes
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de suppression:', error)
    return false
  }
}
