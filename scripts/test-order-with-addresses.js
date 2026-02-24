#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrderWithAddresses() {
  console.log('🧪 TEST CRÉATION COMMANDE AVEC ADRESSES');
  console.log('=====================================');
  console.log('');

  try {
    // Simuler les données du checkout
    const testOrderData = {
      items: [
        {
          id: 'test-item-1',
          name: 'iPhone 15 Pro',
          price: 4575000,
          quantity: 1,
          type: 'product',
          metadata: {
            name: 'iPhone 15 Pro',
            description: 'Smartphone Apple'
          }
        }
      ],
      total: 4575000,
      currency: 'Ar',
      shippingAddress: {
        firstName: 'Jean',
        lastName: 'Dupont',
        address: '123 Rue de la Paix',
        city: 'Antananarivo',
        postalCode: '101',
        country: 'Madagascar',
        phone: '+261 34 12 345 67'
      },
      billingAddress: {
        firstName: 'Jean',
        lastName: 'Dupont',
        address: '456 Avenue de l\'Indépendance',
        city: 'Antananarivo',
        postalCode: '101',
        country: 'Madagascar',
        phone: '+261 34 12 345 67'
      },
      email: 'jean.dupont@example.com',
      phone: '+261 34 12 345 67',
      firstName: 'Jean',
      lastName: 'Dupont',
      paymentData: {
        method: 'paypal',
        status: 'completed',
        transactionId: 'TEST-' + Date.now(),
        amount: 4575000
      },
      notes: 'Commande de test avec adresses'
    };

    console.log('📦 Données de test préparées');
    console.log('   • Articles :', testOrderData.items.length);
    console.log('   • Total :', testOrderData.total.toLocaleString(), 'Ar');
    console.log('   • Adresse livraison :', testOrderData.shippingAddress.address);
    console.log('   • Adresse facturation :', testOrderData.billingAddress.address);
    console.log('');

    // Appeler l'API de création de commande
    const response = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur API: ${errorData.error}`);
    }

    const result = await response.json();
    console.log('✅ Commande créée avec succès !');
    console.log('   • ID :', result.order.id);
    console.log('   • Numéro :', result.order.orderNumber);
    console.log('');

    // Vérifier que les adresses ont été créées
    const orderWithAddresses = await prisma.order.findUnique({
      where: { id: result.order.id },
      include: {
        shippingAddress: true,
        billingAddress: true,
        items: true
      }
    });

    console.log('🔍 VÉRIFICATION DES ADRESSES :');
    console.log('');

    if (orderWithAddresses.addressId && orderWithAddresses.shippingAddress) {
      console.log('✅ Adresse de livraison créée :');
      console.log('   • ID :', orderWithAddresses.addressId);
      console.log('   • Nom :', orderWithAddresses.shippingAddress.firstName, orderWithAddresses.shippingAddress.lastName);
      console.log('   • Adresse :', orderWithAddresses.shippingAddress.address);
      console.log('   • Ville :', orderWithAddresses.shippingAddress.city);
    } else {
      console.log('❌ Adresse de livraison manquante');
    }

    if (orderWithAddresses.billingAddressId && orderWithAddresses.billingAddress) {
      console.log('✅ Adresse de facturation créée :');
      console.log('   • ID :', orderWithAddresses.billingAddressId);
      console.log('   • Nom :', orderWithAddresses.billingAddress.firstName, orderWithAddresses.billingAddress.lastName);
      console.log('   • Adresse :', orderWithAddresses.billingAddress.address);
      console.log('   • Ville :', orderWithAddresses.billingAddress.city);
    } else {
      console.log('❌ Adresse de facturation manquante');
    }

    console.log('');
    console.log('🔍 VÉRIFICATION DES ARTICLES :');
    orderWithAddresses.items.forEach((item, index) => {
      let itemName = 'Article inconnu';
      if (item.metadata) {
        try {
          const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
          itemName = metadata.name || itemName;
        } catch (e) {
          // Ignorer
        }
      }
      console.log(`   ${index + 1}. ${itemName} (${item.quantity}x ${Number(item.unitPrice).toLocaleString()} Ar)`);
    });

    console.log('');
    console.log('🎯 RÉSULTAT :');
    console.log('   • Commande :', orderWithAddresses.orderNumber);
    console.log('   • Adresses :', orderWithAddresses.addressId ? '✅' : '❌', 'Livraison,', orderWithAddresses.billingAddressId ? '✅' : '❌', 'Facturation');
    console.log('   • Articles :', orderWithAddresses.items.length, 'article(s)');

  } catch (error) {
    console.error('❌ Erreur lors du test :', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderWithAddresses();

