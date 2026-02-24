const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDurationUnits() {
  try {
    console.log('🕐 Correction des unités de durée des offres...');
    
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
    
    console.log(`📊 ${allOffers.length} offres trouvées`);
    
    let updatedCount = 0;
    
    for (const offer of allOffers) {
      try {
        let newDurationUnit;
        let newDuration = offer.duration;
        
        // Déterminer l'unité appropriée selon la durée
        if (offer.duration === 365) {
          newDurationUnit = 'YEAR';
          newDuration = 1; // 1 an au lieu de 365 jours
        } else if (offer.duration === 30) {
          newDurationUnit = 'MONTH';
          newDuration = 1; // 1 mois au lieu de 30 jours
        } else if (offer.duration >= 7 && offer.duration < 30) {
          newDurationUnit = 'WEEK';
          newDuration = Math.round(offer.duration / 7);
        } else {
          newDurationUnit = 'DAY';
          // Garder la durée en jours telle quelle
        }
        
        // Mettre à jour l'offre
        await prisma.offer.update({
          where: { id: offer.id },
          data: {
            duration: newDuration,
            durationUnit: newDurationUnit
          }
        });
        
        const platformNames = offer.platformOffers.map(po => po.platform.name).join(', ');
        console.log(`✅ ${platformNames} - ${offer.name}: ${offer.duration} jours → ${newDuration} ${newDurationUnit.toLowerCase()}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Erreur pour ${offer.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 ${updatedCount} offres mises à jour !`);
    
    // Afficher le résumé final avec les bonnes unités
    console.log('\n=== OFFRES AVEC UNITÉS CORRIGÉES ===');
    const updatedOffers = await prisma.offer.findMany({
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
    updatedOffers.forEach(offer => {
      offer.platformOffers.forEach(po => {
        const platformName = po.platform.name;
        if (!offersByPlatform[platformName]) {
          offersByPlatform[platformName] = [];
        }
        offersByPlatform[platformName].push(offer);
      });
    });
    
    Object.entries(offersByPlatform).forEach(([platformName, offers]) => {
      console.log(`\n📺 ${platformName}:`);
      offers.forEach(offer => {
        let durationText;
        switch (offer.durationUnit) {
          case 'YEAR':
            durationText = offer.duration === 1 ? '1 an' : `${offer.duration} ans`;
            break;
          case 'MONTH':
            durationText = offer.duration === 1 ? '1 mois' : `${offer.duration} mois`;
            break;
          case 'WEEK':
            durationText = offer.duration === 1 ? '1 semaine' : `${offer.duration} semaines`;
            break;
          case 'DAY':
          default:
            durationText = offer.duration === 1 ? '1 jour' : `${offer.duration} jours`;
            break;
        }
        
        console.log(`  • ${offer.name}: ${offer.price} Ar (${durationText}) - ${offer.maxProfiles} profil${offer.maxProfiles > 1 ? 's' : ''}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDurationUnits(); 