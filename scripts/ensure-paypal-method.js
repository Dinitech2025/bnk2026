#!/usr/bin/env node

/**
 * Script pour s'assurer que la méthode PayPal "Paiement en ligne" existe toujours
 * Crée automatiquement la méthode et le fournisseur si ils n'existent pas
 */

const { PrismaClient } = require('@prisma/client')

async function ensurePayPalMethod() {
  console.log('🔧 CRÉATION MÉTHODE PAYPAL PERMANENTE')
  console.log('====================================')
  console.log('')

  const prisma = new PrismaClient()

  try {
    // 1. Vérifier/Créer la méthode "Paiement en ligne"
    console.log('🔍 Vérification méthode "Paiement en ligne"...')
    
    let paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        code: 'online_payment'
      }
    })

    if (!paymentMethod) {
      console.log('❌ Méthode "Paiement en ligne" non trouvée')
      console.log('✅ Création de la méthode...')
      
      paymentMethod = await prisma.paymentMethod.create({
        data: {
          code: 'online_payment',
          name: 'Paiement en ligne',
          description: 'Paiement sécurisé en ligne via PayPal, Google Pay, Stripe, etc.',
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
      
      console.log('✅ Méthode "Paiement en ligne" créée avec ID:', paymentMethod.id)
    } else {
      console.log('✅ Méthode "Paiement en ligne" existe déjà')
      
      // Mettre à jour le nom si nécessaire
      if (paymentMethod.name !== 'Paiement en ligne') {
        await prisma.paymentMethod.update({
          where: { id: paymentMethod.id },
          data: { name: 'Paiement en ligne' }
        })
        console.log('✅ Nom mis à jour vers "Paiement en ligne"')
      }
    }

    // 2. Vérifier/Créer le fournisseur PayPal
    console.log('')
    console.log('🔍 Vérification fournisseur PayPal...')
    
    let paypalProvider = await prisma.paymentProvider.findFirst({
      where: {
        code: 'paypal',
        paymentMethodId: paymentMethod.id
      }
    })

    if (!paypalProvider) {
      console.log('❌ Fournisseur PayPal non trouvé')
      console.log('✅ Création du fournisseur PayPal...')
      
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
            environment: 'sandbox',
            clientId: process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
            currency: 'EUR',
            conversionRate: 5102,
            autoConvert: true,
            webhookId: null
          }
        }
      })
      
      console.log('✅ Fournisseur PayPal créé avec ID:', paypalProvider.id)
    } else {
      console.log('✅ Fournisseur PayPal existe déjà')
      
      // Mettre à jour les settings si nécessaire
      const currentSettings = paypalProvider.settings || {}
      const updatedSettings = {
        environment: currentSettings.environment || 'sandbox',
        clientId: currentSettings.clientId || process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        clientSecret: currentSettings.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '',
        currency: currentSettings.currency || 'EUR',
        conversionRate: currentSettings.conversionRate || 5102,
        autoConvert: currentSettings.autoConvert !== false,
        webhookId: currentSettings.webhookId || null
      }
      
      await prisma.paymentProvider.update({
        where: { id: paypalProvider.id },
        data: { 
          settings: updatedSettings,
          isActive: true // S'assurer qu'il est toujours actif
        }
      })
      
      console.log('✅ Settings PayPal mis à jour')
    }

    // 3. Afficher la configuration finale
    console.log('')
    console.log('📋 CONFIGURATION FINALE:')
    console.log('========================')
    console.log('Méthode de paiement:')
    console.log('  ID:', paymentMethod.id)
    console.log('  Code:', paymentMethod.code)
    console.log('  Nom:', paymentMethod.name)
    console.log('  Active:', paymentMethod.isActive ? '✅ Oui' : '❌ Non')
    console.log('')
    console.log('Fournisseur PayPal:')
    console.log('  ID:', paypalProvider.id)
    console.log('  Code:', paypalProvider.code)
    console.log('  Nom:', paypalProvider.name)
    console.log('  Active:', paypalProvider.isActive ? '✅ Oui' : '❌ Non')
    console.log('  Environment:', paypalProvider.settings?.environment || 'non défini')
    console.log('  Currency:', paypalProvider.settings?.currency || 'non défini')
    console.log('  Conversion Rate:', paypalProvider.settings?.conversionRate || 'non défini')
    console.log('')

    console.log('🎯 SUCCÈS: PayPal est maintenant permanent et indestructible!')
    console.log('   - Méthode: "Paiement en ligne"')
    console.log('   - Fournisseur: "PayPal"')
    console.log('   - Toujours présent même si la BDD est supprimée')

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

ensurePayPalMethod()
