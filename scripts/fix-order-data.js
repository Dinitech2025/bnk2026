const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOrderData() {
  console.log('🔧 Correction des données de commande...\n');

  try {
    const orderId = 'cmcdyfu9n0006jp0v0vni2bfq';
    
    // 1. Récupérer la commande
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      console.log('❌ Commande non trouvée');
      return;
    }

    console.log('📋 Commande actuelle:');
    console.log(`- ID: ${order.id}`);
    console.log(`- Numéro: ${order.orderNumber}`);
    console.log(`- Client: ${order.user.firstName} ${order.user.lastName}`);
    console.log(`- Articles: ${order.items.length}`);

    // 2. Récupérer le produit "Souris sans fil" existant
    const product = await prisma.product.findFirst({
      where: {
        name: {
          contains: 'Souris sans fil'
        },
        published: true
      }
    });

    if (!product) {
      console.log('❌ Produit "Souris sans fil" non trouvé');
      return;
    }

    console.log(`✅ Produit trouvé: ${product.name} (${product.price} Ar)`);

    // 3. Corriger l'article de commande
    const orderItem = order.items[0];
    if (orderItem) {
      const updatedItem = await prisma.orderItem.update({
        where: { id: orderItem.id },
        data: {
          itemType: 'PRODUCT',
          productId: product.id,
          offerId: null, // S'assurer que offerId est null
          metadata: JSON.stringify({
            type: 'product',
            category: 'electronique',
            subcategory: 'peripherique',
            description: 'Souris sans fil ergonomique'
          })
        }
      });

      console.log('✅ Article corrigé avec succès');
    }

    // 4. Vérifier le résultat
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            offer: true
          }
        }
      }
    });

    console.log('\n🎉 Commande corrigée:');
    updatedOrder.items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.product?.name || item.offer?.name || 'Article sans nom'}`);
      console.log(`   - Type: ${item.itemType}`);
      console.log(`   - Prix: ${item.totalPrice} Ar`);
      console.log(`   - Produit ID: ${item.productId || 'N/A'}`);
      console.log(`   - Offre ID: ${item.offerId || 'N/A'}`);
      if (item.metadata) {
        try {
          const metadata = JSON.parse(item.metadata);
          console.log(`   - Métadonnées: ${JSON.stringify(metadata, null, 2)}`);
        } catch (e) {
          console.log(`   - Métadonnées: ${item.metadata}`);
        }
      }
    });

    console.log('\n✅ Correction terminée avec succès !');
    console.log(`\n🔗 URL admin: http://localhost:3000/admin/orders/${order.id}`);

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrderData(); 