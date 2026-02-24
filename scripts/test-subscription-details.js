const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSubscriptionDetails() {
  try {
    console.log('🔍 Test de récupération des détails d\'abonnement...\n');

    // 1. Récupérer les commandes avec abonnements
    const ordersWithSubscriptions = await prisma.order.findMany({
      where: {
        subscriptions: {
          some: {}
        }
      },
      include: {
        subscriptions: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            platformOfferId: true,
            offer: {
              select: {
                name: true,
              },
            },
            platformOffer: {
              select: {
                id: true,
                platform: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
            subscriptionAccounts: {
              include: {
                account: {
                  include: {
                    platform: {
                      select: {
                        id: true,
                        name: true,
                        logo: true,
                      }
                    }
                  }
                },
              },
            },
            accountProfiles: {
              select: {
                id: true,
                name: true,
                profileSlot: true,
                pin: true,
                isAssigned: true,
                accountId: true,
                account: {
                  select: {
                    username: true,
                    email: true,
                    id: true,
                  }
                }
              }
            },
          },
        },
      },
    });

    console.log(`📊 Trouvé ${ordersWithSubscriptions.length} commandes avec abonnements\n`);

    for (const order of ordersWithSubscriptions) {
      console.log(`🛍️ Commande: ${order.orderNumber || order.id.substring(0, 8)}`);
      
      for (const subscription of order.subscriptions) {
        console.log(`\n  📺 Abonnement: ${subscription.offer.name}`);
        console.log(`     Status: ${subscription.status}`);
        console.log(`     Période: ${subscription.startDate.toLocaleDateString('fr-FR')} → ${subscription.endDate.toLocaleDateString('fr-FR')}`);
        
        // Plateforme
        if (subscription.platformOffer?.platform) {
          console.log(`     🎬 Plateforme: ${subscription.platformOffer.platform.name}`);
          if (subscription.platformOffer.platform.logo) {
            console.log(`        Logo: ${subscription.platformOffer.platform.logo}`);
          }
        } else {
          console.log(`     ⚠️ Aucune plateforme associée`);
        }
        
        // Comptes assignés
        if (subscription.subscriptionAccounts && subscription.subscriptionAccounts.length > 0) {
          console.log(`     👤 Comptes assignés (${subscription.subscriptionAccounts.length}):`);
          for (const subAccount of subscription.subscriptionAccounts) {
            console.log(`        - ${subAccount.account.username} (${subAccount.account.email})`);
            console.log(`          Plateforme: ${subAccount.account.platform.name}`);
          }
        } else {
          console.log(`     ❌ Aucun compte assigné`);
        }
        
        // Profils assignés
        if (subscription.accountProfiles && subscription.accountProfiles.length > 0) {
          console.log(`     👥 Profils assignés (${subscription.accountProfiles.length}):`);
          for (const profile of subscription.accountProfiles) {
            console.log(`        - ${profile.name} (Slot ${profile.profileSlot})`);
            console.log(`          Compte: ${profile.account.username}`);
            if (profile.pin) {
              console.log(`          PIN: ${profile.pin}`);
            }
          }
        } else {
          console.log(`     ❌ Aucun profil assigné`);
        }
      }
      
      console.log('\n' + '─'.repeat(60));
    }

    console.log('\n✅ Test terminé !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscriptionDetails(); 