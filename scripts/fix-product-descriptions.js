#!/usr/bin/env node

/**
 * Script de correction : Nettoyer les descriptions de produits
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProductDescriptions() {
  try {
    console.log('🔧 NETTOYAGE DES DESCRIPTIONS DE PRODUITS');
    console.log('========================================\n');
    
    // Récupérer tous les produits avec des descriptions
    const products = await prisma.product.findMany({
      where: {
        description: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        description: true
      }
    });
    
    console.log(`📊 ${products.length} produits avec descriptions trouvés\n`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      const originalDescription = product.description;
      
      // Nettoyer la description
      const cleanedDescription = originalDescription
        .replace(/\r\n/g, ' ')  // Remplacer les retours à la ligne Windows
        .replace(/\n/g, ' ')    // Remplacer les retours à la ligne Unix
        .replace(/\r/g, ' ')    // Remplacer les retours chariot
        .replace(/\s+/g, ' ')   // Remplacer les espaces multiples par un seul
        .trim();                // Supprimer les espaces en début/fin
      
      // Vérifier si la description a changé
      if (originalDescription !== cleanedDescription) {
        console.log(`🔄 Nettoyage du produit: ${product.name}`);
        console.log(`   Avant: "${originalDescription.substring(0, 100)}..."`);
        console.log(`   Après: "${cleanedDescription.substring(0, 100)}..."`);
        
        // Mettre à jour le produit
        await prisma.product.update({
          where: { id: product.id },
          data: { description: cleanedDescription }
        });
        
        updatedCount++;
        console.log('   ✅ Mis à jour\n');
      } else {
        console.log(`✅ ${product.name} : Déjà propre`);
      }
    }
    
    console.log(`\n🎉 NETTOYAGE TERMINÉ !`);
    console.log(`   Produits mis à jour: ${updatedCount}`);
    console.log(`   Produits inchangés: ${products.length - updatedCount}`);
    
    if (updatedCount > 0) {
      console.log('\n💡 RECOMMANDATION :');
      console.log('   Actualisez la page de création de commande (Ctrl+F5)');
      console.log('   pour voir tous les produits correctement affichés.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductDescriptions();
