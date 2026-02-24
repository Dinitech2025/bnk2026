const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrderDetails() {
  console.log('🧪 Test des détails de commande...\n');

  try {
    // 1. Récupérer une commande existante
    const order = await prisma.order.findFirst({
      include: {
        user: true,
        items: {
          include: {
            offer: true,
            product: true,
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!order) {
      console.log('❌ Aucune commande trouvée');
      return;
    }

    console.log('✅ Commande trouvée:');
    console.log(`- ID: ${order.id}`);
    console.log(`- Numéro: ${order.orderNumber || 'N/A'}`);
    console.log(`- Client: ${order.user.firstName} ${order.user.lastName}`);
    console.log(`- Email: ${order.user.email}`);
    console.log(`- Total: ${order.total} Ar`);
    console.log(`- Status: ${order.status}`);
    console.log(`- Articles: ${order.items.length}`);
    console.log(`- Créée le: ${order.createdAt.toLocaleDateString('fr-FR')}`);

    // 2. Tester l'API directement
    console.log('\n🌐 Test de l\'API...');
    
    const response = await fetch(`http://localhost:3000/api/admin/orders/${order.id}`);
    console.log(`- Status API: ${response.status}`);
    
    if (response.ok) {
      const apiData = await response.json();
      console.log('✅ API fonctionne correctement');
      console.log(`- Données retournées: ${Object.keys(apiData).length} champs`);
    } else {
      console.log('❌ Erreur API:', response.statusText);
    }

    // 3. Afficher les détails des articles
    console.log('\n📦 Détails des articles:');
    order.items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.offer?.name || item.product?.name || item.service?.name}`);
      console.log(`   - Type: ${item.itemType}`);
      console.log(`   - Quantité: ${item.quantity}`);
      console.log(`   - Prix unitaire: ${item.unitPrice} Ar`);
      console.log(`   - Total: ${item.totalPrice} Ar`);
      
      if (item.metadata) {
        try {
          const metadata = JSON.parse(item.metadata);
          console.log(`   - Métadonnées: ${Object.keys(metadata).join(', ')}`);
        } catch (e) {
          console.log(`   - Métadonnées: ${item.metadata.substring(0, 50)}...`);
        }
      }
    });

    console.log('\n✅ Test terminé avec succès !');
    console.log(`\n🔗 URL admin: http://localhost:3000/admin/orders/${order.id}`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderDetails(); 