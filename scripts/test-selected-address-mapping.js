#!/usr/bin/env node

// Test du mapping des adresses sélectionnées
async function testSelectedAddressMapping() {
  console.log('🔧 TEST MAPPING ADRESSES SÉLECTIONNÉES');
  console.log('====================================');
  console.log('');

  // Simuler les données exactes du checkout avec adresse sélectionnée
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Récupérer l'adresse par défaut de l'utilisateur
    const userAddress = await prisma.address.findFirst({
      where: { 
        userId: 'cmesb9zzw0001fqfp9qz8hqhc', // ID utilisateur dinyoili@outlook.com
        street: '162 LB Lazaret Nord'
      }
    });

    if (!userAddress) {
      console.log('❌ Adresse utilisateur non trouvée');
      return;
    }

    console.log('📋 ADRESSE TROUVÉE EN BASE:');
    console.log('   • ID:', userAddress.id);
    console.log('   • Type:', userAddress.type);
    console.log('   • Street (DB):', userAddress.street);
    console.log('   • City (DB):', userAddress.city);
    console.log('   • ZipCode (DB):', userAddress.zipCode);
    console.log('   • Country (DB):', userAddress.country);
    console.log('');

    // Simuler la transformation du checkout (AVANT correction)
    const oldMapping = {
      street: userAddress.street,      // ❌ Mauvais champ pour API
      city: userAddress.city,
      zipCode: userAddress.zipCode,    // ❌ Mauvais champ pour API
      country: userAddress.country
    };

    // Simuler la transformation du checkout (APRÈS correction)
    const newMapping = {
      firstName: 'DINY',
      lastName: 'Oili',
      address: userAddress.street,     // ✅ Bon champ pour API
      city: userAddress.city,
      postalCode: userAddress.zipCode, // ✅ Bon champ pour API
      country: userAddress.country,
      phone: userAddress.phoneNumber || '+261325550444'
    };

    console.log('❌ ANCIEN MAPPING (INCORRECT):');
    console.log('   • street:', oldMapping.street);
    console.log('   • city:', oldMapping.city);
    console.log('   • zipCode:', oldMapping.zipCode);
    console.log('   • country:', oldMapping.country);
    console.log('   → API reçoit: {street, zipCode} mais attend {address, postalCode}');
    console.log('');

    console.log('✅ NOUVEAU MAPPING (CORRECT):');
    console.log('   • address:', newMapping.address);
    console.log('   • city:', newMapping.city);
    console.log('   • postalCode:', newMapping.postalCode);
    console.log('   • country:', newMapping.country);
    console.log('   → API reçoit: {address, postalCode} comme attendu');
    console.log('');

    // Tester avec les nouvelles données
    const testOrderData = {
      items: [
        {
          id: 'test-mapping',
          name: 'Test Mapping Adresses',
          price: 100000,
          quantity: 1,
          type: 'product',
          metadata: {
            name: 'Test Mapping Adresses'
          }
        }
      ],
      total: 100000,
      currency: 'Ar',
      shippingAddress: newMapping,
      billingAddress: newMapping,
      email: 'dinyoili@outlook.com',
      phone: '+261325550444',
      firstName: 'DINY',
      lastName: 'Oili',
      paymentData: {
        method: 'paypal',
        status: 'completed',
        transactionId: 'MAPPING-TEST-' + Date.now(),
        amount: 100000
      },
      notes: 'Test correction mapping adresses'
    };

    console.log('🧪 TEST AVEC NOUVEAU MAPPING:');
    const response = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ ERREUR:', errorData.error);
      return;
    }

    const result = await response.json();
    console.log('✅ COMMANDE CRÉÉE:', result.order.orderNumber);
    console.log('');

    // Vérifier les adresses créées
    const orderWithAddresses = await prisma.order.findUnique({
      where: { id: result.order.id },
      include: {
        shippingAddress: true,
        billingAddress: true
      }
    });

    console.log('🔍 VÉRIFICATION ADRESSES SAUVEGARDÉES:');
    
    if (orderWithAddresses.shippingAddress) {
      console.log('✅ LIVRAISON:');
      console.log('   • Street:', orderWithAddresses.shippingAddress.street);
      console.log('   • City:', orderWithAddresses.shippingAddress.city);
      console.log('   • ZipCode:', orderWithAddresses.shippingAddress.zipCode);
      console.log('   • Country:', orderWithAddresses.shippingAddress.country);
    }

    if (orderWithAddresses.billingAddress) {
      console.log('✅ FACTURATION:');
      console.log('   • Street:', orderWithAddresses.billingAddress.street);
      console.log('   • City:', orderWithAddresses.billingAddress.city);
      console.log('   • ZipCode:', orderWithAddresses.billingAddress.zipCode);
      console.log('   • Country:', orderWithAddresses.billingAddress.country);
    }

    console.log('');
    console.log('🎯 RÉSULTAT:');
    const isComplete = orderWithAddresses.shippingAddress?.street && 
                      orderWithAddresses.shippingAddress?.city && 
                      orderWithAddresses.shippingAddress?.zipCode;
    
    console.log('   • Mapping corrigé:', isComplete ? '✅' : '❌');
    console.log('   • Adresses complètes:', isComplete ? '✅' : '❌');
    console.log('   • Prêt pour facture:', isComplete ? '✅' : '❌');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSelectedAddressMapping();

