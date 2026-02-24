#!/usr/bin/env node

// Test de la logique checkout avec les vraies données
async function testCheckoutLogicWithRealData() {
  console.log('🧪 TEST LOGIQUE CHECKOUT AVEC DONNÉES RÉELLES');
  console.log('==============================================');
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
      console.log(`   ${index + 1}. ID: ${addr.id}`);
      console.log(`      Type: ${addr.type}`);
      console.log(`      Adresse: "${addr.street || 'VIDE'}", "${addr.city || 'VIDE'}" ${addr.zipCode || 'VIDE'}`);
      console.log(`      Pays: ${addr.country}`);
      console.log(`      Téléphone: ${addr.phoneNumber || 'VIDE'}`);
      console.log('');
    });

    // Trouver l'adresse de facturation utilisée dans la dernière commande
    const billingAddressId = 'cmgxsfeqm004miogovijuqoxg';
    const billingAddr = userAddresses.find(addr => addr.id === billingAddressId);
    
    if (!billingAddr) {
      console.log('❌ Adresse de facturation non trouvée');
      return;
    }

    console.log('🧪 SIMULATION DU SCÉNARIO PROBLÉMATIQUE:');
    console.log('=======================================');
    console.log('   • Adresse de facturation sélectionnée:', billingAddr.street, billingAddr.city);
    console.log('   • Case "Utiliser adresse facturation pour livraison": COCHÉE');
    console.log('   • Attente: Livraison = Facturation');
    console.log('');

    // Simuler formData comme dans le checkout
    const formData = {
      firstName: 'DINY',
      lastName: 'Oili',
      phone: '+261325550444',
      
      // Livraison non sélectionnée
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

    console.log('🔍 SIMULATION LOGIQUE ACTUELLE:');
    console.log('');

    // Simuler la logique shipping actuelle
    let shippingResult;
    console.log('📋 LOGIQUE SHIPPING:');
    
    // Si case cochée et adresse de facturation sélectionnée, utiliser celle-ci pour la livraison
    if (sameAsbilling && formData.selectedBillingAddressId && formData.selectedBillingAddressId !== 'new') {
      console.log('   ✅ Condition 1: sameAsbilling =', sameAsbilling);
      console.log('   ✅ Condition 2: selectedBillingAddressId =', formData.selectedBillingAddressId);
      console.log('   ✅ Condition 3: selectedBillingAddressId !== "new" =', formData.selectedBillingAddressId !== 'new');
      
      const selectedAddr = userAddresses.find(addr => addr.id === formData.selectedBillingAddressId);
      console.log('   🔍 Adresse trouvée:', selectedAddr ? 'OUI' : 'NON');
      
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
        console.log('   ✅ SHIPPING: Copie depuis facturation');
      }
    }
    // Si case cochée mais pas d'adresse de facturation sélectionnée, utiliser les champs manuels de facturation
    else if (sameAsbilling) {
      console.log('   ⚠️  Condition: Case cochée mais pas d\'adresse sélectionnée');
      shippingResult = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.billingAddress,
        city: formData.billingCity,
        postalCode: formData.billingZipCode,
        country: formData.billingCountry,
        phone: formData.phone
      };
      console.log('   ⚠️  SHIPPING: Copie depuis champs manuels facturation');
    }
    // Sinon, logique normale pour l'adresse de livraison
    else if (formData.selectedShippingAddressId && formData.selectedShippingAddressId !== 'new') {
      console.log('   ❌ Condition: Adresse de livraison sélectionnée');
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
      console.log('   ❌ SHIPPING: Adresse de livraison normale');
    }
    // Adresse manuelle de livraison
    else {
      console.log('   ❌ Condition: Champs manuels de livraison');
      shippingResult = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.shippingAddress,
        city: formData.shippingCity,
        postalCode: formData.shippingZipCode,
        country: formData.shippingCountry,
        phone: formData.phone
      };
      console.log('   ❌ SHIPPING: Champs manuels vides');
    }

    // Simuler la logique billing
    let billingResult;
    console.log('');
    console.log('📋 LOGIQUE BILLING:');
    
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
      console.log('   ✅ BILLING: Adresse sélectionnée');
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
      console.log('   ❌ BILLING: Champs manuels');
    }

    console.log('');
    console.log('📤 RÉSULTATS ATTENDUS:');
    console.log('   🚚 SHIPPING:');
    if (shippingResult && shippingResult.address) {
      console.log('      •', shippingResult.address);
      console.log('      •', shippingResult.city, shippingResult.postalCode);
    } else {
      console.log('      • ❌ VIDE');
    }

    console.log('   🧾 BILLING:');
    if (billingResult && billingResult.address) {
      console.log('      •', billingResult.address);
      console.log('      •', billingResult.city, billingResult.postalCode);
    } else {
      console.log('      • ❌ VIDE');
    }

    const shouldBeIdentical = shippingResult && billingResult && 
                             shippingResult.address === billingResult.address &&
                             shippingResult.city === billingResult.city;

    console.log('');
    console.log(`🎯 LOGIQUE THÉORIQUE: ${shouldBeIdentical ? '✅ DEVRAIT FONCTIONNER' : '❌ PROBLÈME DÉTECTÉ'}`);

    if (shouldBeIdentical) {
      console.log('');
      console.log('💡 LA LOGIQUE EST CORRECTE EN THÉORIE');
      console.log('   → Le problème vient peut-être d\'ailleurs:');
      console.log('   • Timing de l\'exécution');
      console.log('   • État du formulaire au moment de la soumission');
      console.log('   • Problème dans l\'API de création de commande');
      console.log('   • Cache ou état obsolète');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCheckoutLogicWithRealData();

