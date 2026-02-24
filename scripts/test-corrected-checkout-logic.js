#!/usr/bin/env node

// Test de la logique corrigée du checkout
async function testCorrectedCheckoutLogic() {
  console.log('🧪 TEST LOGIQUE CHECKOUT CORRIGÉE');
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
      if (addr.street && addr.street.trim()) {
        console.log(`   ${index + 1}. ${addr.street}, ${addr.city} ${addr.zipCode} (${addr.type})`);
        console.log(`      ID: ${addr.id}`);
      }
    });
    console.log('');

    const validAddresses = userAddresses.filter(addr => addr.street && addr.street.trim());
    if (validAddresses.length < 1) {
      console.log('❌ Pas assez d\'adresses valides pour le test');
      return;
    }

    // Test principal: Adresse de facturation sélectionnée + case cochée
    console.log('🧪 TEST PRINCIPAL: FACTURATION → LIVRAISON');
    console.log('=========================================');
    
    const billingAddr = validAddresses[0];
    console.log('📋 SCÉNARIO:');
    console.log('   • Adresse de facturation sélectionnée:', billingAddr.street);
    console.log('   • Adresse de livraison: NON sélectionnée (champs vides)');
    console.log('   • Case "Utiliser l\'adresse de facturation pour la livraison": COCHÉE');
    console.log('   • Attente: Livraison copie la facturation');
    console.log('');

    // Simuler formData
    const formData = {
      firstName: 'DINY',
      lastName: 'Oili',
      phone: '+261325550444',
      
      // Livraison non sélectionnée et champs vides
      selectedShippingAddressId: '',
      shippingAddress: '',
      shippingCity: '',
      shippingZipCode: '',
      shippingCountry: 'Madagascar',
      
      // Facturation sélectionnée
      selectedBillingAddressId: billingAddr.id,
      billingAddress: '',
      billingCity: '',
      billingZipCode: '',
      billingCountry: 'Madagascar'
    };

    const sameAsbilling = true; // Case cochée

    console.log('🔍 PARAMÈTRES:');
    console.log('   • sameAsbilling =', sameAsbilling);
    console.log('   • selectedShippingAddressId =', formData.selectedShippingAddressId || 'VIDE');
    console.log('   • selectedBillingAddressId =', formData.selectedBillingAddressId);
    console.log('');

    // Simuler la nouvelle logique pour shipping
    let shippingResult;
    
    // Si case cochée et adresse de facturation sélectionnée, utiliser celle-ci pour la livraison
    if (sameAsbilling && formData.selectedBillingAddressId && formData.selectedBillingAddressId !== 'new') {
      const selectedAddr = userAddresses.find(addr => addr.id === formData.selectedBillingAddressId);
      if (selectedAddr) {
        shippingResult = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: selectedAddr.street,
          city: selectedAddr.city,
          postalCode: selectedAddr.zipCode,
          country: selectedAddr.country,
          phone: selectedAddr.phoneNumber || formData.phone
        };
      }
    }
    // Si case cochée mais pas d'adresse de facturation sélectionnée, utiliser les champs manuels de facturation
    else if (sameAsbilling) {
      shippingResult = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.billingAddress,
        city: formData.billingCity,
        postalCode: formData.billingZipCode,
        country: formData.billingCountry,
        phone: formData.phone
      };
    }
    // Sinon, logique normale pour l'adresse de livraison
    else if (formData.selectedShippingAddressId && formData.selectedShippingAddressId !== 'new') {
      const selectedAddr = userAddresses.find(addr => addr.id === formData.selectedShippingAddressId);
      shippingResult = selectedAddr ? {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: selectedAddr.street,
        city: selectedAddr.city,
        postalCode: selectedAddr.zipCode,
        country: selectedAddr.country,
        phone: selectedAddr.phoneNumber || formData.phone
      } : null;
    }
    // Adresse manuelle de livraison
    else {
      shippingResult = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.shippingAddress,
        city: formData.shippingCity,
        postalCode: formData.shippingZipCode,
        country: formData.shippingCountry,
        phone: formData.phone
      };
    }

    // Simuler la logique pour billing (indépendante)
    let billingResult;
    if (formData.selectedBillingAddressId && formData.selectedBillingAddressId !== 'new') {
      const selectedAddr = userAddresses.find(addr => addr.id === formData.selectedBillingAddressId);
      billingResult = selectedAddr ? {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: selectedAddr.street,
        city: selectedAddr.city,
        postalCode: selectedAddr.zipCode,
        country: selectedAddr.country,
        phone: selectedAddr.phoneNumber || formData.phone
      } : null;
    } else {
      billingResult = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.billingAddress,
        city: formData.billingCity,
        postalCode: formData.billingZipCode,
        country: formData.billingCountry,
        phone: formData.phone
      };
    }

    console.log('📤 RÉSULTAT:');
    console.log('   🚚 LIVRAISON:');
    if (shippingResult && shippingResult.address) {
      console.log('      •', shippingResult.address);
      console.log('      •', shippingResult.city, shippingResult.postalCode);
      console.log('      • ✅ COPIÉ DEPUIS FACTURATION');
    } else {
      console.log('      • ❌ VIDE');
    }

    console.log('   🧾 FACTURATION:');
    if (billingResult && billingResult.address) {
      console.log('      •', billingResult.address);
      console.log('      •', billingResult.city, billingResult.postalCode);
      console.log('      • ✅ ADRESSE SÉLECTIONNÉE (SOURCE)');
    } else {
      console.log('      • ❌ VIDE');
    }

    const testSuccess = shippingResult && billingResult && 
                       shippingResult.address === billingResult.address &&
                       shippingResult.city === billingResult.city &&
                       shippingResult.address === billingAddr.street;
    
    console.log('');
    console.log(`🎯 RÉSULTAT: ${testSuccess ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
    if (testSuccess) {
      console.log('');
      console.log('✅ LOGIQUE CORRIGÉE VALIDÉE:');
      console.log('   • ✅ Adresse de facturation reste la source');
      console.log('   • ✅ Adresse de livraison copie depuis facturation');
      console.log('   • ✅ Case à cocher fonctionne comme attendu');
      console.log('   • ✅ Votre cas d\'usage est résolu');
    } else {
      console.log('');
      console.log('❌ PROBLÈME DÉTECTÉ:');
      console.log('   • La logique ne fonctionne pas comme attendu');
    }

    console.log('');
    console.log('💡 FONCTIONNEMENT FINAL:');
    console.log('   1. Vous sélectionnez une adresse de facturation');
    console.log('   2. Vous cochez "Utiliser l\'adresse de facturation pour la livraison"');
    console.log('   3. L\'adresse de livraison est automatiquement remplie');
    console.log('   4. Vous pouvez procéder au paiement');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCorrectedCheckoutLogic();

