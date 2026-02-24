#!/usr/bin/env node

// Simuler exactement ce que fait le frontend avec le nouveau code
async function simulateFrontendCheckout() {
  console.log('🛒 SIMULATION CHECKOUT FRONTEND (NOUVEAU CODE)');
  console.log('==============================================');
  console.log('');

  // Simuler les données exactes du frontend avec adresse sélectionnée
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Récupérer l'adresse par défaut de l'utilisateur (comme le fait le frontend)
    const userAddresses = await prisma.address.findMany({
      where: { 
        userId: 'cmesb0otn0026fqfpnr6xg2oe', // Votre ID utilisateur
        street: { not: '' } // Adresses non vides
      },
      orderBy: { id: 'desc' }
    });

    if (userAddresses.length === 0) {
      console.log('❌ Aucune adresse utilisateur trouvée');
      return;
    }

    const selectedAddress = userAddresses[0]; // Première adresse (par défaut)
    console.log('📍 ADRESSE SÉLECTIONNÉE (comme dans le dropdown):');
    console.log('   • ID:', selectedAddress.id);
    console.log('   • Affichage:', `${selectedAddress.street}, ${selectedAddress.city} ${selectedAddress.zipCode}`);
    console.log('');

    // Simuler formData du frontend
    const formData = {
      firstName: 'DINY',
      lastName: 'Oili',
      email: 'dinyoili@outlook.com',
      phone: '+261325550444',
      selectedShippingAddressId: selectedAddress.id, // Adresse sélectionnée
      selectedBillingAddressId: selectedAddress.id,  // Même adresse pour facturation
      // Autres champs vides car adresse sélectionnée
      shippingAddress: '',
      shippingCity: '',
      shippingZipCode: '',
      shippingCountry: 'Madagascar'
    };

    // Simuler la logique du nouveau code checkout-content.tsx
    const shippingAddress = formData.selectedShippingAddressId !== 'new' && formData.selectedShippingAddressId 
      ? (() => {
          const selectedAddr = userAddresses.find(addr => addr.id === formData.selectedShippingAddressId);
          return selectedAddr ? {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: selectedAddr.street,        // ✅ NOUVEAU: street → address
            city: selectedAddr.city,
            postalCode: selectedAddr.zipCode,    // ✅ NOUVEAU: zipCode → postalCode
            country: selectedAddr.country,
            phone: selectedAddr.phoneNumber || formData.phone
          } : null;
        })()
      : {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.shippingAddress,
          city: formData.shippingCity,
          postalCode: formData.shippingZipCode,
          country: formData.shippingCountry,
          phone: formData.phone
        };

    console.log('📤 DONNÉES ENVOYÉES À L\'API (NOUVEAU MAPPING):');
    console.log('   • address:', shippingAddress.address);
    console.log('   • city:', shippingAddress.city);
    console.log('   • postalCode:', shippingAddress.postalCode);
    console.log('   • country:', shippingAddress.country);
    console.log('   • phone:', shippingAddress.phone);
    console.log('');

    // Créer la commande avec les nouvelles données
    const orderData = {
      items: [{
        id: 'frontend-test',
        name: 'Test Frontend Checkout',
        price: 50000,
        quantity: 1,
        type: 'product',
        metadata: { name: 'Test Frontend Checkout' }
      }],
      total: 50000,
      currency: 'Ar',
      shippingAddress: shippingAddress,
      billingAddress: shippingAddress, // Même adresse
      email: formData.email,
      phone: formData.phone,
      firstName: formData.firstName,
      lastName: formData.lastName,
      paymentData: {
        method: 'paypal',
        status: 'completed',
        transactionId: 'FRONTEND-SIM-' + Date.now(),
        amount: 50000
      },
      notes: 'Simulation frontend avec nouveau code'
    };

    console.log('🚀 ENVOI À L\'API...');
    const response = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ ERREUR API:', errorData.error);
      console.log('💡 CELA CONFIRME QUE LE SERVEUR UTILISE ENCORE L\'ANCIEN CODE');
      return;
    }

    const result = await response.json();
    console.log('✅ COMMANDE CRÉÉE:', result.order.orderNumber);
    console.log('');

    // Vérifier immédiatement les adresses
    const orderCheck = await prisma.order.findUnique({
      where: { id: result.order.id },
      include: {
        shippingAddress: true,
        billingAddress: true
      }
    });

    console.log('🔍 VÉRIFICATION ADRESSES:');
    if (orderCheck.shippingAddress?.street) {
      console.log('✅ LIVRAISON COMPLÈTE:');
      console.log('   •', orderCheck.shippingAddress.street);
      console.log('   •', orderCheck.shippingAddress.city, orderCheck.shippingAddress.zipCode);
    } else {
      console.log('❌ LIVRAISON VIDE');
    }

    if (orderCheck.billingAddress?.street) {
      console.log('✅ FACTURATION COMPLÈTE:');
      console.log('   •', orderCheck.billingAddress.street);
      console.log('   •', orderCheck.billingAddress.city, orderCheck.billingAddress.zipCode);
    } else {
      console.log('❌ FACTURATION VIDE');
    }

    console.log('');
    console.log('🎯 CONCLUSION:');
    const success = orderCheck.shippingAddress?.street && orderCheck.billingAddress?.street;
    if (success) {
      console.log('✅ LE NOUVEAU CODE FONCTIONNE !');
      console.log('   • Redémarrez le serveur pour l\'utiliser sur le frontend');
    } else {
      console.log('❌ LE SERVEUR UTILISE ENCORE L\'ANCIEN CODE');
      console.log('   • Redémarrage nécessaire');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simulateFrontendCheckout();

