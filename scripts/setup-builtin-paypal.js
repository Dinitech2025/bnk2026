const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupBuiltinPayPal() {
  console.log('🏗️  CONFIGURATION PAYPAL INTÉGRÉ');
  console.log('================================');
  
  try {
    // Vérifier si PayPal existe déjà
    let paypalMethod = await prisma.paymentMethod.findFirst({
      where: {
        code: 'paypal'
      },
      include: {
        providers: true
      }
    });

    if (paypalMethod) {
      console.log('📦 PayPal existe déjà:', paypalMethod.name);
    } else {
      // Créer le mode de paiement PayPal
      paypalMethod = await prisma.paymentMethod.create({
        data: {
          name: 'PayPal',
          code: 'paypal',
          type: 'BUILTIN', // Nouveau type pour les modes intégrés
          description: 'Paiement sécurisé via PayPal',
          icon: 'credit-card',
          isActive: true,
          isBuiltin: true, // Marquer comme intégré (insupprimable)
          allowPartialPayments: false,
          minAmount: 100, // 100 Ar minimum
          maxAmount: 10000000, // 10M Ar maximum
          currency: 'EUR', // PayPal utilise EUR
          order: 1,
          apiEnabled: true,
          apiEndpoint: 'https://api-m.sandbox.paypal.com'
        }
      });
      console.log('✅ Mode de paiement PayPal créé:', paypalMethod.id);
    }

    // Créer ou mettre à jour le provider PayPal
    let paypalProvider = await prisma.paymentProvider.findFirst({
      where: {
        paymentMethodId: paypalMethod.id,
        code: 'paypal_api'
      }
    });

    const paypalConfig = {
      environment: 'sandbox', // sandbox ou production
      clientId: process.env.PAYPAL_CLIENT_ID || 'ARhWb68VmOrhIvTOuoLjMgVKwmz-bsQ4gZEKCqf7ynUVrmILXF8UH7Z8xxSjhxdSdUaC9fK8LjA8BbYj',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'ELh2KWbUhHaDJWW5k0hU96IZpBZXcL4yQgLVGmxnfTi0pz37zl8nTjbvBOhN-9pF7bP9qZ3E8sY4D5X7',
      webhookId: '',
      currency: 'EUR', // Devise PayPal
      conversionRate: 5000, // 1 EUR = 5000 Ar
      autoConvert: true
    };

    if (paypalProvider) {
      // Mettre à jour la configuration existante
      paypalProvider = await prisma.paymentProvider.update({
        where: { id: paypalProvider.id },
        data: {
          name: 'PayPal API',
          isActive: true,
          settings: paypalConfig, // Utiliser settings au lieu de config
          apiEndpoint: paypalConfig.environment === 'production' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com',
          updatedAt: new Date()
        }
      });
      console.log('🔄 Configuration PayPal mise à jour');
    } else {
      // Créer le provider PayPal
      paypalProvider = await prisma.paymentProvider.create({
        data: {
          paymentMethodId: paypalMethod.id,
          name: 'PayPal API',
          code: 'paypal_api',
          isActive: true,
          settings: paypalConfig, // Utiliser settings au lieu de config
          apiEndpoint: 'https://api-m.sandbox.paypal.com',
          description: 'Intégration API PayPal officielle',
          order: 1
        }
      });
      console.log('✅ Provider PayPal créé:', paypalProvider.id);
    }

    console.log('');
    console.log('📋 CONFIGURATION PAYPAL:');
    console.log(`   Mode de paiement: ${paypalMethod.name} (${paypalMethod.code})`);
    console.log(`   Provider: ${paypalProvider.name} (${paypalProvider.code})`);
    console.log(`   Environnement: ${paypalConfig.environment}`);
    console.log(`   Client ID: ${paypalConfig.clientId.substring(0, 20)}...`);
    console.log(`   Devise: ${paypalConfig.currency}`);
    console.log(`   Taux de conversion: 1 ${paypalConfig.currency} = ${paypalConfig.conversionRate} Ar`);
    console.log('');
    console.log('✅ PayPal est maintenant configuré comme mode de paiement intégré !');
    console.log('🔧 Vous pouvez modifier la configuration dans /admin/payment-methods');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupBuiltinPayPal();
