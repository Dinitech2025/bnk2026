const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanOldOffers() {
  try {
    console.log('🧹 Nettoyage des anciennes offres...');
    
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
      },
      orderBy: {
        createdAt: 'desc' // Plus récentes en premier
      }
    });
    
    console.log(`📊 ${allOffers.length} offres trouvées au total`);
    
    // Grouper par nom d'offre pour identifier les doublons
    const grouped = {};
    allOffers.forEach(offer => {
      const key = offer.name.toLowerCase().trim();
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(offer);
    });
    
    console.log('\n=== DOUBLONS DÉTECTÉS ===');
    const toDelete = [];
    
    Object.entries(grouped).forEach(([name, offers]) => {
      if (offers.length > 1) {
        console.log(`\n📦 ${name.toUpperCase()} (${offers.length} versions):`);
        
        offers.forEach((offer, index) => {
          const platformNames = offer.platformOffers.map(po => po.platform.name).join(', ');
          const date = offer.createdAt.toISOString().split('T')[0];
          console.log(`  ${index + 1}. ID: ${offer.id} | ${date} | ${platformNames || 'Aucune plateforme'} | ${offer.price} Ar`);
        });
        
        // Garder la première (plus récente) et marquer les autres pour suppression
        const toKeep = offers[0];
        const toDeleteForThisOffer = offers.slice(1);
        
        console.log(`  ✅ GARDER: ${toKeep.id} (${toKeep.createdAt.toISOString().split('T')[0]}) - plus récente`);
        toDeleteForThisOffer.forEach(offer => {
          console.log(`  ❌ SUPPRIMER: ${offer.id} (${offer.createdAt.toISOString().split('T')[0]})`);
          toDelete.push(offer);
        });
      }
    });
    
    if (toDelete.length === 0) {
      console.log('\n✅ Aucun doublon trouvé !');
      return;
    }
    
    console.log(`\n🗑️  ${toDelete.length} offres à supprimer...`);
    
    let deletedCount = 0;
    for (const offer of toDelete) {
      try {
        // Supprimer d'abord les relations PlatformOffer
        await prisma.platformOffer.deleteMany({
          where: {
            offerId: offer.id
          }
        });
        
        // Supprimer l'offre
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
    
    console.log(`\n🎉 Nettoyage terminé! ${deletedCount} offres supprimées.`);
    
    // Afficher le résumé final
    console.log('\n=== OFFRES RESTANTES ===');
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
    
    finalOffers.forEach(offer => {
      const platformNames = offer.platformOffers.map(po => po.platform.name).join(', ');
      const features = JSON.parse(offer.features || '[]');
      console.log(`${platformNames} - ${offer.name}: ${offer.price} Ar (${offer.duration} jours)`);
      console.log(`  Features: ${features.slice(0, 2).join(', ')}${features.length > 2 ? '...' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOldOffers(); 