const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanOrphanOffers() {
  try {
    console.log('🧹 Recherche des offres orphelines...');
    
    // Récupérer toutes les offres avec leurs plateformes
    const allOffers = await prisma.offer.findMany({
      include: {
        platformOffers: {
          include: {
            platform: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });
    
    console.log(`📊 ${allOffers.length} offres trouvées au total`);
    
    // Identifier les offres orphelines (sans plateforme)
    const orphanOffers = allOffers.filter(offer => offer.platformOffers.length === 0);
    
    console.log(`🚫 ${orphanOffers.length} offres orphelines trouvées`);
    
    if (orphanOffers.length === 0) {
      console.log('✅ Aucune offre orpheline à supprimer !');
      return;
    }
    
    console.log('\n=== OFFRES ORPHELINES ===');
    orphanOffers.forEach(offer => {
      const date = offer.createdAt.toISOString().split('T')[0];
      console.log(`❌ ${offer.name} | ${offer.price} Ar | ${date} | ID: ${offer.id}`);
    });
    
    console.log(`\n🗑️  Suppression de ${orphanOffers.length} offres orphelines...`);
    
    let deletedCount = 0;
    for (const offer of orphanOffers) {
      try {
        await prisma.offer.delete({
          where: {
            id: offer.id
          }
        });
        
        console.log(`✅ SUPPRIMÉ: ${offer.name} (${offer.id})`);
        deletedCount++;
        
      } catch (error) {
        console.error(`❌ Erreur lors de la suppression de ${offer.name} (${offer.id}):`, error.message);
      }
    }
    
    console.log(`\n🎉 Nettoyage terminé! ${deletedCount} offres orphelines supprimées.`);
    
    // Afficher le résumé final propre
    console.log('\n=== OFFRES FINALES PAR PLATEFORME ===');
    const finalOffers = await prisma.offer.findMany({
      include: {
        platformOffers: {
          include: {
            platform: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { price: 'asc' }
      ]
    });
    
    // Grouper par plateforme
    const offersByPlatform = {};
    finalOffers.forEach(offer => {
      offer.platformOffers.forEach(po => {
        const platformName = po.platform.name;
        if (!offersByPlatform[platformName]) {
          offersByPlatform[platformName] = [];
        }
        offersByPlatform[platformName].push(offer);
      });
    });
    
    Object.entries(offersByPlatform).forEach(([platformName, offers]) => {
      console.log(`\n📺 ${platformName} (${offers.length} offres):`);
      offers.forEach(offer => {
        const durationText = offer.duration === 365 ? '1 an' : `${offer.duration} jours`;
        console.log(`  • ${offer.name}: ${offer.price} Ar (${durationText}) - ${offer.maxProfiles} profils`);
      });
    });
    
    console.log(`\n📊 TOTAL: ${finalOffers.length} offres actives sur ${Object.keys(offersByPlatform).length} plateformes`);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOrphanOffers(); 