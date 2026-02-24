const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAdminAPI() {
  try {
    console.log('🔧 Test de l\'API admin pour récupérer les images du diaporama...')
    
    // Test direct de la requête Prisma
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true },
      include: {
        backgroundImages: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (banner) {
      console.log('📊 Bannière trouvée:')
      console.log(`   - ID: ${banner.id}`)
      console.log(`   - Titre: ${banner.title}`)
      console.log(`   - Diaporama activé: ${banner.backgroundSlideshowEnabled}`)
      console.log(`   - Images dans le diaporama: ${banner.backgroundImages.length}`)
      
      if (banner.backgroundImages.length > 0) {
        console.log('\n🖼️ Images du diaporama:')
        banner.backgroundImages.forEach((img, index) => {
          console.log(`${index + 1}. ${img.title} (ID: ${img.id})`)
          console.log(`   - Ordre: ${img.order}`)
          console.log(`   - URL: ${img.imageUrl.substring(0, 60)}...`)
          console.log(`   - Active: ${img.isActive}`)
        })
      }
      
      console.log('\n✅ L\'API admin devrait maintenant retourner ces images!')
      console.log('📝 Test avec curl:')
      console.log('   curl -s http://localhost:3000/api/admin/hero-banner | python -m json.tool')
      
    } else {
      console.log('❌ Aucune bannière trouvée')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminAPI()
