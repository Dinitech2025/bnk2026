const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSlideshowAPI() {
  try {
    console.log('🎬 Test du diaporama d\'images de fond...')
    
    // Test direct de la base de données
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true },
      include: {
        backgroundImages: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    })
    
    if (banner) {
      console.log('📊 Bannière trouvée:')
      console.log(`   - ID: ${banner.id}`)
      console.log(`   - Diaporama activé: ${banner.backgroundSlideshowEnabled}`)
      console.log(`   - Durée: ${banner.backgroundSlideshowDuration}ms`)
      console.log(`   - Transition: ${banner.backgroundSlideshowTransition}`)
      console.log(`   - Images de fond: ${banner.backgroundImages.length}`)
      
      if (banner.backgroundImages.length > 0) {
        console.log('\n🖼️ Images du diaporama:')
        banner.backgroundImages.forEach((img, index) => {
          console.log(`${index + 1}. ${img.title} (ordre: ${img.order})`)
          console.log(`   URL: ${img.imageUrl.substring(0, 80)}...`)
        })
      }
      
      // Simuler la réponse de l'API
      console.log('\n🌐 Test de la réponse API...')
      const apiResponse = {
        ...banner,
        backgroundImages: banner.backgroundImages
      }
      
      console.log('✅ API prête avec:')
      console.log(`   - backgroundSlideshowEnabled: ${apiResponse.backgroundSlideshowEnabled}`)
      console.log(`   - backgroundImages.length: ${apiResponse.backgroundImages.length}`)
      
    } else {
      console.log('❌ Aucune bannière trouvée')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testSlideshowAPI()
