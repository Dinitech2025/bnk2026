const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPlatformLogos() {
  try {
    console.log('🖼️ Correction des logos des plateformes...');
    
    // Définir les vraies URLs de logos publiques
    const logoUrls = {
      'Netflix': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
      'Disney+': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
      'Amazon Prime Video': 'https://res.cloudinary.com/defgsvs5i/image/upload/v1749657512/bnk/general/iszlwtvhen6qpdjbddu2.jpg', // Déjà correct
      'Spotify': 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
      'YouTube Premium': 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg'
    };
    
    // Récupérer toutes les plateformes
    const platforms = await prisma.platform.findMany();
    
    console.log(`📊 ${platforms.length} plateformes trouvées`);
    
    let updatedCount = 0;
    
    for (const platform of platforms) {
      try {
        // Vérifier si le logo doit être mis à jour
        const needsUpdate = !platform.logo || 
                           platform.logo.includes('loremflickr.com');
        
        if (needsUpdate && logoUrls[platform.name]) {
          await prisma.platform.update({
            where: { id: platform.id },
            data: { logo: logoUrls[platform.name] }
          });
          
          console.log(`✅ ${platform.name}: Logo mis à jour vers ${logoUrls[platform.name]}`);
          updatedCount++;
        } else if (platform.logo && !platform.logo.includes('loremflickr.com')) {
          console.log(`✅ ${platform.name}: Logo déjà correct`);
        } else {
          console.log(`⚠️  ${platform.name}: Pas de logo défini dans la liste`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur pour ${platform.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 ${updatedCount} logos mis à jour !`);
    
    // Afficher le résumé final
    const updatedPlatforms = await prisma.platform.findMany();
    console.log('\n=== LOGOS FINAUX ===');
    updatedPlatforms.forEach(platform => {
      const logoStatus = platform.logo ? 
        (platform.logo.includes('loremflickr.com') ? '❌ Temporaire' : '✅ Correct') : 
        '⚠️  Manquant';
      console.log(`${platform.name}: ${logoStatus}`);
      if (platform.logo && !platform.logo.includes('loremflickr.com')) {
        console.log(`  📍 ${platform.logo}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPlatformLogos(); 