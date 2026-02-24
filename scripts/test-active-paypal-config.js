#!/usr/bin/env node

/**
 * Script pour tester quelle configuration PayPal est RÉELLEMENT utilisée
 * Simule l'appel de getPayPalConfig() comme le fait l'application
 */

const { PrismaClient } = require('@prisma/client')

async function testActivePayPalConfig() {
  console.log('🧪 TEST CONFIGURATION PAYPAL ACTIVE')
  console.log('===================================')
  console.log('')

  const prisma = new PrismaClient()

  try {
    console.log('🔍 Simulation de getPayPalConfig()...')
    console.log('')

    // Reproduire exactement la logique de lib/paypal-config.ts
    const paypalProvider = await prisma.paymentProvider.findFirst({
      where: {
        code: 'paypal_api',
        isActive: true,
        paymentMethod: {
          code: 'paypal',
          isActive: true
        }
      },
      include: {
        paymentMethod: true
      }
    });

    if (!paypalProvider || !paypalProvider.settings) {
      console.log('❌ Configuration BDD non trouvée')
      console.log('📋 UTILISATION: Variables d\'environnement (fallback)')
      console.log('')
      
      const fallbackConfig = {
        environment: process.env.PAYPAL_ENVIRONMENT || process.env.PAYPAL_MODE || 'sandbox',
        clientId: process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        currency: 'EUR',
        conversionRate: 5000,
        autoConvert: true
      };
      
      console.log('⚙️ CONFIGURATION ACTIVE (Variables d\'environnement):')
      console.log('----------------------------------------------------')
      console.log('Environment:', fallbackConfig.environment)
      console.log('Currency:', fallbackConfig.currency)
      console.log('Conversion Rate:', fallbackConfig.conversionRate)
      console.log('Auto Convert:', fallbackConfig.autoConvert ? '✅ Oui' : '❌ Non')
      console.log('Client ID:', fallbackConfig.clientId ? '✅ Défini (' + fallbackConfig.clientId.substring(0, 10) + '...)' : '❌ Non défini')
      console.log('Client Secret:', fallbackConfig.clientSecret ? '✅ Défini (caché)' : '❌ Non défini')
      
    } else {
      console.log('✅ Configuration BDD trouvée')
      console.log('📋 UTILISATION: Base de données (priorité)')
      console.log('')

      // Extraire la configuration depuis les settings
      const settings = paypalProvider.settings;
      
      const activeConfig = {
        environment: settings.environment || 'sandbox',
        clientId: settings.clientId || '',
        clientSecret: settings.clientSecret || '',
        webhookId: settings.webhookId,
        currency: settings.currency || 'EUR',
        conversionRate: settings.conversionRate || 5000,
        autoConvert: settings.autoConvert !== false
      };

      console.log('⚙️ CONFIGURATION ACTIVE (Base de données):')
      console.log('------------------------------------------')
      console.log('Environment:', activeConfig.environment)
      console.log('Currency:', activeConfig.currency)
      console.log('Conversion Rate:', activeConfig.conversionRate)
      console.log('Auto Convert:', activeConfig.autoConvert ? '✅ Oui' : '❌ Non')
      console.log('Client ID:', activeConfig.clientId ? '✅ Défini (' + activeConfig.clientId.substring(0, 10) + '...)' : '❌ Non défini')
      console.log('Client Secret:', activeConfig.clientSecret ? '✅ Défini (caché)' : '❌ Non défini')
      console.log('Webhook ID:', activeConfig.webhookId || 'non défini')
      
      // Déterminer l'URL de base PayPal
      const baseUrl = activeConfig.environment === 'production' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';
      
      console.log('Base URL PayPal:', baseUrl)
    }

    console.log('')
    console.log('🎯 CONCLUSION:')
    console.log('==============')
    if (paypalProvider && paypalProvider.settings) {
      console.log('✅ La BASE DE DONNÉES est utilisée')
      console.log('   Pour modifier: Admin → Méthodes de paiement → Modifier PayPal')
    } else {
      console.log('✅ Les VARIABLES D\'ENVIRONNEMENT sont utilisées')
      console.log('   Pour modifier: Changer les variables d\'environnement')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testActivePayPalConfig()
