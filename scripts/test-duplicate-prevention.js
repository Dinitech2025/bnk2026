#!/usr/bin/env node

// Test simple de prévention des doublons
async function testDuplicatePrevention() {
  console.log('🧪 TEST PRÉVENTION DOUBLONS');
  console.log('===========================');
  console.log('');

  // Créer 2 commandes avec exactement la même adresse
  const sameAddress = {
    firstName: 'DINY',
    lastName: 'Oili',
    address: '789 Rue Test Doublon',
    city: 'Test City',
    postalCode: '999',
    country: 'Madagascar',
    phone: '+261325550444'
  };

  console.log('📍 ADRESSE DE TEST:');
  console.log('   •', sameAddress.address);
  console.log('   •', sameAddress.city, sameAddress.postalCode);
  console.log('');

  try {
    // Commande 1
    console.log('🛒 COMMANDE 1...');
    const order1 = {
      items: [{
        id: 'test-dup-1',
        name: 'Test Doublon 1',
        price: 5000,
        quantity: 1,
        type: 'product',
        metadata: { name: 'Test Doublon 1' }
      }],
      total: 5000,
      currency: 'Ar',
      shippingAddress: sameAddress,
      billingAddress: sameAddress,
      email: 'dinyoili@outlook.com',
      phone: '+261325550444',
      firstName: 'DINY',
      lastName: 'Oili',
      paymentData: {
        method: 'paypal',
        status: 'completed',
        transactionId: 'DUP-TEST-1-' + Date.now(),
        amount: 5000
      },
      notes: 'Test doublon - Commande 1'
    };

    const response1 = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order1)
    });

    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ Commande 1:', result1.order.orderNumber);
    } else {
      console.log('❌ Erreur commande 1');
      return;
    }

    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Commande 2 avec EXACTEMENT la même adresse
    console.log('🛒 COMMANDE 2 (même adresse)...');
    const order2 = {
      ...order1,
      items: [{
        id: 'test-dup-2',
        name: 'Test Doublon 2',
        price: 7500,
        quantity: 1,
        type: 'product',
        metadata: { name: 'Test Doublon 2' }
      }],
      total: 7500,
      paymentData: {
        method: 'paypal',
        status: 'completed',
        transactionId: 'DUP-TEST-2-' + Date.now(),
        amount: 7500
      },
      notes: 'Test doublon - Commande 2 (même adresse)'
    };

    const response2 = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order2)
    });

    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ Commande 2:', result2.order.orderNumber);
    } else {
      console.log('❌ Erreur commande 2');
      return;
    }

    console.log('');
    console.log('🔍 VÉRIFICATION...');
    
    // Vérifier les adresses
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const addresses = await prisma.address.findMany({
      where: {
        user: { email: 'dinyoili@outlook.com' },
        street: '789 Rue Test Doublon'
      }
    });

    console.log('📊 RÉSULTAT:');
    console.log('   • Adresses "789 Rue Test Doublon":', addresses.length);
    
    if (addresses.length <= 2) {
      console.log('✅ DÉDUPLICATION RÉUSSIE !');
      console.log('   • Pas de doublons créés');
      console.log('   • Adresses réutilisées correctement');
    } else {
      console.log('❌ PROBLÈME - Trop d\'adresses créées');
      addresses.forEach((addr, index) => {
        console.log(`   ${index + 1}. ${addr.type} - ID: ${addr.id}`);
      });
    }

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDuplicatePrevention();

