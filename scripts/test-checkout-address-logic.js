#!/usr/bin/env node

// Test de la logique d'adresse du checkout
async function testCheckoutAddressLogic() {
  console.log('🧪 TEST LOGIQUE ADRESSES CHECKOUT');
  console.log('=================================');
  console.log('');

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Récupérer les adresses de l'utilisateur
    const userAddresses = await prisma.address.findMany({
      where: { 
        user: { email: 'dinyoili@outlook.com' }
      }
    });

    console.log('📍 ADRESSES DISPONIBLES:');
    userAddresses.forEach((addr, index) => {
      console.log(`   ${index + 1}. ${addr.street}, ${addr.city} ${addr.zipCode} (${addr.type})`);
      console.log(`      ID: ${addr.id}`);
    });
    console.log('');

    // Simuler le cas : Adresse de facturation sélectionnée + case cochée
    const billingAddress = userAddresses.find(addr => addr.street && addr.street !== '');
    
    if (!billingAddress) {
      console.log('❌ Aucune adresse valide trouvée');
      return;
    }

    console.log('📋 SCÉNARIO DE TEST:');
    console.log('   • Adresse de facturation sélectionnée:', billingAddress.street);
    console.log('   • Case "Identique à l\'adresse de livraison" cochée');
    console.log('   • Attente: Livraison = Facturation');
    console.log('');

    // Simuler formData
    const formData = {
      firstName: 'DINY',
      lastName: 'Oili',
      email: 'dinyoili@outlook.com',
      phone: '+261325550444',
      
      // Adresse de livraison (pas sélectionnée car on veut utiliser celle de facturation)
      selectedShippingAddressId: '', // Vide
      shippingAddress: '',
      shippingCity: '',
      shippingZipCode: '',
      shippingCountry: 'Madagascar',
      
      // Adresse de facturation sélectionnée
      selectedBillingAddressId: billingAddress.id,
      billingAddress: '',
      billingCity: '',
      billingZipCode: '',
      billingCountry: 'Madagascar'
    };

    const sameAsbilling = true; // Case cochée

    console.log('🔍 LOGIQUE ACTUELLE:');
    console.log('   • sameAsbilling =', sameAsbilling);
    console.log('   • selectedShippingAddressId =', formData.selectedShippingAddressId || 'VIDE');
    console.log('   • selectedBillingAddressId =', formData.selectedBillingAddressId);
    console.log('');

    // Simuler la logique actuelle du checkout
    let shippingAddress, billingAddressResult;

    // Logique pour shipping address (actuelle)
    shippingAddress = formData.selectedShippingAddressId !== 'new' && formData.selectedShippingAddressId 
      ? (() => {
          const selectedAddr = userAddresses.find(addr => addr.id === formData.selectedShippingAddressId);
          return selectedAddr ? {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: selectedAddr.street,
            city: selectedAddr.city,
            postalCode: selectedAddr.zipCode,
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

    // Logique pour billing address (actuelle)
    billingAddressResult = sameAsbilling 
      ? shippingAddress // Utilise l'adresse de livraison
      : (formData.selectedBillingAddressId !== 'new' && formData.selectedBillingAddressId 
          ? (() => {
              const selectedAddr = userAddresses.find(addr => addr.id === formData.selectedBillingAddressId);
              return selectedAddr ? {
                firstName: formData.firstName,
                lastName: formData.lastName,
                address: selectedAddr.street,
                city: selectedAddr.city,
                postalCode: selectedAddr.zipCode,
                country: selectedAddr.country,
                phone: selectedAddr.phoneNumber || formData.phone
              } : null;
            })()
          : {
              firstName: formData.firstName,
              lastName: formData.lastName,
              address: formData.billingAddress,
              city: formData.billingCity,
              postalCode: formData.billingZipCode,
              country: formData.billingCountry,
              phone: formData.phone
            });

    console.log('📤 RÉSULTAT ACTUEL:');
    console.log('   🚚 LIVRAISON:');
    if (shippingAddress && shippingAddress.address) {
      console.log('      •', shippingAddress.address);
      console.log('      •', shippingAddress.city, shippingAddress.postalCode);
    } else {
      console.log('      • VIDE (champs manuels non remplis)');
    }

    console.log('   🧾 FACTURATION:');
    if (billingAddressResult && billingAddressResult.address) {
      console.log('      •', billingAddressResult.address);
      console.log('      •', billingAddressResult.city, billingAddressResult.postalCode);
    } else {
      console.log('      • VIDE');
    }

    console.log('');
    console.log('❌ PROBLÈME IDENTIFIÉ:');
    console.log('   • Vous voulez: Livraison = Facturation sélectionnée');
    console.log('   • Logique actuelle: Facturation = Livraison (souvent vide)');
    console.log('   • Résultat: Les deux adresses sont vides ou incorrectes');
    console.log('');

    console.log('💡 SOLUTION NÉCESSAIRE:');
    console.log('   • Inverser la logique de la case à cocher');
    console.log('   • Ou ajouter une option "Livraison = Facturation"');
    console.log('   • Ou permettre de sélectionner quelle adresse copier');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCheckoutAddressLogic();

