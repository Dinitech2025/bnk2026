const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDuplicatePlatforms() {
  try {
    console.log('🔍 Recherche des plateformes en doublon...');
    
    // Récupérer toutes les plateformes
    const platforms = await prisma.platform.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            accounts: true,
            platformOffers: true,
            giftCards: true,
            providerOffers: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Les plus anciennes en premier
      }
    });
    
    console.log('\n=== TOUTES LES PLATEFORMES ===');
    platforms.forEach(platform => {
      const date = platform.createdAt.toISOString().split('T')[0];
      console.log(`${platform.name} | ${platform.slug} | ${date} | Comptes: ${platform._count.accounts} | Offres: ${platform._count.platformOffers} | ID: ${platform.id}`);
    });
    
    // Grouper par nom pour identifier les doublons
    const grouped = {};
    platforms.forEach(platform => {
      const name = platform.name.toLowerCase().trim();
      if (!grouped[name]) {
        grouped[name] = [];
      }
      grouped[name].push(platform);
    });
    
    console.log('\n=== DOUBLONS DÉTECTÉS ===');
    const duplicates = [];
    Object.entries(grouped).forEach(([name, platformList]) => {
      if (platformList.length > 1) {
        console.log(`\n📺 ${name.toUpperCase()} (${platformList.length} doublons):`);
        platformList.forEach((platform, index) => {
          const date = platform.createdAt.toISOString().split('T')[0];
          const hasData = platform._count.accounts > 0 || platform._count.platformOffers > 0;
          console.log(`  ${index + 1}. ID: ${platform.id} | Slug: ${platform.slug} | ${date} | Comptes: ${platform._count.accounts} | Offres: ${platform._count.platformOffers} ${hasData ? '(HAS DATA)' : '(EMPTY)'}`);
        });
        
        // Garder la première (plus ancienne) et marquer les autres pour suppression
        const toKeep = platformList[0];
        const toDelete = platformList.slice(1);
        
        console.log(`  ✅ GARDER: ${toKeep.id} (${toKeep.slug}) - plus ancienne`);
        toDelete.forEach(platform => {
          console.log(`  ❌ SUPPRIMER: ${platform.id} (${platform.slug})`);
          duplicates.push(platform);
        });
      }
    });
    
    if (duplicates.length === 0) {
      console.log('\n✅ Aucun doublon trouvé !');
      return;
    }
    
    console.log(`\n🗑️  ${duplicates.length} plateformes à supprimer...`);
    
    let deletedCount = 0;
    for (const platform of duplicates) {
      try {
        // Vérifier s'il y a des données liées
        const hasData = platform._count.accounts > 0 || 
                       platform._count.platformOffers > 0 || 
                       platform._count.giftCards > 0 || 
                       platform._count.providerOffers > 0;
        
        if (hasData) {
          console.log(`⚠️  SKIP: ${platform.name} (${platform.id}) - contient des données`);
          continue;
        }
        
        await prisma.platform.delete({
          where: {
            id: platform.id
          }
        });
        
        console.log(`✅ SUPPRIMÉ: ${platform.name} (${platform.id})`);
        deletedCount++;
        
      } catch (error) {
        console.error(`❌ Erreur lors de la suppression de ${platform.name} (${platform.id}):`, error.message);
      }
    }
    
    console.log(`\n🎉 Suppression terminée! ${deletedCount} plateformes supprimées.`);
    
    // Afficher le résumé final
    console.log('\n=== PLATEFORMES RESTANTES ===');
    const finalPlatforms = await prisma.platform.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        _count: {
          select: {
            accounts: true,
            platformOffers: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    finalPlatforms.forEach(platform => {
      console.log(`${platform.name} | ${platform.slug} | Active: ${platform.isActive} | Comptes: ${platform._count.accounts} | Offres: ${platform._count.platformOffers}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicatePlatforms(); 