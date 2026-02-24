const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixBannerPriority() {
  try {
    console.log('🔧 Correction de la priorité des bannières...')
    
    // Lister toutes les bannières actives
    const activeBanners = await prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('📋 Bannières actives trouvées:', activeBanners.length)
    activeBanners.forEach((banner, index) => {
      console.log(`   ${index + 1}. ID: ${banner.id} | Titre: "${banner.title}" | Couleur titre: ${banner.titleColor}`)
    })
    
    if (activeBanners.length > 1) {
      console.log('\n🎯 Désactivation des anciennes bannières...')
      
      // Désactiver toutes sauf la plus récente
      const oldBanners = activeBanners.slice(1)
      for (const banner of oldBanners) {
        await prisma.heroBanner.update({
          where: { id: banner.id },
          data: { isActive: false }
        })
        console.log(`   ❌ Désactivée: ${banner.id} (${banner.titleColor})`)
      }
      
      console.log(`\n✅ Bannière active: ${activeBanners[0].id}`)
      console.log(`🎨 Couleurs: Titre=${activeBanners[0].titleColor}, Sous-titre=${activeBanners[0].subtitleColor}`)
    } else if (activeBanners.length === 1) {
      console.log('✅ Une seule bannière active trouvée:', activeBanners[0].id)
      console.log('🎨 Couleurs:', activeBanners[0].titleColor, activeBanners[0].subtitleColor)
    } else {
      console.log('❌ Aucune bannière active trouvée!')
    }
    
    // Vérifier le résultat final
    const finalBanner = await prisma.heroBanner.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    
    if (finalBanner) {
      console.log('\n🏆 Bannière finale active:')
      console.log('   - ID:', finalBanner.id)
      console.log('   - Titre:', finalBanner.titleColor)
      console.log('   - Sous-titre:', finalBanner.subtitleColor)
      console.log('   - Flou:', finalBanner.backgroundBlur + 'px')
      console.log('')
      console.log('🔗 Rechargez http://localhost:3000 pour voir les changements!')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixBannerPriority()
