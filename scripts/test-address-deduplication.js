#!/usr/bin/env node

// Test de la déduplication d'adresses
async function testAddressDeduplication() {
  console.log('🔄 TEST DÉDUPLICATION ADRESSES');
  console.log('==============================');
  console.log('');

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Vérifier l'état initial
    const initialAddresses = await prisma.address.findMany({
      where: { 
        user: { email: 'dinyoili@outlook.com' }
      }
    });

    console.log('📊 ÉTAT INITIAL:');
    console.log('   • Adresses existantes:', initialAddresses.length);
    console.log('');

    // Données de test avec la MÊME adresse
    const sameAddressData = {
      firstName: 'DINY',
      lastName: 'Oili',
      address: '162 LB Lazaret Nord',
      city: 'Diego',
      postalCode: '201',
      country: 'Madagascar',
      phone: '+261325550444'
    };

    // Test 1: Première commande avec cette adresse
    console.log('🧪 TEST 1: Première commande avec adresse');
    const order1Data = {
      items: [{
        id: 'test-dedup-1',
        name: 'Test Déduplication 1',
        price: 10000,
        quantity: 1,
        type: 'product',
        metadata: { name: 'Test Déduplication 1' }
      }],
      total: 10000,
      currency: 'Ar',
      shippingAddress: sameAddressData,
      billingAddress: sameAddressData,
      email: 'dinyoili@outlook.com',
      phone: '+261325550444',
      firstName: 'DINY',
      lastName: 'Oili',
      paymentData: {
        method: 'paypal',
        status: 'completed',
        transactionId: 'DEDUP-TEST-1-' + Date.now(),
        amount: 10000
      },
      notes: 'Test déduplication - Commande 1'
    };

    const response1 = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order1Data)
    });

    if (!response1.ok) {
      const error1 = await response1.json();
      console.log('❌ Erreur commande 1:', error1.error);
      return;
    }

    const result1 = await response1.json();
    console.log('✅ Commande 1 créée:', result1.order.orderNumber);

    // Vérifier les adresses après la première commande
    const addressesAfterOrder1 = await prisma.address.findMany({
      where: { 
        user: { email: 'dinyoili@outlook.com' }
      }
    });

    console.log('   • Adresses après commande 1:', addressesAfterOrder1.length);
    console.log('');

    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Deuxième commande avec la MÊME adresse
    console.log('🧪 TEST 2: Deuxième commande avec MÊME adresse');
    const order2Data = {
      ...order1Data,
      items: [{
        id: 'test-dedup-2',
        name: 'Test Déduplication 2',
        price: 20000,
        quantity: 1,
        type: 'product',
        metadata: { name: 'Test Déduplication 2' }
      }],
      total: 20000,
      paymentData: {
        method: 'paypal',
        status: 'completed',
        transactionId: 'DEDUP-TEST-2-' + Date.now(),
        amount: 20000
      },
      notes: 'Test déduplication - Commande 2 (même adresse)'
    };

    const response2 = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order2Data)
    });

    if (!response2.ok) {
      const error2 = await response2.json();
      console.log('❌ Erreur commande 2:', error2.error);
      return;
    }

    const result2 = await response2.json();
    console.log('✅ Commande 2 créée:', result2.order.orderNumber);

    // Vérifier les adresses après la deuxième commande
    const addressesAfterOrder2 = await prisma.address.findMany({
      where: { 
        user: { email: 'dinyoili@outlook.com' }
      }
    });

    console.log('   • Adresses après commande 2:', addressesAfterOrder2.length);
    console.log('');

    // Test 3: Troisième commande avec adresse DIFFÉRENTE
    console.log('🧪 TEST 3: Troisième commande avec adresse DIFFÉRENTE');
    const differentAddressData = {
      firstName: 'DINY',
      lastName: 'Oili',
      address: '456 Avenue Nouvelle',  // Adresse différente
      city: 'Antananarivo',           // Ville différente
      postalCode: '101',              // Code postal différent
      country: 'Madagascar',
      phone: '+261325550444'
    };

    const order3Data = {
      ...order1Data,
      items: [{
        id: 'test-dedup-3',
        name: 'Test Déduplication 3',
        price: 30000,
        quantity: 1,
        type: 'product',
        metadata: { name: 'Test Déduplication 3' }
      }],
      total: 30000,
      shippingAddress: differentAddressData,
      billingAddress: differentAddressData,
      paymentData: {
        method: 'paypal',
        status: 'completed',
        transactionId: 'DEDUP-TEST-3-' + Date.now(),
        amount: 30000
      },
      notes: 'Test déduplication - Commande 3 (adresse différente)'
    };

    const response3 = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order3Data)
    });

    if (!response3.ok) {
      const error3 = await response3.json();
      console.log('❌ Erreur commande 3:', error3.error);
      return;
    }

    const result3 = await response3.json();
    console.log('✅ Commande 3 créée:', result3.order.orderNumber);

    // Vérifier les adresses finales
    const finalAddresses = await prisma.address.findMany({
      where: { 
        user: { email: 'dinyoili@outlook.com' }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('   • Adresses après commande 3:', finalAddresses.length);
    console.log('');

    console.log('📋 RÉSUMÉ DES ADRESSES:');
    finalAddresses.forEach((addr, index) => {
      console.log(`   ${index + 1}. ${addr.street}, ${addr.city} ${addr.zipCode}`);
      console.log(`      Type: ${addr.type} | ID: ${addr.id}`);
    });
    console.log('');

    console.log('🎯 RÉSULTATS ATTENDUS:');
    console.log('   • Commande 1: Crée 2 nouvelles adresses (livraison + facturation)');
    console.log('   • Commande 2: Réutilise les adresses existantes (pas de création)');
    console.log('   • Commande 3: Crée 2 nouvelles adresses (adresse différente)');
    console.log('   • Total attendu: 4 adresses maximum');
    console.log('');

    const expectedAddresses = initialAddresses.length + 4; // 2 pour première commande + 2 pour troisième
    const actualAddresses = finalAddresses.length;

    console.log('🔍 VÉRIFICATION DÉDUPLICATION:');
    console.log('   • Adresses initiales:', initialAddresses.length);
    console.log('   • Adresses attendues:', expectedAddresses);
    console.log('   • Adresses réelles:', actualAddresses);
    
    if (actualAddresses <= expectedAddresses) {
      console.log('✅ DÉDUPLICATION FONCTIONNE !');
      console.log('   • Pas de doublons créés');
      console.log('   • Adresses réutilisées correctement');
    } else {
      console.log('❌ PROBLÈME DE DÉDUPLICATION');
      console.log('   • Trop d\'adresses créées');
      console.log('   • Doublons possibles');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAddressDeduplication();

