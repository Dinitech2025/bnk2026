const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMissingPayments() {
  console.log('🔧 CORRECTION DES PAIEMENTS MANQUANTS');
  console.log('====================================');
  
  try {
    // Trouver les commandes PAID sans enregistrement de paiement
    const ordersWithoutPayments = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        payments: {
          none: {}
        }
      },
      include: {
        payments: true
      }
    });

    console.log(`📦 Commandes PAID sans paiement trouvées: ${ordersWithoutPayments.length}`);
    console.log('');

    for (const order of ordersWithoutPayments) {
      console.log(`🔧 Correction de la commande: ${order.orderNumber}`);
      console.log(`   Total: ${order.total} ${order.currency}`);
      console.log(`   Method: ${order.paymentMethod}`);
      console.log(`   Transaction: ${order.transactionId}`);

      // Créer l'enregistrement de paiement manquant
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: Number(order.total), // Convertir Decimal en Number
          currency: order.currency,
          method: order.paymentMethod || 'unknown',
          provider: order.paymentMethod === 'paypal' ? 'PAYPAL' : 'OTHER',
          status: 'COMPLETED',
          transactionId: order.transactionId,
          reference: order.orderNumber,
          notes: `Paiement rétroactif pour commande ${order.orderNumber}`,
          processedBy: order.userId, // L'utilisateur qui a passé la commande
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }
      });

      console.log(`   ✅ Paiement créé: ${payment.id} (${payment.amount} ${payment.currency})`);
      console.log('');
    }

    if (ordersWithoutPayments.length === 0) {
      console.log('✅ Aucune commande à corriger - tous les paiements sont déjà enregistrés');
    } else {
      console.log(`✅ ${ordersWithoutPayments.length} paiement(s) corrigé(s) avec succès !`);
    }

    // Vérification finale
    console.log('');
    console.log('🔍 VÉRIFICATION FINALE:');
    const remainingIssues = await prisma.order.count({
      where: {
        paymentStatus: 'PAID',
        payments: {
          none: {}
        }
      }
    });

    console.log(`   Commandes PAID sans paiement restantes: ${remainingIssues}`);
    
    if (remainingIssues === 0) {
      console.log('   ✅ Tous les paiements sont maintenant correctement enregistrés !');
    } else {
      console.log('   ❌ Il reste des problèmes à résoudre');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingPayments();
