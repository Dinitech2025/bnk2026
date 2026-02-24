const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testHeroSlidesAPI() {
  try {
    console.log('🧪 Test complet de l\'API hero-slides...')
    
    // 1. Vérifier les slides en base
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    
    console.log(`📊 Slides actifs en DB: ${slides.length}`)
    
    // 2. Simuler la réponse de l'API publique
    console.log('\n🌐 Simulation de l\'API publique /api/public/hero-slides:')
    const apiResponse = slides.map(slide => ({
      id: slide.id,
      title: slide.title,
      description: slide.description,
      image: slide.image,
      buttonText: slide.buttonText,
      buttonLink: slide.buttonLink,
      isActive: slide.isActive,
      order: slide.order
    }))
    
    console.log('📤 Réponse API simulée:')
    console.log(`   - Nombre de slides: ${apiResponse.length}`)
    if (apiResponse.length > 0) {
      console.log(`   - Premier slide: "${apiResponse[0].title}"`)
      console.log(`   - Bouton: "${apiResponse[0].buttonText}" -> ${apiResponse[0].buttonLink}`)
    }
    
    // 3. Vérifier la bannière aussi
    console.log('\n🎨 Vérification bannière:')
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true }
    })
    
    if (banner) {
      console.log(`   - Titre: "${banner.title}"`)
      console.log(`   - Sous-titre: "${banner.subtitle}"`) 
      console.log(`   - Bouton principal: "${banner.primaryButtonText}"`)
      console.log(`   - Bouton secondaire: "${banner.secondaryButtonText}"`)
    }
    
    // 4. Test d'un fetch simulé
    console.log('\n🔗 URLs testées:')
    console.log('   - http://localhost:3000/api/public/hero-slides')
    console.log('   - http://localhost:3000/api/public/hero-banner')
    
    console.log('\n✅ Test terminé - vérifiez que ces APIs répondent dans votre navigateur!')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testHeroSlidesAPI()
