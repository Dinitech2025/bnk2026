const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMissingSubscriptions() {
  console.log('🔍 Recherche des commandes payées sans abonnements...');

  try {
    // Trouver toutes les commandes payées
    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        status: {
          in: ['PAID', 'CONFIRMED']
        }
      },
      include: {
        items: {
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
        },
        subscriptions: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log(`📊 ${paidOrders.length} commandes payées trouvées`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const order of paidOrders) {
      console.log(`\n🔍 Analyse de la commande ${order.orderNumber || order.id}`);
      console.log(`   Client: ${order.user.firstName} ${order.user.lastName} (${order.user.email})`);
      console.log(`   Statut: ${order.status}, Paiement: ${order.paymentStatus}`);
      console.log(`   Abonnements existants: ${order.subscriptions.length}`);

      // Identifier les offres d'abonnement dans cette commande
      const subscriptionOffers = order.items.filter(item => 
        (item.itemType === 'OFFER' || item.itemType === 'SUBSCRIPTION') && 
        item.offer && 
        item.offer.platformOffers.length > 0
      );

      console.log(`   Offres d'abonnement: ${subscriptionOffers.length}`);

      if (subscriptionOffers.length > 0) {
        // Vérifier si des abonnements manquent
        const missingSubscriptions = [];

        for (const item of subscriptionOffers) {
          if (!item.offer) continue;

          // Vérifier si un abonnement existe déjà pour cette offre
          const existingSubscription = order.subscriptions.find(sub => 
            sub.offerId === item.offer.id
          );

          if (!existingSubscription) {
            missingSubscriptions.push(item);
            console.log(`   ❌ Abonnement manquant pour: ${item.offer.name}`);
          } else {
            console.log(`   ✅ Abonnement existant pour: ${item.offer.name}`);
          }
        }

        if (missingSubscriptions.length > 0) {
          console.log(`   🔧 Création de ${missingSubscriptions.length} abonnement(s) manquant(s)...`);

          // Créer les abonnements manquants
          for (const item of missingSubscriptions) {
            if (!item.offer) continue;

            // Calculer les dates de début et fin
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + item.offer.duration);

            try {
              const newSubscription = await prisma.subscription.create({
                data: {
                  userId: order.userId,
                  offerId: item.offer.id,
                  orderId: order.id,
                  status: 'ACTIVE',
                  startDate: startDate,
                  endDate: endDate,
                  autoRenew: false
                }
              });

              console.log(`   ✅ Abonnement créé: ${newSubscription.id} pour ${item.offer.name}`);
              console.log(`      Durée: ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`);
              fixedCount++;
            } catch (error) {
              console.error(`   ❌ Erreur lors de la création de l'abonnement pour ${item.offer.name}:`, error.message);
            }
          }
        } else {
          console.log(`   ✅ Tous les abonnements sont présents`);
          skippedCount++;
        }
      } else {
        console.log(`   ℹ️ Aucune offre d'abonnement dans cette commande`);
        skippedCount++;
      }
    }

    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   ✅ Abonnements créés: ${fixedCount}`);
    console.log(`   ⏭️ Commandes ignorées: ${skippedCount}`);
    console.log(`   📝 Total commandes analysées: ${paidOrders.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la correction des abonnements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
fixMissingSubscriptions();
