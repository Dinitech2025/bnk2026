const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSubscriptionCheckout() {
  console.log('🧪 Test du checkout avec abonnement streaming...\n');

  try {
    // Générer un email unique
    const timestamp = Date.now();
    const uniqueEmail = `test.streaming.${timestamp}@example.com`;

    // 1. Récupérer une offre Netflix
    const netflixOffer = await prisma.offer.findFirst({
      where: {
        name: {
          contains: 'Netflix'
        },
        isActive: true
      },
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        }
      }
    });

    if (!netflixOffer) {
      console.log('❌ Aucune offre Netflix trouvée');
      return;
    }

    console.log(`📺 Offre trouvée: ${netflixOffer.name} - ${netflixOffer.price} Ar`);

    // 2. Préparer des données de test avec abonnement
    const testOrder = {
      customer: {
        email: uniqueEmail,
        phone: '0341234567',
        firstName: 'Client',
        lastName: 'Streaming',
        createAccount: true,
        newsletter: false
      },
      billingAddress: {
        street: '789 Boulevard Streaming',
        city: 'Fianarantsoa',
        zipCode: '301',
        country: 'Madagascar'
      },
      shippingAddress: {
        street: '789 Boulevard Streaming',
        city: 'Fianarantsoa',
        zipCode: '301',
        country: 'Madagascar'
      },
      items: [
        {
          id: `subscription_${netflixOffer.id}`,
          name: netflixOffer.name,
          price: Number(netflixOffer.price),
          quantity: 1,
          type: 'subscription',
          platform: {
            id: netflixOffer.platformOffers[0]?.platform.id,
            name: netflixOffer.platformOffers[0]?.platform.name,
            logo: netflixOffer.platformOffers[0]?.platform.logo
          },
          duration: `${netflixOffer.duration} ${netflixOffer.durationUnit}`,
          maxProfiles: netflixOffer.maxProfiles,
          reservation: {
            offerId: netflixOffer.id,
            account: {
              id: 'test-account-id',
              email: 'netflix.test@example.com'
            },
            profiles: [
              { id: 'profile-1', name: 'Principal', profileSlot: 1 }
            ]
          }
        }
      ],
      total: Number(netflixOffer.price),
      currency: 'MGA',
      paymentMethod: 'mobile_money',
      notes: 'Test d\'abonnement streaming avec création de compte',
      timestamp: new Date().toISOString()
    };

    console.log('📦 Données de test préparées:');
    console.log(`- Client: ${testOrder.customer.firstName} ${testOrder.customer.lastName}`);
    console.log(`- Email: ${testOrder.customer.email}`);
    console.log(`- Abonnement: ${testOrder.items[0].name}`);
    console.log(`- Total: ${testOrder.total} Ar`);

    // 3. Tester l'API de commande
    console.log('\n🌐 Test de l\'API de commande...');
    
    const response = await fetch('http://localhost:3000/api/public/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Erreur API: ${result.message}`);
    }

    console.log('✅ Réponse API:');
    console.log(`- Succès: ${result.success}`);
    console.log(`- Numéro de commande: ${result.orderNumber}`);
    console.log(`- Compte créé: ${result.accountCreated}`);
    console.log(`- Message: ${result.message}`);

    // 4. Vérifier la création de l'utilisateur et l'abonnement
    console.log('\n👤 Vérification de l\'utilisateur...');
    
    const user = await prisma.user.findUnique({
      where: { email: testOrder.customer.email },
      include: {
        addresses: true,
        orders: {
          include: {
            items: {
              include: {
                offer: true
              }
            }
          }
        },
        subscriptions: {
          include: {
            offer: {
              include: {
                platformOffers: {
                  include: {
                    platform: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (user) {
      console.log('✅ Utilisateur trouvé:');
      console.log(`- ID: ${user.id}`);
      console.log(`- Nom: ${user.firstName} ${user.lastName}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Adresses: ${user.addresses.length}`);
      console.log(`- Commandes: ${user.orders.length}`);
      console.log(`- Abonnements: ${user.subscriptions.length}`);

      // 5. Vérifier la commande et l'abonnement
      if (user.orders.length > 0) {
        const order = user.orders[0];
        console.log('\n📋 Vérification de la commande:');
        console.log(`- Numéro: ${order.orderNumber}`);
        console.log(`- Status: ${order.status}`);
        console.log(`- Total: ${order.total} Ar`);
        console.log(`- Articles: ${order.items.length}`);

        order.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.offer?.name || 'Offre inconnue'}`);
          console.log(`     - Type: ${item.itemType}`);
          console.log(`     - Prix: ${item.totalPrice} Ar`);
          
          if (item.metadata) {
            try {
              const metadata = JSON.parse(item.metadata);
              console.log(`     - Plateforme: ${metadata.platform?.name || 'N/A'}`);
              console.log(`     - Durée: ${metadata.duration || 'N/A'}`);
              console.log(`     - Profils max: ${metadata.maxProfiles || 'N/A'}`);
            } catch (e) {
              console.log(`     - Métadonnées: Erreur de parsing`);
            }
          }
        });
      }

      // 6. Vérifier l'abonnement créé
      if (user.subscriptions.length > 0) {
        const subscription = user.subscriptions[0];
        console.log('\n🔄 Vérification de l\'abonnement:');
        console.log(`- ID: ${subscription.id}`);
        console.log(`- Status: ${subscription.status}`);
        console.log(`- Offre: ${subscription.offer?.name}`);
        console.log(`- Plateforme: ${subscription.offer?.platformOffers[0]?.platform.name}`);
        console.log(`- Début: ${subscription.startDate.toLocaleDateString()}`);
        console.log(`- Fin: ${subscription.endDate.toLocaleDateString()}`);
      }

      console.log('\n✅ Test réussi ! Le checkout d\'abonnement streaming fonctionne correctement.');
      
      // 7. Nettoyer les données de test
      console.log('\n🧹 Nettoyage des données de test...');
      
      // Supprimer les abonnements
      await prisma.subscription.deleteMany({
        where: {
          userId: user.id
        }
      });
      
      // Supprimer les commandes
      await prisma.orderItem.deleteMany({
        where: {
          order: {
            userId: user.id
          }
        }
      });
      
      await prisma.order.deleteMany({
        where: {
          userId: user.id
        }
      });
      
      // Supprimer les adresses
      await prisma.address.deleteMany({
        where: {
          userId: user.id
        }
      });
      
      // Supprimer l'utilisateur
      await prisma.user.delete({
        where: {
          id: user.id
        }
      });
      
      console.log('✅ Données de test nettoyées');

    } else {
      console.log('❌ Utilisateur non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscriptionCheckout(); 