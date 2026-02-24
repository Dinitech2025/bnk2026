const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanGenericOffers() {
  try {
    console.log('🧹 Suppression des offres génériques...');
    
    // Récupérer toutes les offres
    const allOffers = await prisma.offer.findMany({
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
      }
    });
    
    console.log(`📊 ${allOffers.length} offres trouvées au total`);
    
    // Identifier les offres génériques (nom = nom de plateforme)
    const genericOffers = allOffers.filter(offer => {
      // Si l'offre a le même nom qu'une plateforme, c'est probablement générique
      const platformNames = offer.platformOffers.map(po => po.platform.name);
      return platformNames.some(platformName => 
        offer.name === platformName || 
        offer.name === platformName.split(' ')[0] // Ex: "Netflix" au lieu de "Netflix Premium"
      );
    });
    
    console.log(`🚫 ${genericOffers.length} offres génériques identifiées`);
    
    if (genericOffers.length === 0) {
      console.log('✅ Aucune offre générique à supprimer !');
      return;
    }
    
    console.log('\n=== OFFRES GÉNÉRIQUES À SUPPRIMER ===');
    genericOffers.forEach(offer => {
      const platformNames = offer.platformOffers.map(po => po.platform.name).join(', ');
      const date = offer.createdAt.toISOString().split('T')[0];
      console.log(`❌ ${offer.name} | ${platformNames || 'Aucune plateforme'} | ${offer.price} Ar | ${date} | ID: ${offer.id}`);
    });
    
    console.log(`\n🗑️  Suppression de ${genericOffers.length} offres génériques...`);
    
    let deletedCount = 0;
    for (const offer of genericOffers) {
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
    
    console.log(`\n🎉 Nettoyage terminé! ${deletedCount} offres génériques supprimées.`);
    
    // Afficher le résumé final
    console.log('\n=== OFFRES FINALES RESTANTES ===');
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
        const durationText = offer.duration === 1 && offer.durationUnit === 'YEAR' ? '1 an' : 
                            offer.duration === 1 && offer.durationUnit === 'MONTH' ? '1 mois' : 
                            `${offer.duration} ${offer.durationUnit.toLowerCase()}`;
        console.log(`  • ${offer.name}: ${offer.price} Ar (${durationText}) - ${offer.maxProfiles} profil${offer.maxProfiles > 1 ? 's' : ''}`);
      });
    });
    
    console.log(`\n📊 TOTAL FINAL: ${finalOffers.length} offres actives sur ${Object.keys(offersByPlatform).length} plateformes`);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanGenericOffers(); 