const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEnhancedCheckout() {
  console.log('🧪 Test du système de checkout amélioré...\n');

  try {
    // Générer un email unique
    const timestamp = Date.now();
    const uniqueEmail = `test.checkout.${timestamp}@example.com`;

    // 1. Préparer des données de test
    const testOrder = {
      customer: {
        email: uniqueEmail,
        phone: '0321234567',
        firstName: 'Test',
        lastName: 'Checkout',
        createAccount: true,
        newsletter: true
      },
      billingAddress: {
        street: '123 Rue de la Facturation, Quartier Centre',
        city: 'Antananarivo',
        zipCode: '101',
        country: 'Madagascar'
      },
      shippingAddress: {
        street: '456 Avenue de Livraison, Quartier Nord',
        city: 'Antsirabe',
        zipCode: '110',
        country: 'Madagascar'
      },
      items: [
        {
          id: 'cmcdhbbuc0086jv0u6wtq76x5', // ID de la souris sans fil
          name: 'Souris sans fil',
          price: 45000,
          quantity: 1,
          type: 'product',
          productId: 'cmcdhbbuc0086jv0u6wtq76x5' // Ajouter l'ID produit explicitement
        }
      ],
      total: 45000,
      currency: 'MGA',
      paymentMethod: 'mobile_money',
      notes: 'Test de commande avec adresses séparées et création de compte',
      timestamp: new Date().toISOString()
    };

    console.log('📦 Données de test préparées:');
    console.log(`- Client: ${testOrder.customer.firstName} ${testOrder.customer.lastName}`);
    console.log(`- Email: ${testOrder.customer.email}`);
    console.log(`- Facturation: ${testOrder.billingAddress.city}`);
    console.log(`- Livraison: ${testOrder.shippingAddress.city}`);
    console.log(`- Total: ${testOrder.total} Ar`);

    // 2. Tester l'API de commande
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

    // 3. Vérifier la création de l'utilisateur
    console.log('\n👤 Vérification de l\'utilisateur...');
    
    const user = await prisma.user.findUnique({
      where: { email: testOrder.customer.email },
      include: {
        addresses: true,
        orders: {
          include: {
            items: {
              include: {
                product: true
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
      console.log(`- Téléphone: ${user.phone}`);
      console.log(`- Newsletter: ${user.newsletter}`);
      console.log(`- Adresses: ${user.addresses.length}`);
      console.log(`- Commandes: ${user.orders.length}`);

      // 4. Vérifier les adresses
      console.log('\n🏠 Vérification des adresses...');
      user.addresses.forEach((address, index) => {
        console.log(`${index + 1}. ${address.type}:`);
        console.log(`   - Rue: ${address.street}`);
        console.log(`   - Ville: ${address.city}`);
        console.log(`   - Code postal: ${address.zipCode}`);
        console.log(`   - Pays: ${address.country}`);
      });

      // 5. Vérifier la commande
      if (user.orders.length > 0) {
        const order = user.orders[0];
        console.log('\n📋 Vérification de la commande:');
        console.log(`- Numéro: ${order.orderNumber}`);
        console.log(`- Status: ${order.status}`);
        console.log(`- Total: ${order.total} Ar`);
        console.log(`- Articles: ${order.items.length}`);

        order.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.product?.name || 'Produit inconnu'}`);
          console.log(`     - Type: ${item.itemType}`);
          console.log(`     - Quantité: ${item.quantity}`);
          console.log(`     - Prix: ${item.totalPrice} Ar`);
          
          // Afficher les métadonnées
          if (item.metadata) {
            try {
              const metadata = JSON.parse(item.metadata);
              console.log(`     - Notes: ${metadata.notes || 'Aucune'}`);
              console.log(`     - Paiement: ${metadata.paymentMethod}`);
            } catch (e) {
              console.log(`     - Métadonnées: ${item.metadata}`);
            }
          }
        });
      }

      console.log('\n✅ Test réussi ! Le système de checkout amélioré fonctionne correctement.');
      
      // 6. Nettoyer les données de test
      console.log('\n🧹 Nettoyage des données de test...');
      
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

testEnhancedCheckout(); 