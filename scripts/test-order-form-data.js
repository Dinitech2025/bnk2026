#!/usr/bin/env node

/**
 * Script de test : Vérification des données pour le formulaire de commande
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testOrderFormData() {
  try {
    console.log('🧪 TEST DES DONNÉES DU FORMULAIRE DE COMMANDE');
    console.log('============================================\n');
    
    // 1. Vérifier les clients
    console.log('1️⃣  CLIENTS');
    console.log('─'.repeat(50));
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        addresses: {
          select: {
            id: true,
            type: true,
            city: true,
            isDefault: true
          }
        }
      },
      take: 5
    });
    console.log(`   Total clients: ${clients.length}`);
    clients.forEach((client, i) => {
      console.log(`   ${i + 1}. ${client.firstName} ${client.lastName} (${client.email})`);
      console.log(`      Adresses: ${client.addresses.length}`);
    });
    console.log('');

    // 2. Vérifier les produits
    console.log('2️⃣  PRODUITS');
    console.log('─'.repeat(50));
    const products = await prisma.product.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        price: true,
        published: true
      },
      take: 10
    });
    console.log(`   Total produits publiés: ${products.length}`);
    products.forEach((product, i) => {
      console.log(`   ${i + 1}. ${product.name} - ${product.price} Ar`);
    });
    console.log('');

    // 3. Vérifier les services
    console.log('3️⃣  SERVICES');
    console.log('─'.repeat(50));
    const services = await prisma.service.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        price: true
      },
      take: 10
    });
    console.log(`   Total services publiés: ${services.length}`);
    services.forEach((service, i) => {
      console.log(`   ${i + 1}. ${service.name} - ${service.price} Ar`);
    });
    console.log('');

    // 4. Vérifier les offres
    console.log('4️⃣  OFFRES');
    console.log('─'.repeat(50));
    const offers = await prisma.offer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        duration: true
      },
      take: 10
    });
    console.log(`   Total offres actives: ${offers.length}`);
    offers.forEach((offer, i) => {
      console.log(`   ${i + 1}. ${offer.name} - ${offer.price} Ar (${offer.duration} jours)`);
    });
    console.log('');

    // 5. Vérifier les modes de paiement
    console.log('5️⃣  MODES DE PAIEMENT');
    console.log('─'.repeat(50));
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        feeValue: true,
        feeType: true
      }
    });
    console.log(`   Total modes de paiement actifs: ${paymentMethods.length}`);
    paymentMethods.forEach((method, i) => {
      const fee = method.feeValue ? `${method.feeValue}${method.feeType === 'PERCENTAGE' ? '%' : ' Ar'}` : 'Aucun frais';
      console.log(`   ${i + 1}. ${method.name} (${method.type}) - Frais: ${fee}`);
    });
    console.log('');

    // 6. Vérifier les modes de livraison
    console.log('6️⃣  MODES DE LIVRAISON');
    console.log('─'.repeat(50));
    const deliveryMethods = await prisma.deliveryMethod.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        estimatedDays: true,
        pricingRules: {
          select: {
            fixedPrice: true
          },
          where: { isActive: true },
          orderBy: { fixedPrice: 'asc' },
          take: 1
        }
      }
    });
    console.log(`   Total modes de livraison actifs: ${deliveryMethods.length}`);
    deliveryMethods.forEach((method, i) => {
      const price = method.pricingRules[0]?.fixedPrice || 0;
      const days = method.estimatedDays;
      const estimatedDays = days?.min || days?.max || 0;
      console.log(`   ${i + 1}. ${method.name} - ${price} Ar (${estimatedDays} jours)`);
      if (method.description) {
        console.log(`      ${method.description}`);
      }
    });
    console.log('');

    // 7. Résumé et recommandations
    console.log('📊 RÉSUMÉ');
    console.log('─'.repeat(50));
    
    const issues = [];
    const warnings = [];
    
    if (clients.length === 0) {
      issues.push('❌ Aucun client trouvé');
    } else if (clients.length < 3) {
      warnings.push('⚠️  Peu de clients disponibles');
    }
    
    if (products.length === 0) {
      issues.push('❌ Aucun produit publié');
    }
    
    if (services.length === 0) {
      warnings.push('⚠️  Aucun service publié');
    }
    
    if (offers.length === 0) {
      warnings.push('⚠️  Aucune offre active');
    }
    
    if (paymentMethods.length === 0) {
      issues.push('❌ Aucun mode de paiement actif');
    }
    
    if (deliveryMethods.length === 0) {
      issues.push('❌ Aucun mode de livraison actif');
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('   ✅ Toutes les données sont prêtes !');
      console.log('   ✅ Le formulaire de commande devrait fonctionner correctement.');
    } else {
      if (issues.length > 0) {
        console.log('   PROBLÈMES CRITIQUES:');
        issues.forEach(issue => console.log(`   ${issue}`));
      }
      if (warnings.length > 0) {
        console.log('   AVERTISSEMENTS:');
        warnings.forEach(warning => console.log(`   ${warning}`));
      }
    }
    console.log('');

    // 8. Statistiques détaillées
    console.log('📈 STATISTIQUES DÉTAILLÉES');
    console.log('─'.repeat(50));
    console.log(`   Clients avec adresses: ${clients.filter(c => c.addresses.length > 0).length}/${clients.length}`);
    console.log(`   Prix moyen produits: ${products.length > 0 ? Math.round(products.reduce((sum, p) => sum + Number(p.price), 0) / products.length).toLocaleString('fr-FR') : 0} Ar`);
    console.log(`   Prix moyen services: ${services.length > 0 ? Math.round(services.reduce((sum, s) => sum + Number(s.price), 0) / services.length).toLocaleString('fr-FR') : 0} Ar`);
    console.log(`   Prix moyen offres: ${offers.length > 0 ? Math.round(offers.reduce((sum, o) => sum + Number(o.price), 0) / offers.length).toLocaleString('fr-FR') : 0} Ar`);
    console.log('');

    console.log('✅ TEST TERMINÉ AVEC SUCCÈS !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderFormData();
