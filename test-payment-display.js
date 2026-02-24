const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPaymentDisplay() {
  console.log('Test de l\'affichage du mode de paiement dans la liste des commandes');
  console.log('='.repeat(70));

  try {
    const orders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true 
          } 
        },
        items: {
          include: {
            offer: { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } }
          }
        }
      }
    });

    console.log(`\n${orders.length} commandes récentes:\n`);

    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderNumber || order.id.substring(0, 8)}`);
      console.log(`   Client: ${order.user.firstName} ${order.user.lastName}`);
      console.log(`   Statut: ${order.status}`);
      
      let paymentMethod = 'Non spécifié';
      if (order.items && order.items.length > 0 && order.items[0].metadata) {
        try {
          const metadata = JSON.parse(order.items[0].metadata);
          if (metadata.paymentMethod) {
            const methods = {
              'mobile_money': 'Mobile Money',
              'bank_transfer': 'Virement bancaire',
              'cash_on_delivery': 'Paiement à la livraison',
              'credit_card': 'Carte bancaire',
              'card': 'Carte bancaire'
            };
            paymentMethod = methods[metadata.paymentMethod] || metadata.paymentMethod;
          }
        } catch (e) {
          console.log(`   Erreur parsing métadonnées: ${e.message}`);
        }
      }
      
      console.log(`   Mode de paiement: ${paymentMethod}`);
      console.log('');
    });

    if (orders.length === 0) {
      console.log('Aucune commande trouvée.');
    } else {
      console.log('Test terminé ! Vérifiez l\'affichage sur: http://localhost:3000/admin/orders');
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentDisplay(); 