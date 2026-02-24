#!/usr/bin/env node

// Test de création de commande avec adresses complètes depuis le checkout
async function testCheckoutWithCompleteAddresses() {
  console.log('🛒 TEST CHECKOUT AVEC ADRESSES COMPLÈTES');
  console.log('=======================================');
  console.log('');

  // Simuler les données exactes du checkout avec adresses remplies
  const checkoutData = {
    items: [
      {
        id: 'test-product-checkout',
        name: 'T-shirt Premium',
        price: 25168000, // 25,168,000 Ar
        quantity: 1,
        type: 'product',
        metadata: {
          name: 'T-shirt Premium',
          description: 'T-shirt de qualité premium'
        }
      }
    ],
    total: 25168000,
    currency: 'Ar',
    
    // ADRESSES COMPLÈTES (comme si l'utilisateur avait rempli le formulaire)
    shippingAddress: {
      firstName: 'DINY',
      lastName: 'Oili',
      address: '162 LB Lazaret Nord', // Adresse complète
      city: 'Diego',                  // Ville complète
      postalCode: '201',              // Code postal
      country: 'Madagascar',
      phone: '+261325550444'
    },
    billingAddress: {
      firstName: 'DINY',
      lastName: 'Oili',
      address: '162 LB Lazaret Nord', // Adresse complète
      city: 'Diego',                  // Ville complète
      postalCode: '201',              // Code postal
      country: 'Madagascar',
      phone: '+261325550444'
    },
    
    // Informations client
    email: 'dinyoili@outlook.com',
    phone: '+261325550444',
    firstName: 'DINY',
    lastName: 'Oili',
    
    // Données de paiement
    paymentData: {
      method: 'paypal',
      status: 'completed',
      transactionId: 'CHECKOUT-TEST-' + Date.now(),
      paypalOrderId: 'PAYPAL-' + Date.now(),
      amount: 25168000
    },
    
    notes: 'Test checkout avec adresses complètes',
    
    // Taux de change
    exchangeRates: {
      'EUR': 0.000196,
      'USD': 0.000214,
      'GBP': 0.000168
    },
    baseCurrency: 'MGA',
    displayCurrency: 'Ar'
  };

  console.log('📤 Simulation données checkout complètes:');
  console.log('   • Client:', checkoutData.firstName, checkoutData.lastName);
  console.log('   • Email:', checkoutData.email);
  console.log('   • Adresse livraison:', checkoutData.shippingAddress.address, checkoutData.shippingAddress.city);
  console.log('   • Adresse facturation:', checkoutData.billingAddress.address, checkoutData.billingAddress.city);
  console.log('   • Total:', checkoutData.total.toLocaleString(), 'Ar');
  console.log('');

  try {
    const response = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData)
    });

    console.log('📡 Réponse API:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ ERREUR:');
      console.log('   • Status:', response.status);
      console.log('   • Error:', errorData.error);
      console.log('   • Details:', errorData.details);
      return;
    }

    const result = await response.json();
    console.log('✅ COMMANDE CRÉÉE AVEC SUCCÈS !');
    console.log('   • ID:', result.order.id);
    console.log('   • Numéro:', result.order.orderNumber);
    console.log('');

    // Vérifier immédiatement les adresses créées
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const orderWithAddresses = await prisma.order.findUnique({
      where: { id: result.order.id },
      include: {
        shippingAddress: true,
        billingAddress: true
      }
    });

    console.log('🔍 VÉRIFICATION ADRESSES CRÉÉES:');
    console.log('');

    if (orderWithAddresses.shippingAddress) {
      console.log('✅ ADRESSE LIVRAISON:');
      console.log('   • Rue:', orderWithAddresses.shippingAddress.street);
      console.log('   • Ville:', orderWithAddresses.shippingAddress.city);
      console.log('   • Code postal:', orderWithAddresses.shippingAddress.zipCode);
      console.log('   • Pays:', orderWithAddresses.shippingAddress.country);
    } else {
      console.log('❌ Adresse livraison manquante');
    }

    if (orderWithAddresses.billingAddress) {
      console.log('✅ ADRESSE FACTURATION:');
      console.log('   • Rue:', orderWithAddresses.billingAddress.street);
      console.log('   • Ville:', orderWithAddresses.billingAddress.city);
      console.log('   • Code postal:', orderWithAddresses.billingAddress.zipCode);
      console.log('   • Pays:', orderWithAddresses.billingAddress.country);
    } else {
      console.log('❌ Adresse facturation manquante');
    }

    console.log('');
    console.log('🎯 RÉSULTAT:');
    const shippingComplete = orderWithAddresses.shippingAddress && 
      orderWithAddresses.shippingAddress.street && 
      orderWithAddresses.shippingAddress.city && 
      orderWithAddresses.shippingAddress.zipCode;
    
    const billingComplete = orderWithAddresses.billingAddress && 
      orderWithAddresses.billingAddress.street && 
      orderWithAddresses.billingAddress.city && 
      orderWithAddresses.billingAddress.zipCode;

    console.log('   • Adresses complètes:', shippingComplete && billingComplete ? '✅' : '❌');
    console.log('   • Prêt pour facture:', shippingComplete && billingComplete ? '✅' : '❌');

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testCheckoutWithCompleteAddresses();

