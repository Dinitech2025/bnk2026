#!/usr/bin/env node

// Nettoyer l'adresse vide problématique
async function cleanEmptyAddress() {
  console.log('🧹 NETTOYAGE ADRESSE VIDE PROBLÉMATIQUE');
  console.log('======================================');
  console.log('');

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const emptyAddressId = 'cmgxrkt2c002xiogo97jppwuw';
    
    console.log('🔍 Vérification de l\'adresse vide:', emptyAddressId);
    
    const emptyAddress = await prisma.address.findUnique({
      where: { id: emptyAddressId },
      include: {
        orders: true,
        billingOrders: true
      }
    });

    if (!emptyAddress) {
      console.log('❌ Adresse non trouvée');
      return;
    }

    console.log('📋 DÉTAILS DE L\'ADRESSE:');
    console.log('   • Rue:', `"${emptyAddress.street || 'VIDE'}"`);
    console.log('   • Ville:', `"${emptyAddress.city || 'VIDE'}"`);
    console.log('   • Code postal:', `"${emptyAddress.zipCode || 'VIDE'}"`);
    console.log('   • Pays:', `"${emptyAddress.country || 'VIDE'}"`);
    console.log('   • Type:', emptyAddress.type);
    console.log('');

    console.log('🔗 UTILISATION:');
    console.log('   • Commandes (shipping):', emptyAddress.orders.length);
    console.log('   • Commandes (billing):', emptyAddress.billingOrders.length);
    
    if (emptyAddress.orders.length > 0) {
      console.log('   📦 Commandes shipping:');
      emptyAddress.orders.forEach(order => {
        console.log(`      - ${order.orderNumber} (${order.status})`);
      });
    }
    
    if (emptyAddress.billingOrders.length > 0) {
      console.log('   🧾 Commandes billing:');
      emptyAddress.billingOrders.forEach(order => {
        console.log(`      - ${order.orderNumber} (${order.status})`);
      });
    }

    const isEmpty = !emptyAddress.street && !emptyAddress.city && !emptyAddress.zipCode;
    
    if (isEmpty) {
      console.log('');
      console.log('⚠️  ADRESSE CONFIRMÉE COMME VIDE');
      console.log('');
      console.log('💡 RECOMMANDATION:');
      console.log('   • Cette adresse vide ne devrait plus être réutilisée');
      console.log('   • La logique API a été mise à jour pour l\'ignorer');
      console.log('   • Les nouvelles commandes créeront de nouvelles adresses');
      console.log('');
      console.log('✅ AUCUNE ACTION NÉCESSAIRE');
      console.log('   → L\'adresse reste pour l\'historique');
      console.log('   → Mais ne sera plus réutilisée');
    } else {
      console.log('');
      console.log('✅ Adresse non vide, pas de problème');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanEmptyAddress();

