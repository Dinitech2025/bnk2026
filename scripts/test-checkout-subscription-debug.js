const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSubscriptionCheckoutDebug() {
  try {
    console.log('🔍 Test de checkout d\'abonnement avec debug...\n');

    // 1. Vérifier qu'il y a des offres disponibles
    const offers = await prisma.offer.findMany({
      where: { isActive: true },
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        }
      }
    });

    console.log(`📋 Offres disponibles: ${offers.length}`);
    
    if (offers.length === 0) {
      console.log('❌ Aucune offre disponible');
      return;
    }

    const offer = offers[0];
    console.log(`📺 Offre sélectionnée: ${offer.name} - ${offer.price} Ar`);
    console.log(`🎬 Plateformes: ${offer.platformOffers.map(po => po.platform.name).join(', ')}`);

    // 2. Vérifier qu'il y a des comptes disponibles
    if (offer.platformOffers.length > 0) {
      const platformId = offer.platformOffers[0].platform.id;
      const accounts = await prisma.account.findMany({
        where: {
          platformId: platformId,
          availability: true,
          status: 'ACTIVE'
        },
        include: {
          accountProfiles: {
            where: {
              isAssigned: false
            }
          }
        }
      });

      console.log(`👤 Comptes disponibles pour ${offer.platformOffers[0].platform.name}: ${accounts.length}`);
      
      for (const account of accounts) {
        console.log(`  - ${account.username} (${account.accountProfiles.length} profils libres)`);
      }

      if (accounts.length === 0) {
        console.log('❌ Aucun compte disponible pour cette plateforme');
        return;
      }
    }

    // 3. Préparer les données de test
    const testEmail = `test.debug.${Date.now()}@example.com`;
    const testData = {
      customer: {
        firstName: 'Test',
        lastName: 'Debug',
        email: testEmail,
        phone: '+261340000000',
        createAccount: true,
        newsletter: false
      },
      billingAddress: {
        street: '123 Test Street',
        city: 'Antananarivo',
        zipCode: '101',
        country: 'Madagascar'
      },
      shippingAddress: {
        street: '123 Test Street',
        city: 'Antananarivo',
        zipCode: '101',
        country: 'Madagascar'
      },
      paymentMethod: 'mobile_money',
      items: [
        {
          type: 'subscription',
          name: offer.name,
          price: offer.price,
          quantity: 1,
          platform: offer.platformOffers[0]?.platform.name || 'Unknown',
          duration: offer.duration,
          maxProfiles: offer.maxProfiles,
          reservation: {
            offerId: offer.id,
            platformId: offer.platformOffers[0]?.platform.id
          }
        }
      ]
    };

    console.log('\n📦 Données de test préparées');
    console.log(`📧 Email: ${testData.customer.email}`);
    console.log(`🎯 Offre: ${testData.items[0].name}`);

    // 4. Tester l'API
    console.log('\n🌐 Test de l\'API...');
    
    const response = await fetch('http://localhost:3000/api/public/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response: ${responseText}`);

    if (!response.ok) {
      console.log('❌ Erreur API détectée');
      return;
    }

    const result = JSON.parse(responseText);
    console.log('\n✅ Commande créée avec succès !');
    console.log(`📋 Numéro: ${result.orderNumber}`);
    console.log(`🆔 ID: ${result.orderId}`);

    // 5. Vérifier l'abonnement créé
    const subscription = await prisma.subscription.findFirst({
      where: {
        orderId: result.orderId
      },
      include: {
        offer: true,
        platformOffer: {
          include: {
            platform: true
          }
        },
        subscriptionAccounts: {
          include: {
            account: {
              include: {
                platform: true
              }
            }
          }
        },
        accountProfiles: {
          include: {
            account: true
          }
        }
      }
    });

    if (subscription) {
      console.log('\n📺 Abonnement créé:');
      console.log(`  Status: ${subscription.status}`);
      console.log(`  Plateforme: ${subscription.platformOffer?.platform?.name || 'Non définie'}`);
      console.log(`  Comptes assignés: ${subscription.subscriptionAccounts?.length || 0}`);
      console.log(`  Profils assignés: ${subscription.accountProfiles?.length || 0}`);

      if (subscription.subscriptionAccounts?.length > 0) {
        console.log('\n👤 Détails du compte:');
        const account = subscription.subscriptionAccounts[0].account;
        console.log(`  Username: ${account.username}`);
        console.log(`  Email: ${account.email}`);
        console.log(`  Plateforme: ${account.platform.name}`);
      }

      if (subscription.accountProfiles?.length > 0) {
        console.log('\n👥 Profils assignés:');
        for (const profile of subscription.accountProfiles) {
          console.log(`  - ${profile.name} (Slot ${profile.profileSlot})`);
          console.log(`    Compte: ${profile.account.username}`);
        }
      }
    }

    // 6. Nettoyage
    console.log('\n🧹 Nettoyage des données de test...');
    
    // Supprimer l'utilisateur de test (cascade supprimera la commande et l'abonnement)
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    
    if (user) {
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log('✅ Données de test supprimées');
    }

    console.log('\n✅ Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    
    // Afficher plus de détails sur l'erreur
    if (error.message) {
      console.error('Message:', error.message);
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSubscriptionCheckoutDebug(); 