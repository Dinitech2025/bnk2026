const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testServiceCheckout() {
  console.log('🧪 Test de checkout avec service - Correction du problème\n');

  try {
    // Données de test avec le service "Création logo professionnel"
    const testData = {
      customer: {
        email: `test.service.${Date.now()}@example.com`,
        phone: '0321234567',
        firstName: 'Test',
        lastName: 'Service',
        createAccount: true,
        newsletter: false
      },
      billingAddress: {
        street: '123 Rue Test',
        city: 'Antananarivo',
        zipCode: '101',
        country: 'Madagascar'
      },
      shippingAddress: {
        street: '123 Rue Test',
        city: 'Antananarivo',
        zipCode: '101',
        country: 'Madagascar'
      },
      items: [
        {
          id: 'cmcdhidd100a3jv0ua0u0xafy',
          name: 'Création logo professionnel',
          price: 100000,
          quantity: 1,
          type: 'service',
          serviceId: 'cmcdhidd100a3jv0ua0u0xafy'
        }
      ],
      total: 100000,
      currency: 'Ar',
      paymentMethod: 'bank_transfer',
      notes: 'Test de service avec type correct',
      timestamp: new Date().toISOString()
    };

    console.log('📦 Données de test préparées:');
    console.log(`- Service: ${testData.items[0].name}`);
    console.log(`- Type: ${testData.items[0].type}`);
    console.log(`- Service ID: ${testData.items[0].serviceId}`);
    console.log(`- Prix: ${testData.items[0].price} Ar`);

    // Vérifier que le service existe
    const service = await prisma.service.findUnique({
      where: { id: 'cmcdhidd100a3jv0ua0u0xafy' },
      select: { id: true, name: true, price: true, published: true }
    });

    if (!service) {
      console.log('❌ Service non trouvé en base de données');
      return;
    }

    console.log(`✅ Service vérifié: ${service.name} (${service.price} Ar)`);

    // Test de l'API
    console.log('\n🌐 Test de l\'API de commande...');
    
    const response = await fetch('http://localhost:3000/api/public/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Commande créée avec succès !');
      console.log(`- Numéro: ${result.orderNumber}`);
      console.log(`- ID: ${result.orderId}`);
      console.log(`- Compte créé: ${result.accountCreated}`);

      // Vérifier la commande en base
      const order = await prisma.order.findUnique({
        where: { id: result.orderId },
        include: {
          items: {
            include: {
              service: { select: { id: true, name: true } }
            }
          },
          user: { select: { email: true, firstName: true, lastName: true } }
        }
      });

      if (order) {
        console.log('\n📋 Vérification de la commande:');
        console.log(`- Status: ${order.status}`);
        console.log(`- Total: ${order.total} Ar`);
        console.log(`- Items: ${order.items.length}`);
        
        order.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.service?.name || 'N/A'}`);
          console.log(`     - Type: ${item.itemType}`);
          console.log(`     - Service ID: ${item.serviceId}`);
          console.log(`     - Prix: ${item.unitPrice} Ar`);
          console.log(`     - Quantité: ${item.quantity}`);
        });

        console.log('\n✅ Test réussi ! Le service est correctement traité.');
      }

    } else {
      console.log('❌ Erreur API:');
      console.log(result);
    }

    // Nettoyage
    console.log('\n🧹 Nettoyage des données de test...');
    if (result.orderId) {
      await prisma.order.delete({ where: { id: result.orderId } });
    }
    
    const user = await prisma.user.findUnique({ where: { email: testData.customer.email } });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    
    console.log('✅ Données de test nettoyées');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testServiceCheckout(); 