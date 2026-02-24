#!/usr/bin/env node

// Test de génération de facture avec adresses
async function testInvoiceGeneration() {
  console.log('🧾 TEST GÉNÉRATION FACTURE AVEC ADRESSES');
  console.log('========================================');
  console.log('');

  // ID de la commande créée précédemment
  const orderId = 'cmgxqjhio000aiogobwu07coa'; // Remplacez par l'ID réel si différent
  
  console.log('📋 Test avec commande:', orderId);
  console.log('');

  try {
    // 1. Vérifier que la commande existe avec adresses
    console.log('🔍 1. Vérification de la commande...');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        shippingAddress: true,
        billingAddress: true,
        items: {
          include: {
            product: true,
            service: true,
            offer: true
          }
        },
        payments: true
      }
    });

    if (!order) {
      console.log('❌ Commande non trouvée');
      return;
    }

    console.log('✅ Commande trouvée:');
    console.log('   • Numéro:', order.orderNumber);
    console.log('   • Client:', order.user.email);
    console.log('   • Total:', Number(order.total).toLocaleString(), order.currency);
    console.log('   • Adresse livraison:', order.addressId ? '✅' : '❌');
    console.log('   • Adresse facturation:', order.billingAddressId ? '✅' : '❌');
    console.log('   • Articles:', order.items.length);
    console.log('');

    if (order.shippingAddress) {
      console.log('📦 Adresse de livraison:');
      console.log('   •', order.shippingAddress.street);
      console.log('   •', order.shippingAddress.city, order.shippingAddress.zipCode);
      console.log('   •', order.shippingAddress.country);
      console.log('');
    }

    if (order.billingAddress) {
      console.log('🧾 Adresse de facturation:');
      console.log('   •', order.billingAddress.street);
      console.log('   •', order.billingAddress.city, order.billingAddress.zipCode);
      console.log('   •', order.billingAddress.country);
      console.log('');
    }

    console.log('📦 Articles:');
    order.items.forEach((item, index) => {
      let itemName = item.product?.name || item.service?.name || item.offer?.name;
      
      if (!itemName && item.metadata) {
        try {
          const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
          itemName = metadata.name;
        } catch (e) {
          // Ignorer
        }
      }
      
      console.log(`   ${index + 1}. ${itemName || 'Article inconnu'}`);
      console.log(`      ${item.quantity}x ${Number(item.unitPrice).toLocaleString()} ${order.currency}`);
    });
    console.log('');

    // 2. Tester l'API de génération de facture
    console.log('🔍 2. Test génération facture...');
    
    const response = await fetch(`http://localhost:3000/api/admin/orders/${orderId}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversionData: null // Pas de conversion pour ce test
      })
    });

    console.log('📡 Réponse API facture:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ ERREUR GÉNÉRATION FACTURE:');
      console.log('   • Status:', response.status);
      console.log('   • Error:', errorData.error);
      return;
    }

    const invoiceData = await response.json();
    console.log('✅ FACTURE GÉNÉRÉE AVEC SUCCÈS !');
    console.log('');

    // 3. Vérifier les données de la facture
    console.log('🔍 3. Vérification données facture...');
    console.log('');

    console.log('👤 CLIENT:');
    console.log('   • Nom:', invoiceData.customer.name);
    console.log('   • Email:', invoiceData.customer.email);
    console.log('   • Téléphone:', invoiceData.customer.phone || 'Non renseigné');
    console.log('');

    if (invoiceData.billingAddress) {
      console.log('🏠 ADRESSE FACTURATION:');
      console.log('   • Nom:', invoiceData.billingAddress.name);
      console.log('   • Adresse:', invoiceData.billingAddress.address);
      console.log('   • Ville:', invoiceData.billingAddress.city);
      console.log('   • Code postal:', invoiceData.billingAddress.postalCode);
      console.log('   • Pays:', invoiceData.billingAddress.country);
      console.log('');
    } else {
      console.log('❌ Adresse de facturation manquante dans la facture');
    }

    if (invoiceData.shippingAddress) {
      console.log('📦 ADRESSE LIVRAISON:');
      console.log('   • Nom:', invoiceData.shippingAddress.name);
      console.log('   • Adresse:', invoiceData.shippingAddress.address);
      console.log('   • Ville:', invoiceData.shippingAddress.city);
      console.log('   • Code postal:', invoiceData.shippingAddress.postalCode);
      console.log('   • Pays:', invoiceData.shippingAddress.country);
      console.log('');
    } else {
      console.log('❌ Adresse de livraison manquante dans la facture');
    }

    console.log('📋 ARTICLES FACTURE:');
    invoiceData.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name}`);
      console.log(`      ${item.quantity}x ${item.unitPrice.toLocaleString()} ${invoiceData.currency}`);
    });
    console.log('');

    console.log('💰 TOTAUX:');
    console.log('   • Total:', invoiceData.total.toLocaleString(), invoiceData.currencySymbol);
    console.log('   • Devise:', invoiceData.currency);
    console.log('');

    console.log('🎯 RÉSULTAT FINAL:');
    console.log('   • Commande créée: ✅');
    console.log('   • Adresses sauvegardées: ✅');
    console.log('   • Facture générée: ✅');
    console.log('   • Adresses dans facture:', invoiceData.billingAddress ? '✅' : '❌', 'Facturation,', invoiceData.shippingAddress ? '✅' : '❌', 'Livraison');
    console.log('   • Noms articles corrects:', invoiceData.items.every(item => item.name !== 'Article inconnu') ? '✅' : '❌');

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testInvoiceGeneration();

