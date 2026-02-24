#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function deleteUserAddresses() {
  console.log('🗑️  SUPPRESSION ADRESSES UTILISATEUR');
  console.log('===================================');
  console.log('');

  const prisma = new PrismaClient();

  try {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: 'dinyoili@outlook.com' },
      include: {
        addresses: true
      }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log('👤 UTILISATEUR TROUVÉ:');
    console.log('   • Email:', user.email);
    console.log('   • Nom:', user.firstName, user.lastName);
    console.log('   • ID:', user.id);
    console.log('   • Nombre d\'adresses:', user.addresses.length);
    console.log('');

    if (user.addresses.length === 0) {
      console.log('✅ Aucune adresse à supprimer');
      return;
    }

    console.log('📍 ADRESSES À SUPPRIMER:');
    user.addresses.forEach((addr, index) => {
      console.log(`   ${index + 1}. ID: ${addr.id}`);
      console.log(`      Type: ${addr.type}`);
      console.log(`      Adresse: "${addr.street || 'VIDE'}", ${addr.city || 'VIDE'} ${addr.zipCode || 'VIDE'}`);
      console.log(`      Pays: ${addr.country || 'VIDE'}`);
      console.log(`      Défaut: ${addr.isDefault ? 'Oui' : 'Non'}`);
      console.log('');
    });

    // Vérifier si des commandes utilisent ces adresses
    const ordersWithAddresses = await prisma.order.findMany({
      where: {
        OR: [
          { addressId: { in: user.addresses.map(a => a.id) } },
          { billingAddressId: { in: user.addresses.map(a => a.id) } }
        ]
      },
      select: {
        id: true,
        orderNumber: true,
        addressId: true,
        billingAddressId: true
      }
    });

    if (ordersWithAddresses.length > 0) {
      console.log('⚠️  ATTENTION - ADRESSES UTILISÉES PAR DES COMMANDES:');
      ordersWithAddresses.forEach(order => {
        console.log(`   • Commande ${order.orderNumber}:`);
        if (order.addressId) {
          console.log(`     - Livraison: ${order.addressId}`);
        }
        if (order.billingAddressId) {
          console.log(`     - Facturation: ${order.billingAddressId}`);
        }
      });
      console.log('');
      console.log('💡 Ces adresses seront supprimées mais les commandes garderont leurs références');
      console.log('   (Les commandes ne seront pas affectées car les données sont dupliquées)');
      console.log('');
    }

    // Supprimer toutes les adresses
    console.log('🗑️  SUPPRESSION EN COURS...');
    
    const deleteResult = await prisma.address.deleteMany({
      where: { userId: user.id }
    });

    console.log('✅ SUPPRESSION TERMINÉE !');
    console.log('   • Adresses supprimées:', deleteResult.count);
    console.log('');

    // Vérification
    const remainingAddresses = await prisma.address.findMany({
      where: { userId: user.id }
    });

    console.log('🔍 VÉRIFICATION:');
    console.log('   • Adresses restantes:', remainingAddresses.length);
    
    if (remainingAddresses.length === 0) {
      console.log('✅ Toutes les adresses ont été supprimées avec succès');
    } else {
      console.log('❌ Certaines adresses n\'ont pas été supprimées');
      remainingAddresses.forEach(addr => {
        console.log(`   • ${addr.id}: ${addr.street}, ${addr.city}`);
      });
    }

    console.log('');
    console.log('🎯 RÉSULTAT:');
    console.log('   • Utilisateur DINY Oili n\'a plus d\'adresses');
    console.log('   • Prochaine commande devra saisir de nouvelles adresses');
    console.log('   • Les anciennes commandes gardent leurs adresses dans leurs données');

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUserAddresses();

